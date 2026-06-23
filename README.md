# Stylos-Catalog

Catálogo web y panel administrativo para **Stylos Variedades**: dos storefronts (detal / mayorista), backend compartido y gestión de pedidos vía WhatsApp.

Especificación formal: [`docs/requisitos/documento_de_requisitos.md`](docs/requisitos/documento_de_requisitos.md)

## Quick start (Docker full stack)

Requisitos previos — copiar y configurar ambos archivos:

- [`backend/.env`](backend/.env) ← `backend/.env.example`
- [`frontend/.env`](frontend/.env) ← `frontend/.env.example`

Antes de `docker compose up`, en **ambos** `.env` usar `NODE_ENV=production` (en local dev suele ser `development`).

Docker Compose lee:

- **Backend:** `env_file: ./backend/.env` (runtime).
- **Frontends:** `env_file: ./frontend/.env` (runtime). En el **build**, el mismo `frontend/.env` se copia al contexto de Docker y Vite lo usa; solo `VITE_CATALOG_MODE` se sobrescribe por servicio (`detal` / `mayor`).

```bash
# Desde la raíz del repo — backend + catálogo detal + catálogo mayor
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:4000 |
| Catálogo detal | http://localhost:3001 |
| Catálogo mayorista | http://localhost:3002 |

Admin accesible en cualquier frontend (p. ej. http://localhost:3001/admin/login).

### Migraciones en Docker

Antes del primer arranque (o tras nuevas migraciones Prisma):

```bash
docker build --target builder -t stylos-catalog-backend-builder ./backend
docker run --rm --env-file backend/.env stylos-catalog-backend-builder pnpm exec prisma migrate deploy
```

Opcional — datos de demo:

```bash
docker run --rm --env-file backend/.env stylos-catalog-backend-builder pnpm db:seed
```

Para levantar solo algunos servicios: `docker compose up --build backend frontend-detal`.

---

## Backend

REST API en [`backend/`](backend/). Stack: Fastify, **Prisma 7** (`@prisma/adapter-pg`), PostgreSQL (Supabase), TypeScript, Zod. Package manager: **pnpm**.

### Development

```bash
cd backend
cp .env.example .env
# Completar Supabase + PostgreSQL (ver abajo)
pnpm install
pnpm db:migrate   # primera vez o tras cambios de schema
pnpm db:seed      # categorías, productos demo, usuario admin
pnpm dev
# → http://localhost:4000/health
```

Si `pnpm` no está en PATH: `corepack enable` o `npx pnpm@9.15.4 install`.

### Credenciales seed

Tras `pnpm db:seed`:

| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | valor de `ADMIN_SEED_PASSWORD` (default `admin123`) |

### Supabase (API keys)

Desde **Project Settings → API**:

| Variable | Supabase dashboard |
|----------|-------------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service_role) key |

Estas keys alimentan **Storage** (imágenes de productos). **No** son la contraseña de PostgreSQL.

### PostgreSQL (Prisma)

Desde **Project Settings → Database → Connection string**:

| Variable | Supabase option | Puerto |
|----------|-----------------|--------|
| `DATABASE_URL` | Transaction pooler | 6543 — runtime de la API |
| `DIRECT_DATABASE_URL` | Direct connection | 5432 — migraciones Prisma |

### API endpoints (públicos)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + estado DB |
| `GET` | `/api/categories` | Categorías |
| `GET` | `/api/products` | Listado (`?category=&q=&sort=&page=&limit=&mode=`) |
| `GET` | `/api/products/:id` | Detalle de producto |
| `GET` | `/api/settings/store` | WhatsApp y contacto del footer (configurable en admin) |
| `POST` | `/api/orders` | Crear pedido + URL de WhatsApp |

### API endpoints (admin, JWT)

| Área | Rutas |
|------|-------|
| Auth | `POST /api/auth/login`, `GET/PATCH /api/auth/me`, `PATCH /api/auth/password` |
| Dashboard | `GET /api/admin/dashboard` |
| Productos | CRUD + `POST /api/admin/products/upload-image` |
| Categorías | CRUD `/api/admin/categories` |
| Pedidos | Listado, detalle, edición, cambio de estado |
| Tienda | `GET/PATCH /api/admin/store-settings` |

### Environment variables (backend)

| Variable | Description |
|----------|-------------|
| `PORT` | Puerto API (default `4000`) |
| `NODE_ENV` | `development` / `production` / `test` |
| `CORS_ORIGINS` | Orígenes permitidos (comma-separated) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo backend) |
| `SUPABASE_STORAGE_BUCKET` | Bucket de imágenes (default `product-images`) |
| `DATABASE_URL` | PostgreSQL pooler (6543) |
| `DIRECT_DATABASE_URL` | PostgreSQL directo (5432, migraciones) |
| `JWT_SECRET` | Secreto JWT admin (mín. 16 caracteres, **requerido**) |
| `ADMIN_SEED_PASSWORD` | Contraseña inicial del admin en seed |
| `WHATSAPP_NUMBER` | WhatsApp fallback (E.164 sin `+`) |
| `STORE_CONTACT_EMAIL` | Email fallback del footer |
| `STORE_CONTACT_INSTAGRAM` | Instagram fallback del footer |
| `STORE_CONTACT_LOCATION` | Dirección/ubicación fallback del footer |

Los valores de tienda en runtime se persisten en BD vía `/admin/perfil`; las variables `WHATSAPP_NUMBER` y `STORE_CONTACT_*` son fallback cuando aún no hay fila en `configuracion_tienda`.

---

## Frontend

Storefront + admin en [`frontend/`](frontend/). Stack: React 19, TanStack Start, Tailwind CSS 4, Zustand. Package manager: **pnpm**.

Cada despliegue de catálogo (detal / mayorista) es un **build separado** con `VITE_CATALOG_MODE`. Ambos usan el mismo backend.

### Development

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

Usar `VITE_CATALOG_MODE=detal` o `mayor` en `.env` según el catálogo a probar.

### Environment variables (frontend)

| Variable | Description |
|----------|-------------|
| `VITE_CATALOG_MODE` | `detal` (default) o `mayor` — precios de este despliegue |
| `VITE_API_BASE_URL` | URL del backend (requerido para catálogo y checkout) |
| `VITE_WHATSAPP_NUMBER` | Fallback WhatsApp si la API no responde |
| `VITE_STORE_CONTACT_EMAIL` | Fallback email del footer |
| `VITE_STORE_CONTACT_INSTAGRAM` | Fallback Instagram del footer |
| `VITE_STORE_CONTACT_LOCATION` | Fallback dirección del footer |
| `NODE_ENV` | `development` en local; `production` en Docker |
| `HOST` | Host del servidor SSR (default `0.0.0.0` en Docker) |
| `PORT` | Puerto del servidor SSR (default `3000`) |

En producción, WhatsApp y contacto del footer se configuran en **Admin → Perfil**. Las `VITE_*` de contacto solo aplican como fallback cuando `GET /api/settings/store` no está disponible.

En Docker, las variables `VITE_*` se leen de `frontend/.env` durante el build (archivo incluido en el contexto de Docker). No hace falta un `.env` en la raíz del repo.

### Rutas storefront

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/catalogo` | Catálogo (búsqueda, filtros, paginación) |
| `/producto/:id` | Detalle de producto |
| `/mayorista` | Redirige a `/catalogo` |
| `/carrito` | Carrito + checkout WhatsApp |
| `/confirmacion` | Pantalla post-pedido |

### Rutas admin (JWT)

| Route | Description |
|-------|-------------|
| `/admin/login` | Inicio de sesión |
| `/admin` | Dashboard |
| `/admin/productos` | Gestión de productos |
| `/admin/categorias` | Gestión de categorías |
| `/admin/pedidos` | Listado y edición de pedidos |
| `/admin/perfil` | Perfil, contraseña, WhatsApp y contacto del catálogo |

### Build

```bash
cd frontend
VITE_CATALOG_MODE=detal pnpm build
pnpm start
```

---

## Cumplimiento de requisitos (SRS)

Referencia: [`docs/requisitos/documento_de_requisitos.md`](docs/requisitos/documento_de_requisitos.md)

| ID | Requisito | Estado |
|----|-----------|--------|
| RF-01 | Catálogo de productos | Implementado |
| RF-02 | Dos frontends (detal / mayor) | Implementado |
| RF-03 | Página de detalle | Implementado |
| RF-04 | Carrito de compras | Implementado |
| RF-05 | Creación de pedido + WhatsApp | Implementado |
| RF-06 | Tipo de pedido (detal/mayor) | Implementado |
| RF-07 | Autenticación admin | Implementado |
| RF-08 | Gestión de productos (CRUD) | Implementado |
| RF-09 | Gestión / listado de pedidos | Implementado |
| RF-10 | Modificación de pedidos | Implementado |
| RF-11 | Conservación del esquema de precios | Implementado |
| RF-12 | Documento de confirmación (PDF/imagen) | Implementado |
| RF-13 | Estados de pedidos | Implementado |

### Funcionalidades adicionales (fuera del SRS)

- CRUD de categorías con emojis (`/admin/categorias`)
- Configuración de tienda en admin: WhatsApp, email, Instagram, dirección
- Perfil admin (nombre y cambio de contraseña)
- Desactivación de productos con pedidos asociados (en lugar de borrado forzado)
