# Placas-Deteccion-Robo

Sistema de detección de placas vehiculares (YOLOv8 + EasyOCR) con verificación
contra una lista de placas reportadas. Ver `plan-placas-deteccion-robo.md`
para la arquitectura completa (v2 simplificada).

```
Next.js (3000) → NestJS (3001) → FastAPI ml-service (8000) → PostgreSQL (5432)
```

## Correr todo con Docker

```bash
copy .env.example .env      # ajustar credenciales de Postgres si querés
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend (Swagger si lo agregás después): http://localhost:3001
- ml-service: http://localhost:8000/health
- Postgres: localhost:5432

`docker compose up` levanta los 4 servicios juntos: el backend espera a que
Postgres esté healthy y corre `prisma migrate deploy` automáticamente antes
de arrancar (usa las migraciones que ya generaste en local con
`prisma migrate dev`).

### Importante: pesos del modelo YOLO

El `ml-service` NO entrena el modelo dentro del contenedor. Necesita que ya
tengas `yolov8n_placas.pt` en `ml-service/model/` (generado en Colab con los
notebooks de `ml-service/notebooks/`) — ese directorio está montado como
volumen, así que solo hace falta que el archivo exista ahí, sin rebuildear
la imagen. Si el modelo no está, el contenedor `ml-service` va a fallar al
arrancar (`YOLO(MODEL_PATH)` no encuentra el archivo).

### Notas

- `NEXT_PUBLIC_API_URL` del frontend se hornea en build time apuntando a
  `http://localhost:3001` (el puerto publicado en el host), no al nombre del
  servicio de Docker — el navegador corre fuera de la red interna de
  Compose.
- El primer arranque del `ml-service` tarda más porque EasyOCR descarga sus
  modelos de detección/reconocimiento la primera vez; quedan cacheados en el
  volumen `easyocr_cache` para los próximos arranques.
- Para desarrollo normal (sin Docker) cada servicio sigue corriendo suelto
  como hasta ahora (`npm run dev`, `npm run start:dev`, `uvicorn ...`) — ver
  el README de cada carpeta.
