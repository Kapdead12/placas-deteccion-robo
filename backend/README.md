# backend — Placas-Deteccion-Robo

Backend NestJS: recibe la imagen del frontend, la reenvía al `ml-service` (FastAPI),
y persiste el resultado con Prisma + PostgreSQL.

## Setup

```bash
cd backend
npm install
copy .env.example .env      # y completar DATABASE_URL con tus credenciales de Postgres
npm run prisma:migrate      # crea las tablas detecciones y placas_reportadas
npm run prisma:seed         # siembra 500 placas_reportadas simuladas (no hace nada si ya hay datos)
npm run start:dev           # levanta en http://localhost:3001
```

> Requiere PostgreSQL corriendo localmente (o cambiar `DATABASE_URL` a tu instancia) y
> el `ml-service` (FastAPI) levantado en `ML_SERVICE_URL` (default `http://localhost:8000`).

## Datos de prueba (seed)

`prisma/seed.ts` genera 500 placas simuladas para `placas_reportadas` (formato
`ABC123`, igual que normaliza el OCR del ml-service), con motivo, `activo`
aleatorio (~85% activas) y fecha de reporte aleatoria en los últimos 2 años.
Es idempotente: si la tabla ya tiene registros, no vuelve a sembrar.

`detecciones` arranca vacía a propósito — se llena sola con el uso real de
`POST /deteccion`.

```bash
npm run prisma:seed
```

En Docker corre solo, como parte del arranque del contenedor (ver
`docker-entrypoint.sh` en la raíz del proyecto).

## Endpoints

### `POST /deteccion`
- Body: `multipart/form-data`, campo `file` con la imagen.
- Reenvía la imagen a `ml-service` `/detect`, cruza el resultado contra `placas_reportadas`,
  guarda la detección y devuelve el registro + `alerta` (`⚠️ Placa reportada como robada` / `✅ Sin reportes`).

### `GET /deteccion`
- Lista el historial de detecciones (más recientes primero).

### `POST /placas`
- Body JSON: `{ "placa": "ABC123", "motivo": "opcional" }`
- Registra una placa como reportada/robada.

### `GET /placas`
- Lista las placas reportadas activas.

### `DELETE /placas/:id`
- Desactiva (soft-delete) una placa reportada.

## Estructura

```
src/
├── main.ts
├── app.module.ts
├── prisma/            # PrismaService + PrismaModule (Global)
├── deteccion/          # controller, service, consumo del ml-service
└── placas/             # CRUD de placas_reportadas
prisma/
├── schema.prisma       # modelos Deteccion y PlacaReportada
└── seed.ts             # datos simulados para placas_reportadas
```
