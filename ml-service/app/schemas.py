from typing import List, Optional

from pydantic import BaseModel, Field


class DeteccionResponse(BaseModel):
    """
    Respuesta del endpoint /detect.
    Este es el contrato que consume el backend NestJS (punto 8 del PDF:
    integración y consumo del modelo vía API).
    """
    placa: Optional[str] = Field(None, description="Texto de la placa leído y normalizado (mayúsculas, sin espacios)")
    confianza_deteccion: float = Field(..., description="Confianza de YOLO en la detección del bounding box (0-1)")
    confianza_ocr: float = Field(..., description="Confianza promedio de EasyOCR en la lectura del texto (0-1)")
    bbox: Optional[List[int]] = Field(None, description="[x1, y1, x2, y2] del bounding box de la placa en la imagen original")
    mensaje: str = Field(..., description="Mensaje legible sobre el resultado del procesamiento")
    tiempo_procesamiento_ms: float = Field(..., description="Tiempo total de inferencia (YOLO + OCR) en milisegundos")


class HealthResponse(BaseModel):
    status: str
    yolo_cargado: bool
    ocr_cargado: bool
