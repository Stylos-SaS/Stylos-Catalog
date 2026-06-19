# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_CATALOG_MODE=detal
ARG VITE_API_BASE_URL=
ARG VITE_WHATSAPP_NUMBER=573001234567

ENV VITE_CATALOG_MODE=$VITE_CATALOG_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
