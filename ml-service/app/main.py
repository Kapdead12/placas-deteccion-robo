import logging
import time
from typing import Optional

import cv2
import easyocr
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

from app.config import (
    ALLOWED_ORIGINS,
    CONFIDENCE_THRESHOLD,
    MIN_OCR_FRAGMENT_CONFIDENCE,
    MODEL_PATH,
    OCR_LANGUAGES,
    PLATE_PATTERN,
)
from app.preprocessing import preprocess_for_ocr
from app.schemas import DeteccionResponse, HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("placas-ml-service")

app = FastAPI(
    title="Placas Deteccion Robo - ML Service",
    description="Servicio de IA: YOLOv8 (detección de placa) + EasyOCR (lectura de texto). Punto 7-8 del PDF.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Los modelos se cargan una única vez al levantar el servicio, no en cada request
yolo_model: Optional[YOLO] = None
ocr_reader: Optional[easyocr.Reader] = None


@app.on_event("startup")
def load_models() -> None:
    global yolo_model, ocr_reader

    logger.info("Cargando modelo YOLO desde %s", MODEL_PATH)
    yolo_model = YOLO(MODEL_PATH)

    logger.info("Cargando EasyOCR (idiomas: %s)", OCR_LANGUAGES)
    ocr_reader = easyocr.Reader(OCR_LANGUAGES, gpu=False)

    logger.info("Modelos cargados correctamente")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        yolo_cargado=yolo_model is not None,
        ocr_cargado=ocr_reader is not None,
    )


@app.post("/detect", response_model=DeteccionResponse)
def detect(file: UploadFile = File(...)) -> DeteccionResponse:
    # def (no async def): YOLO.predict() y EasyOCR.readtext() son síncronos y
    # bloqueantes (varios segundos de CPU). Como handler async, correrían en
    # el hilo del event loop y bloquearían TODO el servicio (incluido
    # /health) mientras procesan. FastAPI manda los handlers `def` normales
    # a un threadpool automáticamente, así que el servicio sigue respondiendo.
    if yolo_model is None or ocr_reader is None:
        raise HTTPException(status_code=503, detail="Modelos aún no cargados, reintentar en unos segundos")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    contents = file.file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="No se pudo decodificar la imagen")

    t0 = time.time()

    # --- 1) Detección con YOLO ---
    results = yolo_model.predict(image, conf=CONFIDENCE_THRESHOLD, verbose=False)
    boxes = results[0].boxes

    if boxes is None or len(boxes) == 0:
        return DeteccionResponse(
            placa=None,
            confianza_deteccion=0.0,
            confianza_ocr=0.0,
            bbox=None,
            mensaje="No se detectó ninguna placa en la imagen",
            tiempo_procesamiento_ms=round((time.time() - t0) * 1000, 1),
        )

    # Se asume 1 placa por imagen (dataset y caso de uso simplificado): nos quedamos
    # con la detección de mayor confianza.
    best_idx = int(boxes.conf.argmax())
    x1, y1, x2, y2 = boxes.xyxy[best_idx].tolist()
    det_conf = float(boxes.conf[best_idx])

    x1, y1, x2, y2 = (max(0, int(v)) for v in (x1, y1, x2, y2))
    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        raise HTTPException(status_code=422, detail="Bounding box inválido detectado")

    # --- 2) Preprocesamiento del recorte antes del OCR ---
    processed_crop = preprocess_for_ocr(crop)

    # --- 3) Lectura con EasyOCR ---
    ocr_results = ocr_reader.readtext(processed_crop)

    placa_normalizada, ocr_conf, motivo_descarte = _extraer_placa(ocr_results)

    if placa_normalizada is None:
        mensaje = (
            "Se detectó una placa pero no se pudo leer el texto"
            if motivo_descarte == "sin_fragmentos"
            else "Se detectó una placa pero el texto leído no tiene formato válido"
        )
        return DeteccionResponse(
            placa=None,
            confianza_deteccion=round(det_conf, 4),
            confianza_ocr=round(ocr_conf, 4),
            bbox=[x1, y1, x2, y2],
            mensaje=mensaje,
            tiempo_procesamiento_ms=round((time.time() - t0) * 1000, 1),
        )

    return DeteccionResponse(
        placa=placa_normalizada,
        confianza_deteccion=round(det_conf, 4),
        confianza_ocr=round(ocr_conf, 4),
        bbox=[x1, y1, x2, y2],
        mensaje="Placa detectada y leída correctamente",
        tiempo_procesamiento_ms=round((time.time() - t0) * 1000, 1),
    )


def _normalizar_placa(texto: str) -> str:
    """Deja solo caracteres alfanuméricos en mayúscula, como se espera de una placa."""
    return "".join(c for c in texto.upper() if c.isalnum())


def _extraer_placa(ocr_results: list) -> tuple[Optional[str], float, Optional[str]]:
    """
    Arma el texto de la placa a partir de los fragmentos que devuelve EasyOCR.

    EasyOCR puede leer, además de la placa, texto de fondo (marco, país,
    tornillos) con baja confianza. Concatenar todos los fragmentos a ciegas
    (como se hacía antes) produce strings como "REPUBLICADEPANAMAABC123" que
    nunca matchean contra `placas_reportadas`. Acá se descartan los
    fragmentos de baja confianza y se valida que el resultado final tenga
    forma de placa antes de aceptarlo.

    Devuelve (placa_o_None, confianza_promedio, motivo_de_descarte_o_None).
    """
    if not ocr_results:
        return None, 0.0, "sin_fragmentos"

    fragmentos_validos = [r for r in ocr_results if r[2] >= MIN_OCR_FRAGMENT_CONFIDENCE]
    if not fragmentos_validos:
        return None, 0.0, "sin_fragmentos"

    texto_crudo = "".join(r[1] for r in fragmentos_validos)
    ocr_conf = float(np.mean([r[2] for r in fragmentos_validos]))
    placa_normalizada = _normalizar_placa(texto_crudo)

    if not PLATE_PATTERN.match(placa_normalizada):
        return None, ocr_conf, "formato_invalido"

    return placa_normalizada, ocr_conf, None
