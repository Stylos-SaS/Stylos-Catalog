# Stylos-Catalog

Repository for the development of a catalog website for Stylos Variedades.

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
