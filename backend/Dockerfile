# syntax=docker/dockerfile:1.7
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma
# tsconfig*.json hace falta en esta imagen aunque el código ya esté compilado
# (dist/): el seed corre con `ts-node/register/transpile-only` directo sobre
# prisma/seed.ts, y sin tsconfig.json acá ts-node cae en sus defaults, que
# chocan con TS5109 ("moduleResolution must be set to NodeNext").
# IMPORTANTE: NODE_ENV=production todavía no está seteado acá — si lo
# estuviera, `npm ci` saltearía devDependencies (prisma CLI, ts-node) sin
# importar si le pasamos --omit=dev o no. El entrypoint necesita ambos
# para correr migrate deploy y el seed dentro de este mismo contenedor.
RUN --mount=type=cache,target=/root/.npm npm ci
RUN npx prisma generate
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Recién ahora, después de instalar, seteamos production
ENV NODE_ENV=production

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
