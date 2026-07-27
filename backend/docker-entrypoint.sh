#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Sembrando placas_reportadas (si está vacía)..."
npx prisma db seed

echo "Iniciando backend..."
exec "$@"
