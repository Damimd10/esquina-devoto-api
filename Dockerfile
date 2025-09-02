# --- Base
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# --- Deps (todas las deps para compilar)
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build (genera Prisma Client + compila Nest)
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Genera Prisma Client (necesario para que TS compile)
RUN pnpm prisma generate

# Compila Nest (usa tsconfig.build.json que excluye prisma/**/*.ts)
RUN pnpm build

# --- Runner (solo prod deps + opcional regenerate)
FROM base AS runner
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Artefactos de build y schema
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# (Opcional pero recomendado) regenerar client en runtime por binarios
RUN pnpm dlx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
