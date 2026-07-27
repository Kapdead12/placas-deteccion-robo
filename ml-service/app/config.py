import os
import re

# Ruta al modelo YOLO entrenado (generado por 03_training_yolo.ipynb y copiado a ml-service/model/)
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "model/yolov8n_placas.pt")

# Idiomas para EasyOCR. Las placas usan caracteres alfanuméricos latinos, "en" cubre eso
# sin cargar un modelo de idioma innecesario (no hay texto en español dentro de una placa).
OCR_LANGUAGES = ["en"]

# Confianza mínima para aceptar una detección de YOLO como "placa válida"
CONFIDENCE_THRESHOLD = float(os.getenv("YOLO_CONFIDENCE_THRESHOLD", "0.4"))

# Confianza mínima por fragmento de EasyOCR para considerarlo parte de la
# placa. Descarta ruido de fondo (marco, texto del país, tornillos, etc.)
# que EasyOCR a veces lee junto con la placa real.
MIN_OCR_FRAGMENT_CONFIDENCE = float(os.getenv("MIN_OCR_FRAGMENT_CONFIDENCE", "0.2"))

# Formato esperado del texto ya normalizado (mayúsculas, sin espacios/símbolos).
# Default: formato boliviano real (padrón vehicular de El Alto) — 3 a 4
# dígitos seguidos de 3 letras (ej. "2959UKK", "751ENT"), NO letras+dígitos.
# Ver prisma/seed.ts, que ahora siembra placas reales de ese padrón.
# Ajustar via env si el formato real de placas difiere.
PLATE_REGEX = os.getenv("PLATE_REGEX", r"^[0-9]{3,4}[A-Z]{3}$")
PLATE_PATTERN = re.compile(PLATE_REGEX)

# Origenes permitidos para CORS (ajustar cuando el backend NestJS tenga URL definitiva)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
