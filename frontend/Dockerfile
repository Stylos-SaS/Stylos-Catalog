# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# .env is copied with the rest of the app (not in .dockerignore).
# Vite reads VITE_* from frontend/.env during build.
COPY . .

# Overridden per service in docker-compose (detal / mayor).
ARG VITE_CATALOG_MODE=detal
ENV VITE_CATALOG_MODE=$VITE_CATALOG_MODE

RUN pnpm build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# HOST, PORT, NODE_ENV at runtime via env_file (frontend/.env)
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
