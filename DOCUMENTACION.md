# Placas-Deteccion-Robo — Documentación del sistema

Sistema de detección de placas vehiculares (ANPR) con YOLOv8 + EasyOCR, que
cruza cada lectura contra una lista de placas reportadas como robadas y genera
alertas gestionables por un operador.

```
Next.js (3000) → NestJS (3001) → FastAPI ml-service (8000) → PostgreSQL (5432)
```

- **frontend/** — Next.js 16 + React 19 + Tailwind v4. Consola con login, dashboard, escaneo, historial, alertas, cámaras y placas reportadas.
- **backend/** — NestJS + Prisma + PostgreSQL. Autenticación JWT, lógica de negocio (match contra placas reportadas), API REST.
- **ml-service/** — FastAPI + Ultralytics YOLOv8 + EasyOCR. Recibe una imagen, detecta la placa y lee el texto.

---

## 1. Clonar y levantar el proyecto

### 1.1 Clonar

```bash
git clone https://github.com/Kapdead12/placas-deteccion-robo.git
cd placas-deteccion-robo
```

### 1.2 Archivos que NO vienen en git (copiar a mano)

Estos son secretos o binarios pesados, excluidos a propósito por `.gitignore`.
Sin ellos el sistema no arranca:

| Archivo | A partir de | Por qué falta |
|---|---|---|
| `.env` (raíz) | `.env.example` | Credenciales de Postgres + `JWT_SECRET` |
| `backend/.env` | `backend/.env.example` | Config de conexión para correr el backend sin Docker |
| `frontend/.env.local` | `frontend/.env.local.example` | URL del backend para el frontend en dev |
| `ml-service/model/yolov8n_placas.pt` | — (ver sección 5) | Peso del modelo entrenado, no es código |
| `ml-service/model/yolov8n_placas.onnx` | — (opcional, no lo usa el servicio) | Export ONNX del mismo modelo |

```bash
copy .env.example .env
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
```

Editá `.env` y `backend/.env` y poné un `JWT_SECRET` real (no dejes el de
ejemplo). Podés generarlo con:

```bash
openssl rand -base64 48
```

### 1.3 Levantar todo con Docker (recomendado)

```bash
docker compose up --build
```

Esto levanta los 4 servicios. El backend espera a que Postgres esté healthy,
corre las migraciones de Prisma automáticamente y siembra datos iniciales
(usuario admin + placas reportadas de ejemplo) antes de arrancar.

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- ml-service: http://localhost:8000/health
- Postgres: localhost:5432

**Login inicial (sembrado automáticamente):**
```
email:    admin@placas-deteccion-robo.local
password: admin123
```

### 1.4 Correr sin Docker (desarrollo suelto)

Cada servicio corre por separado, en tres terminales:

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev

# ml-service
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Necesitás Postgres corriendo aparte (podés usar solo el contenedor de
`postgres` del `compose.yml`: `docker compose up postgres`).

---

## 2. Arquitectura y flujo de una detección

```
1. Usuario sube/captura una imagen en /detectar (frontend)
2. POST /deteccion (backend) — valida tamaño (10MB) y magic number del archivo
3. Backend reenvía la imagen a POST /detect (ml-service)
4. ml-service:
   a. YOLOv8n localiza el bounding box de la placa (umbral conf >= 0.4)
   b. Recorta y preprocesa la región (escala de grises, deskew, threshold)
   c. EasyOCR lee el texto de la región
   d. Filtra fragmentos de baja confianza y valida el resultado contra el
      formato real de placa boliviana (dígitos + letras, ej. "2959UKK")
   e. Devuelve: placa, confianza_deteccion, confianza_ocr, bbox, mensaje
5. Backend recibe el resultado y aplica la lógica de negocio:
   a. Si confianza_ocr < umbral (0.5 por defecto) → NO se cruza contra
      placas reportadas (evita alertas falsas por lecturas basura)
   b. Si es confiable, busca match exacto en placas_reportadas
   c. Si no hay match exacto, busca un match aproximado (distancia de
      edición <= 1) para tolerar confusiones típicas de OCR (0↔O, 1↔I, 5↔S, 8↔B)
   d. Guarda la Deteccion (siempre, haya match o no)
   e. Si matcheó una placa reportada ACTIVA → crea una Alerta
6. Frontend muestra el resultado: verde "Sin reportes", rojo "Placa reportada"
   o ámbar "Coincidencia probable" (match aproximado)
```

### 2.1 Dónde está cada pieza de esta lógica

| Lógica | Archivo |
|---|---|
| Detección YOLO + OCR + normalización | `ml-service/app/main.py` (función `detect`, `_extraer_placa`) |
| Preprocesamiento de imagen (deskew, threshold) | `ml-service/app/preprocessing.py` |
| Formato de placa válido (regex) | `ml-service/app/config.py` → `PLATE_REGEX` |
| Umbral de confianza para alertar | `backend/src/deteccion/deteccion.service.ts` → `minOcrConfianzaAlerta` (env `MIN_OCR_CONFIANZA_ALERTA`, default 0.5) |
| Match exacto + aproximado (Levenshtein) | `backend/src/deteccion/deteccion.service.ts` → `buscarPlacaReportada` |
| Distancia de edición | `backend/src/deteccion/levenshtein.util.ts` |
| Validación de archivo subido | `backend/src/deteccion/deteccion.controller.ts` (tamaño + magic number real) |

---

## 3. Autenticación y roles

- JWT emitido en `POST /auth/login` (única ruta pública, marcada con `@Public()`).
- Todas las demás rutas requieren `Authorization: Bearer <token>` — lo aplica
  un guard global (`JwtAuthGuard` vía `APP_GUARD` en `app.module.ts`).
- El token se revalida contra la base en cada request (`JwtStrategy.validate`):
  si el usuario fue borrado, el token deja de servir aunque no haya expirado.
- Rate limiting: `POST /auth/login` permite 5 intentos/minuto por IP
  (`@nestjs/throttler`); el resto de la API, 30 req/min.
- Roles: `ADMIN` y `OPERADOR` (enum `Rol` en `schema.prisma`), viajan en el JWT
  pero **no hay un guard de roles aplicado todavía** — cualquier usuario
  autenticado puede hacer cualquier operación. Si necesitás restringir por rol
  (ej. solo ADMIN puede reportar placas), es una mejora pendiente.
- Sesión en el frontend: token guardado en `localStorage` (`lib/auth-context.tsx`),
  se limpia automáticamente si el backend responde 401.

---

## 4. Alertas — cómo funcionan

Una **Alerta** es un registro separado de la **Deteccion** cruda: se crea
**solo** cuando una detección matchea una placa reportada activa (ver flujo
en la sección 2). Esto mantiene el historial de detecciones (todas, siempre)
separado de la bandeja de trabajo del operador (solo las que importan).

### Estados (`EstadoAlerta`)

| Estado | Significado |
|---|---|
| `PENDIENTE` | Estado inicial al crearse, sin revisar |
| `REVISADA` | Un operador la marcó como atendida/confirmada |
| `DESCARTADA` | Un operador la marcó como falso positivo/no relevante |

Al pasar de `PENDIENTE` a cualquier otro estado, se guarda **quién** la
atendió (`atendidaPorId`, tomado del JWT del usuario logueado) y **cuándo**
(`fechaAtencion`). Volver a `PENDIENTE` limpia ambos campos.

### Endpoints

- `GET /alertas` — lista todas, con la detección y el usuario que la atendió (si aplica).
- `PATCH /alertas/:id` — cambia el estado (`{ "estado": "REVISADA" }`).

### Dónde está en el código

- Backend: `backend/src/alertas/` (controller, service, DTO).
- Frontend: `frontend/app/alertas/page.tsx` — lista con selector de estado y
  badges de color (rojo=pendiente, verde=revisada, gris=descartada).
- El dashboard (`frontend/app/page.tsx`) muestra un resumen de alertas
  pendientes recientes y el conteo total como KPI.

### Coincidencia aproximada

Si el match fue por distancia de edición (no exacto), la `Deteccion` y la
`Alerta` asociada quedan marcadas con `coincidenciaAproximada: true`, y el
frontend muestra "⚠️ Posible placa reportada (coincidencia aproximada,
revisar)" en vez del mensaje de match confirmado — para que el operador la
trate con más cautela que un match exacto.

---

## 5. El modelo de detección (YOLOv8) — dónde está todo

### 5.1 Notebooks (entrenamiento, en `ml-service/notebooks/`)

| Notebook | Qué hace |
|---|---|
| `01_eda.ipynb` | Descarga el dataset (Kaggle, "Car License Plate Detection", andrewmvd) y hace el análisis exploratorio |
| `02_preprocessing.ipynb` | Convierte anotaciones XML→YOLO, arma los splits train/val/test, genera `data.yaml` |
| `03_training_yolo.ipynb` | Entrena YOLOv8n y YOLOv8s, los compara, exporta el ganador a `ml-service/model/` |

Corren en **Google Colab** (con GPU gratuita) o en un **venv local** — ambos
casos ya soportados (`IN_COLAB` se detecta solo). Ver sección 1.4 para el venv.

### 5.2 Dónde quedan las métricas de cada corrida

Cada vez que se entrena, Ultralytics guarda una carpeta nueva en
`ml-service/runs/detect/<nombre>/` (no se versiona en git, se regenera):

```
runs/detect/<nombre>/
├── results.csv              # métricas por época: precision, recall, mAP50, mAP50-95
├── results.png              # gráficos de esas curvas
├── confusion_matrix.png
├── PR_curve.png              # curva precision-recall (mAP = área bajo esta curva)
├── val_batch0_pred.jpg       # predicciones reales sobre imágenes de validación
├── val_batch0_labels.jpg     # las mismas imágenes con las etiquetas verdaderas
└── weights/
    ├── best.pt                # el checkpoint con mejor mAP durante el entrenamiento
    └── last.pt                # el checkpoint de la última época
```

**Cómo leerlas:** comparar `val_batch0_pred.jpg` contra `val_batch0_labels.jpg`
del mismo run es la forma más rápida de ver si el modelo realmente detecta
bien (no solo confiar en el número de mAP).

### 5.3 Modelo actualmente en producción

- Archivo: `ml-service/model/yolov8n_placas.pt` (no está en git, se copia a mano).
- Viene de: `runs/detect/placas_yolov8n/weights/best.pt` (corrida de 25/30
  épocas con augmentation, ver `03_training_yolo.ipynb` sección 3.6 para la
  comparación completa contra YOLOv8s y la justificación de la elección).
- Métricas: precision 0.953, recall 0.867, **mAP50 0.949**, mAP50-95 0.510.
- Validado también en vivo contra el servicio real: 95.5% de detección
  (42/44 imágenes del test set), confianza promedio 0.771.

Variables de entorno relacionadas (`ml-service/app/config.py` / `compose.yml`):

| Variable | Default | Qué controla |
|---|---|---|
| `YOLO_MODEL_PATH` | `model/yolov8n_placas.pt` | Qué archivo de pesos carga el servicio |
| `YOLO_CONFIDENCE_THRESHOLD` | `0.4` | Confianza mínima de YOLO para aceptar una detección |
| `MIN_OCR_FRAGMENT_CONFIDENCE` | `0.2` | Confianza mínima por fragmento de EasyOCR |
| `PLATE_REGEX` | `^[0-9]{3,4}[A-Z]{3}$` | Formato de placa aceptado (boliviano: dígitos+letras) |

### 5.4 Validar el modelo contra imágenes reales

```bash
cd ml-service
.venv\Scripts\activate
uvicorn app.main:app --reload   # en una terminal

# en otra terminal, con el mismo venv
python test_detect_batch.py
```

Corre las 44 imágenes de `data/processed/images/test/` contra el servicio
real y tira un resumen de **tasa de lectura** (no accuracy — el dataset no
tiene ground truth de texto, solo bounding boxes). Genera también
`placas_leidas.csv` con cada lectura, para revisar manualmente qué tan
correctas son.

> ⚠️ Importante: el dataset de entrenamiento (Kaggle) tiene placas
> internacionales (India, UK, US), no bolivianas. La detección del
> rectángulo (YOLO) generaliza razonablemente entre países, pero el texto
> leído casi nunca va a matchear `PLATE_REGEX` contra ese test set — eso es
> esperado, no un bug. Para medir precisión de OCR contra placas bolivianas
> reales hay que probar con fotos reales, no con este dataset.

---

## 6. Estructura del proyecto

```
Placas-Deteccion-Robo/
├── compose.yml                 # orquesta los 4 servicios
├── .env                        # secretos de Docker Compose (no en git)
├── frontend/                   # Next.js
│   ├── app/                    # páginas: login, detectar, historial, alertas, camaras, placas
│   ├── components/             # sidebar, topbar, app-shell, badges, etc.
│   └── lib/api.ts               # cliente HTTP contra el backend
├── backend/                    # NestJS
│   ├── src/
│   │   ├── auth/                # login, JWT, guards
│   │   ├── deteccion/            # POST /deteccion — la lógica descrita en la sección 2
│   │   ├── alertas/               # gestión de alertas
│   │   ├── placas/                # CRUD de placas reportadas
│   │   └── camaras/                # CRUD de cámaras/puntos de captura
│   └── prisma/
│       ├── schema.prisma          # modelo de datos
│       ├── migrations/            # historial de cambios de esquema
│       ├── seed.ts                 # siembra usuario admin + placas de ejemplo
│       └── data/placas-vico.json    # placas reales (padrón El Alto) usadas para sembrar
└── ml-service/                  # FastAPI
    ├── app/                      # main.py, config.py, preprocessing.py, schemas.py
    ├── notebooks/                 # EDA, preprocesamiento, entrenamiento (ver sección 5)
    ├── model/                      # pesos del modelo (.pt), NO está en git
    ├── data/                        # dataset descargado/procesado, NO está en git
    ├── runs/                         # resultados de entrenamiento, NO está en git
    └── test_detect_batch.py          # script de validación contra el test set real
```

---

## 7. Problemas conocidos / mejoras pendientes

- No hay guard de roles: `ADMIN` y `OPERADOR` tienen los mismos permisos hoy.
- El modelo YOLO fue entrenado con un dataset de placas internacionales
  (Kaggle), no bolivianas — la detección del rectángulo funciona bien, pero
  el texto real de las placas bolivianas no se puede validar contra ese
  dataset (ver sección 5.4).
- `GET /deteccion` no tiene paginación — con muchas detecciones, el historial
  puede volverse lento.
- Los tests automatizados (unitarios/integración) todavía no existen en
  backend ni frontend.
