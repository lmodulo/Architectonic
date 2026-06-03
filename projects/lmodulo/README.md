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

## Production

```bash
docker compose build
docker compose up -d
```

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
