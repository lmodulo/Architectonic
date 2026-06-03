# lmodulo

SvelteKit + Fastify application. Runs entirely in Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2

## Setup

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

If there is no `.env.example`, create `.env` at minimum with:

```env
# Required — generate with: openssl rand -hex 32
SESSION_SECRET=

# App ports (optional, defaults shown)
WEB_PORT=3000
API_PORT=4000

# Email (optional — omit to disable email sending)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=App <noreply@example.com>

# Storage — MinIO is bundled for local dev, no changes needed
# Set STORAGE_PROVIDER=s3 and supply AWS_* vars for production S3
STORAGE_PROVIDER=s3
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_URL=http://localhost:9000
AWS_BUCKET=uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

## Development

Starts all services with bind-mounted source so frontend changes hot-reload without rebuilding.

```bash
# First run or after dependency changes — build images
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# Start everything
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or start detached
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

> **Note:** API source changes require a rebuild (`build api` then `up -d api`). Frontend `.svelte` changes hot-reload via Vite. On Windows, FS events don't propagate reliably — rebuild both services after any source change.

### Rebuild a single service

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build web
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d web

docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
```

### Restart a service (picks up env changes, not code changes)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart api
```

## Production (Railway)

This project deploys to [Railway](https://railway.app) as two separate services (API + Frontend) from the same repo.

### One-time setup

1. Create a Railway project and add two **Empty services** linked to this repo.
2. For each service, set **Root Directory** in Railway → Settings → Source:
   - API service: `projects/lmodulo/api`
   - Frontend service: `projects/lmodulo/frontend`
3. Railway picks up `railway.toml` automatically from the root directory of each service.

### Environment variables

Configure these in Railway → Variables for each service. **Do not set `PORT`** — Railway injects it automatically.

#### API service

| Variable | Value / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `MONGO_URI` | MongoDB Atlas connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/appdb` |
| `SESSION_SECRET` | 64-char hex — `openssl rand -hex 32` |
| `FRONTEND_ORIGIN` | Frontend Railway URL, e.g. `https://lmodulo-frontend.up.railway.app` |
| `APP_URL` | Same as `FRONTEND_ORIGIN` |
| `STORAGE_PROVIDER` | `s3` |
| `AWS_REGION` | `auto` (Cloudflare R2) |
| `AWS_BUCKET` | R2 bucket name |
| `AWS_ACCESS_KEY_ID` | R2 API token key |
| `AWS_SECRET_ACCESS_KEY` | R2 API token secret |
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_PUBLIC_URL` | `https://pub-xxxx.r2.dev` or custom domain |
| `SMTP_HOST` | e.g. `smtp.resend.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | e.g. `App Name <noreply@example.com>` |
| `APP_NAME` | Optional display name |
| `STRIPE_SECRET_KEY` | Optional — Folio finance module |
| `STRIPE_WEBHOOK_SECRET` | Optional |

#### Frontend service

| Variable | Value / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `ORIGIN` | Frontend Railway URL (must match exactly — used for CSRF) |
| `API_URL` | API Railway URL, e.g. `https://lmodulo-api.up.railway.app` |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional |

### Storage

Railway has no simple persistent local disk. **File uploads require Cloudflare R2** (or another S3-compatible provider). Set `STORAGE_PROVIDER=s3` and the R2 credentials above. Do not use `STORAGE_PROVIDER=local` in production.

### Deploy order

Deploy the API service first, verify `/health` returns 200, then deploy the frontend. Set `FRONTEND_ORIGIN` on the API to the frontend URL before the frontend goes live to avoid CORS errors.

## Ports

| Service       | Default port |
|---------------|-------------|
| Frontend      | 3000        |
| API           | 4000        |
| MongoDB       | 27017       |
| MinIO (S3)    | 9000        |
| MinIO console | 9001        |

## Useful commands

```bash
# View logs
docker compose logs -f web
docker compose logs -f api

# Stop all services
docker compose down

# Stop and remove volumes (wipes database and uploads)
docker compose down -v

# Open a shell in a running container
docker compose exec api sh
docker compose exec web sh
```
