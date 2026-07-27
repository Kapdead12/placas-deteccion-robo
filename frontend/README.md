# Placas-Deteccion-Robo — Frontend (Next.js)

Consola de escaneo de placas (ANPR). Punto 9 del PDF: visualización de
resultados (bbox + texto leído) y lógica de negocio (alerta si la placa
está reportada).

## Setup

```bash
cd frontend
npm install
copy .env.local.example .env.local   # ajustar NEXT_PUBLIC_API_URL si hace falta
npm run dev
```

Abrí http://localhost:3000

## Requisitos

- El backend NestJS corriendo en `NEXT_PUBLIC_API_URL` (por defecto `http://localhost:3001`)
- El backend, a su vez, necesita el ml-service (FastAPI) levantado en `http://localhost:8000`

## Páginas

- `/` — landing
- `/detectar` — subir/capturar imagen, ver bbox dibujado sobre la imagen y el
  resultado (placa leída + alerta si está reportada)
- `/historial` — lista de detecciones pasadas (`GET /deteccion`)

## Lenguaje visual

Consola tipo cámara de seguridad / lector LPR: fondo grafito oscuro, placa
leída en fuente monoespaciada grande (estilo display LED), línea de escaneo
animada sobre la imagen mientras se procesa. Ámbar = estado normal, rojo =
placa reportada, verde = sin reportes.
