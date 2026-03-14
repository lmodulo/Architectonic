# Application Scaffold

SvelteKit + Skeleton v3 + Fastify + MongoDB, containerized with Docker.

## Prerequisites

- Node.js 22+
- Docker Desktop (includes Docker Compose)
  - Windows: Docker Desktop for Windows with WSL 2 backend
  - macOS: Docker Desktop for Mac

## Project Structure

```
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Dev overlay (hot reload)
├── .env.example                # Environment template
├── frontend/
│   ├── Dockerfile              # Production multi-stage
│   ├── Dockerfile.dev          # Dev with hot reload
│   ├── package.json            # SvelteKit, Skeleton v3, Tailwind v4
│   ├── svelte.config.js        # adapter-node config
│   ├── vite.config.ts          # Tailwind v4 vite plugin
│   ├── src/
│   │   ├── app.css             # Tailwind + Skeleton theme imports
│   │   ├── app.html            # HTML shell with data-theme
│   │   ├── routes/
│   │   │   ├── +layout.svelte  # Root layout (CSS import)
│   │   │   ├── +page.svelte    # Index page with health check
│   │   │   └── api/health/
│   │   │       └── +server.ts  # Proxy to Fastify API
│   │   └── lib/                # Shared components, stores, utils
│   └── static/
├── api/
│   ├── Dockerfile              # Production multi-stage
│   ├── Dockerfile.dev          # Dev with tsx watch
│   ├── package.json            # Fastify, MongoDB plugin, CORS
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts           # Entry point, plugin registration
│       └── routes/
│           ├── health.ts       # GET /health
│           └── example.ts      # CRUD: GET/POST/DELETE /examples
```

## First-Time Setup

```bash
# 1. Copy env template
cp .env.example .env

# 2. Install dependencies (needed for IDE intellisense outside Docker)
cd frontend && npm install && cd ..
cd api && npm install && cd ..
```

## Running with Docker

### Development (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Services:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- MongoDB: localhost:27017

Source changes in `frontend/src/` and `api/src/` auto-reload inside containers.

### Production

```bash
docker compose up --build -d
```

### Stop

```bash
docker compose down
```

### Stop and destroy data

```bash
docker compose down -v
```

## Running Without Docker (local dev)

If you prefer running services directly:

```bash
# Terminal 1 — MongoDB
# Use a local MongoDB install, or run just the mongo container:
docker compose up mongo -d

# Terminal 2 — API
cd api
MONGO_URI=mongodb://localhost:27017/appdb npm run dev

# Terminal 3 — Frontend
cd frontend
API_URL=http://localhost:4000 npm run dev
```

## Verifying the Stack

Once running, open http://localhost:3000. The index page calls the API health
endpoint and reports status. You can also test the API directly:

```bash
# Health check
curl http://localhost:4000/health

# Create an item
curl -X POST http://localhost:4000/examples \
  -H "Content-Type: application/json" \
  -d '{"title": "test item"}'

# List items
curl http://localhost:4000/examples
```

## Platform Notes

### Windows 11

- Use Docker Desktop with the WSL 2 backend enabled.
- Clone the project inside the WSL filesystem (`\\wsl$\Ubuntu\home\...`)
  for significantly better bind-mount performance during development.
  Cloning to `C:\Users\...` works but file watching is slower.
- Line endings: configure git before cloning:
  `git config --global core.autocrlf input`
  This prevents CRLF issues inside Linux containers.

### macOS

- Docker Desktop for Mac works out of the box.
- Bind-mount performance for `node_modules` can be slow on large projects.
  The Dockerfiles install deps inside the container image (not mounted),
  so this only affects the source directories which are small.
- Apple Silicon (M1/M2/M3/M4): all images used are multi-arch. No changes needed.

## Adding to the Project

### New API route

1. Create `api/src/routes/yourroute.ts` following the pattern in `example.ts`
2. Register it in `api/src/server.ts`:
   ```ts
   import yourRoutes from './routes/yourroute.js';
   await app.register(yourRoutes, { prefix: '/yourroute' });
   ```

### New frontend route

1. Create `frontend/src/routes/yourpage/+page.svelte`
2. For server data loading, add `+page.server.ts` or `+page.ts` alongside it

### New Skeleton component

Skeleton v3 components are imported from `@skeletonlabs/svelte`:
```svelte
<script>
  import { Dialog, Button } from '@skeletonlabs/svelte';
</script>
```

Consult https://skeleton.dev/docs for the full component catalog and theming API.

### Shared state (no external library needed)

```ts
// frontend/src/lib/stores/counter.svelte.ts
let count = $state(0);

export function useCounter() {
  return {
    get count() { return count; },
    increment() { count++; },
    decrement() { count--; }
  };
}
```

Import and use in any component:
```svelte
<script>
  import { useCounter } from '$lib/stores/counter.svelte';
  const counter = useCounter();
</script>

<button onclick={counter.increment}>{counter.count}</button>
```

## Stack Reference

| Layer            | Package                    | Docs                                    |
|------------------|----------------------------|-----------------------------------------|
| Frontend         | SvelteKit                  | https://svelte.dev/docs/kit             |
| Components       | Skeleton v3                | https://skeleton.dev                    |
| CSS              | Tailwind v4                | https://tailwindcss.com/docs            |
| API              | Fastify v5                 | https://fastify.dev/docs                |
| MongoDB driver   | @fastify/mongodb           | https://github.com/fastify/fastify-mongodb |
| Container        | Docker Compose             | https://docs.docker.com/compose         |


## Custom CSS theme
Build theme here: https://themes.skeleton.dev/themes/create
place themed CSS file [themename-theme.css] into the frontend directory.

## Tasks
[] password recovery
[] change delete user to set `inactive`
[] research hosting for dev (https://railway.com/pricing)
[x] research module framework. decide on core vs module
[] research Stripe and Square integration
[] research store front and shopping cart and admin backend
[] dev/integration/staging/prod environments (dev/live switch)