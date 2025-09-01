# ---- deps ----
  FROM node:20-alpine AS deps
  WORKDIR /app
  # habilita pnpm vía Corepack y usa la versión definida en package.json
  RUN corepack enable
  COPY package.json pnpm-lock.yaml ./
  # instala con el lockfile (equivalente a npm ci)
  RUN pnpm install --frozen-lockfile
  
  # ---- build ----
  FROM node:20-alpine AS build
  WORKDIR /app
  RUN corepack enable
  COPY --from=deps /app/node_modules ./node_modules
  # Si usas Prisma: copia el schema y genera (opcional)
  # COPY prisma ./prisma
  # RUN pnpm prisma generate
  COPY . .
  RUN pnpm build
  
  # ---- runtime ----
  FROM node:20-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  RUN corepack enable
  COPY package.json pnpm-lock.yaml ./
  # instala solo deps de producción usando el lockfile
  RUN pnpm install --prod --frozen-lockfile
  COPY --from=build /app/dist ./dist
  EXPOSE 3000
  CMD ["node", "dist/main.js"]
  