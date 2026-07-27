# ml-service — Placas-Deteccion-Robo

Servicio FastAPI: YOLOv8 (detección de placa) + EasyOCR (lectura del texto).

## Requisitos previos

1. Haber corrido los notebooks `01_eda.ipynb` → `02_preprocessing.ipynb` → `03_training_yolo.ipynb` en Google Colab.
2. Haber bajado los pesos entrenados y puestos en `model/yolov8n_placas.pt` (o `.onnx`).

## Instalación local

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

## Levantar el servicio

```bash
uvicorn app.main:app --reload --port 8000
```

- Docs interactivas (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Endpoint principal

`POST /detect`
- Body: `multipart/form-data`, campo `file` con la imagen.
- Respuesta:
```json
{
  "placa": "ABC123",
  "confianza_deteccion": 0.91,
  "confianza_ocr": 0.87,
  "bbox": [120, 45, 340, 110],
  "mensaje": "Placa detectada y leída correctamente",
  "tiempo_procesamiento_ms": 245.3
}
```

## Variables de entorno (opcionales)

| Variable | Default | Descripción |
|---|---|---|
| `YOLO_MODEL_PATH` | `model/yolov8n_placas.pt` | Ruta al modelo entrenado |
| `YOLO_CONFIDENCE_THRESHOLD` | `0.4` | Confianza mínima para aceptar una detección |
| `ALLOWED_ORIGINS` | `*` | Orígenes permitidos por CORS (ej. URL del backend NestJS) |

## Siguiente paso

El backend NestJS (con Postgres + Prisma) consume este endpoint reenviando la imagen recibida del frontend, y guarda `placa`, `confianza_deteccion`, `confianza_ocr` y `bbox` en la tabla `detecciones`.
