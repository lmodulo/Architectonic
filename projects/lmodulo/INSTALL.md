# Local Development Setup

## Prerequisites

Install these before starting:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — includes Compose v2. Verify with `docker compose version`.
- **[VS Code](https://code.visualstudio.com/)** — recommended editor.

---

## 1. Clone the repo

```bash
git clone <repo-url>
cd <repo>/projects/lmodulo
```

All commands below run from the `projects/lmodulo/` directory.

---

## 2. Create the environment file

```bash
cp .env.example .env
```

Open `.env` and set the one required value — `SESSION_SECRET`. Generate it with:

```bash
openssl rand -hex 32
```

Paste the output as the value:

```env
SESSION_SECRET=abc123...your64charhex...
```

Everything else has working defaults for local dev:

- `STORAGE_PROVIDER=local` — file uploads save to disk inside the container, no S3 needed.
- `SMTP_HOST` blank — password-reset emails print preview URLs to the API log instead of sending.

---

## 3. Build the images

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
```

Installs npm dependencies inside the containers. Takes 2–4 minutes on first run. Re-run this after any `package.json` change.

---

## 4. Start everything

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Docker starts three services: `mongo`, `api`, and `web`. Wait until you see:

```
web  | Local:   http://0.0.0.0:3000/
```

The app is ready at **http://localhost:3000**.

---

## 5. Log in

The seed script creates demo accounts on first boot:

| Username | Password | Role |
|---|---|---|
| `admin` | `admin-password` | Admin |
| `owner` | `owner-password` | Owner |
| `alex` | `alex-password` | Lead |
| `jordan` | `jordan-password` | Contributor |
| `customer` | `c-password` | Customer |

Use `admin` / `admin-password` to start with full access.

---

## Day-to-day workflow

**Frontend changes** (`.svelte`, `src/lib/`, `src/routes/`) — Vite hot-reloads automatically. No rebuild needed.

**API changes** (`api/src/`) — require a rebuild:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
```

**View logs:**

```bash
docker compose logs -f web   # frontend
docker compose logs -f api   # backend (also shows email preview URLs)
```

**Stop everything:**

```bash
docker compose down
```

**Wipe the database and start fresh** (destroys all data):

```bash
docker compose down -v
```

---

## Optional: AI chat assistant

The built-in chat panel requires [Ollama](https://ollama.com/) running locally on the host machine. Install it, then pull a model:

```bash
ollama pull llama3.2
```

The API container connects to Ollama at `host.docker.internal:11434` automatically. If Ollama isn't running, the chat panel stays empty — everything else works normally.

---

## Ports

| Service | URL |
|---|---|
| App (frontend) | http://localhost:3000 |
| API | http://localhost:4000 |
| MongoDB | localhost:27017 |
