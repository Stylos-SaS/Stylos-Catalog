# Stylos-Catalog

Repository for the development of a catalog website for Stylos Variedades.

## Backend

The REST API lives in [`backend/`](backend/). Stack: Fastify, **Prisma 7** (driver adapter `@prisma/adapter-pg`), PostgreSQL (Supabase), TypeScript, Zod. Package manager: **pnpm**.

### Development

```bash
cd backend
cp .env.example .env
# Fill in Supabase keys + PostgreSQL connection strings (see below)
pnpm install
pnpm db:migrate   # first time only
pnpm db:seed      # categories, sample products, admin user
pnpm dev
# → http://localhost:4000/health
# → http://localhost:4000/api/categories
# → http://localhost:4000/api/products
```

If `pnpm` is not on your PATH, use `corepack enable` or `npx pnpm@9.15.4 install`.

### Supabase credentials

You already have these from **Project Settings → API**:

| Variable | Supabase dashboard |
|----------|-------------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret (service_role) key |

These keys power **Storage** and future Supabase features. They are **not** the database password.

### PostgreSQL connection strings (required for Prisma)

Prisma talks to PostgreSQL directly — you also need the **database password** from when you created the Supabase project.

In **Project Settings → Database → Connection string**:

| Variable | Supabase option | Port |
|----------|-----------------|------|
| `DATABASE_URL` | **Transaction pooler** | 6543 — used by the API at runtime |
| `DIRECT_DATABASE_URL` | **Direct connection** | 5432 — used by `pnpm db:migrate` |

Replace `[YOUR-PASSWORD]` with your database password (not the service role key).

### API endpoints (public)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + DB status |
| `GET` | `/api/categories` | Product categories |
| `GET` | `/api/products` | Product list (`?category=&q=&sort=&page=&limit=&mode=`) |
| `GET` | `/api/products/:id` | Product detail by UUID |

### Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | API listen port (default `4000`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key (backend only) |
| `DATABASE_URL` | PostgreSQL pooler URL (port 6543) |
| `DIRECT_DATABASE_URL` | PostgreSQL direct URL (port 5432, migrations) |
| `ADMIN_SEED_PASSWORD` | Initial admin password for seed (default `admin123`) |
| `JWT_SECRET` | Admin auth secret (Fase 5+) |

When connecting the frontend, set `VITE_API_BASE_URL=http://localhost:4000` in `frontend/.env`.

## Frontend

The storefront and admin dashboard live in [`frontend/`](frontend/). Stack: React 19, TanStack Start, Tailwind CSS 4, Zustand.

Each catalog deployment (detal / mayorista) is a **separate build** of the same codebase, configured with `VITE_CATALOG_MODE`. Both connect to the same backend via `VITE_API_BASE_URL`.

### Development

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_CATALOG_MODE=detal` or `VITE_CATALOG_MODE=mayor` in `.env` before starting dev.

### Environment variables

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_CATALOG_MODE` | `detal` (default) or `mayor` | Catalog pricing mode for this deployment |
| `VITE_API_BASE_URL` | URL | Shared backend API (when available) |
| `VITE_WHATSAPP_NUMBER` | E.164 without `+` | WhatsApp checkout number |

### Key routes

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/catalogo` | Product catalog (prices per `VITE_CATALOG_MODE`) |
| `/mayorista` | Redirects to `/catalogo` |
| `/carrito` | Shopping cart + WhatsApp checkout |
| `/admin` | Admin dashboard (mock data, no auth yet) |

### Build

```bash
cd frontend
VITE_CATALOG_MODE=detal npm run build
npm run start
```

### Docker

Two catalog deployments from the same image build context:

```bash
cd frontend
docker compose up --build
```

| Service | URL | Mode |
|-------|-----|------|
| `frontend-detal` | http://localhost:3001 | detal |
| `frontend-mayor` | http://localhost:3002 | mayor |

To run a single deployment:

```bash
docker build --build-arg VITE_CATALOG_MODE=mayor -t stylos-frontend-mayor .
docker run -p 3000:3000 stylos-frontend-mayor
```

To stop:

```bash
docker compose down
```

## Requirements

See [`docs/requisitos/documento_de_requisitos.md`](docs/requisitos/documento_de_requisitos.md) for the full software requirements specification.
