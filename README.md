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

## Production deployment

Arquitectura recomendada para producción:

| Componente | Hosting | Notas |
|------------|---------|-------|
| Backend API | [Render](https://render.com) (Dockerfile) | Web Service, Root dir `backend/`, rama `main` |
| Catálogo detal | [Vercel](https://vercel.com) | Proyecto 1, `VITE_CATALOG_MODE=detal` |
| Catálogo mayor | Vercel | Proyecto 2, `VITE_CATALOG_MODE=mayor` |
| DB + Storage | Supabase | PostgreSQL + bucket `product-images` |

### Orden de deploy

1. **Supabase:** crear bucket público `product-images` (o el valor de `SUPABASE_STORAGE_BUCKET`).
2. **Render:** crear un **Web Service**, conectar repo GitHub, rama `main`, Root Directory `backend/`, runtime **Docker** (usa el mismo `backend/Dockerfile` de `docker compose`).
3. **Variables de entorno** en Render (ver tabla abajo).
4. **Deploy** en Render.
5. **Migraciones** desde local (carpeta `backend/`, `.env` apuntando a Supabase prod — no commitear):

   ```bash
   cd backend
   pnpm exec prisma migrate deploy
   ```

6. **Seed admin** (solo la primera vez en prod — admin, categorías base y configuración de tienda):

   ```bash
   pnpm db:seed:admin
   ```

   Usar `ADMIN_SEED_PASSWORD` fuerte (32+ caracteres). Luego cambiar contraseña en **Admin → Perfil**.

7. **Health check:** en Render, configurar el Health Check Path en `/health`. Respuesta esperada: `{ "ok": true, "db": "connected" }`.
8. **Vercel:** dos proyectos (detal y mayor), Root Directory `frontend/`, build `pnpm build`, start según TanStack Start/Nitro.
9. **Admin → Perfil:** WhatsApp, email, Instagram, dirección y contraseña admin.

### Render

| Setting | Valor |
|---------|-------|
| Tipo | Web Service |
| Root Directory | `backend` |
| Runtime | Docker (`backend/Dockerfile`) |
| Branch | `main` |
| Health Check Path | `/health` |

Render inyecta la variable `PORT` automáticamente y el backend ya la lee ([`backend/src/index.ts`](backend/src/index.ts) escucha en `0.0.0.0`); no la definas manualmente.

**Variables obligatorias en Render:**

| Variable | Notas |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Aleatorio, mín. 32 caracteres |
| `DATABASE_URL` | Supabase pooler, puerto 6543 |
| `DIRECT_DATABASE_URL` | Conexión directa, puerto 5432 (migraciones) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (solo backend) |
| `SUPABASE_STORAGE_BUCKET` | Default `product-images` |
| `CORS_ORIGINS` | URLs de los dos frontends Vercel, separadas por coma |
| `WHATSAPP_NUMBER`, `STORE_CONTACT_*` | Fallback inicial; luego Admin → Perfil |

> Nota: en el plan free de Render el servicio se duerme tras ~15 min de inactividad; el primer request tras dormir puede tardar ~30-60 s (cold start).

Generar `JWT_SECRET` (PowerShell):

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

El Dockerfile actual no requiere cambios: el cliente Prisma se compila en `dist/generated/prisma/` durante el build.

### Vercel (×2)

Cada catálogo es un proyecto Vercel independiente:

| Proyecto | `VITE_CATALOG_MODE` |
|----------|---------------------|
| Catálogo detal | `detal` |
| Catálogo mayorista | `mayor` |

En **ambos**, configurar en build time:

- `VITE_API_BASE_URL` → URL pública del backend Render (ej. `https://stylos-catalog.onrender.com`), sin `/` final

Root Directory: `frontend`. Framework Preset: **TanStack Start** (o dejar que `frontend/vercel.json` lo aplique). Install: `pnpm install`. Build: `pnpm build`. No configures Output Directory manualmente.

No agregues `NODE_ENV=production` en las variables de Vercel: hace que `pnpm install` omita devDependencies (`vite` no se instala y el build falla).

Tras desplegar frontends, actualizar `CORS_ORIGINS` en Render con las URLs finales de Vercel.

### Monitoreo

Configurar [UptimeRobot](https://uptimerobot.com) (u similar) apuntando a `https://<tu-backend-render>/health`, intervalo 5 min, alerta si status ≠ 200 o `db` ≠ `connected`. En el plan free de Render, este ping periódico también ayuda a mantener el servicio despierto.

### Checklist post-deploy

- [ ] `GET /health` OK
- [ ] Login admin y cambio de contraseña
- [ ] CRUD producto + upload imagen (Supabase Storage)
- [ ] Pedido detal y mayor → URL WhatsApp correcta
- [ ] Footer y contacto reflejan Admin → Perfil

### Seed en producción vs desarrollo

| Comando | Uso |
|---------|-----|
| `pnpm db:seed` | Desarrollo/demo: categorías, productos, pedidos y admin |
| `pnpm db:seed:admin` | **Producción:** admin + categorías base + configuración de tienda (sin productos ni pedidos demo) |

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
pnpm db:seed      # categorías, productos demo, usuario admin (desarrollo)
pnpm db:seed:admin  # admin + categorías + tienda (producción)
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

---

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
