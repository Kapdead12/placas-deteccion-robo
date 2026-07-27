# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

# libgl1 y libglib2.0-0: dependencias de sistema de OpenCV/EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# cache mount: en rebuilds futuros (mismo requirements.txt) no vuelve a
# descargar los wheels de torch/easyocr/opencv, aunque se invalide la capa
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY app ./app

# model/ se monta como volumen (los pesos .pt se generan en Colab y se
# copian a mano, no viven en la imagen)
RUN mkdir -p model

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
