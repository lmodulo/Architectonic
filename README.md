# Architectonic

SvelteKit + Skeleton v4 + Fastify + MongoDB, containerized with Docker.

The `example/` directory is the scaffold — clone it to start a new project.
See [`example/CLAUDE.md`](example/CLAUDE.md) for the full project reference.

## Stack

| Layer      | Package                  | Version |
|------------|--------------------------|---------|
| Frontend   | SvelteKit + Svelte       | 2 / 5   |
| Components | Skeleton                 | v4      |
| CSS        | Tailwind                 | v4      |
| API        | Fastify                  | v5      |
| Database   | MongoDB                  | 7       |
| Auth       | @fastify/session + bcryptjs | —    |
| Email      | Nodemailer (Ethereal dev / SMTP prod) | — |
| Container  | Docker Compose           | —       |

## Prerequisites

- Node.js 22+
- Docker Desktop (WSL 2 backend on Windows)

## First-Time Setup

```bash
cd example
cp .env.example .env
# Edit .env — set SESSION_SECRET at minimum
cd frontend && npm install && cd ..
cd api && npm install && cd ..
```

## Running

### Development

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- MongoDB: localhost:27017

> **Windows:** Bind mounts don't propagate FS events reliably. API changes always require a rebuild; Svelte changes often do too. Never rely on hot-reload for server-side files.

### Rebuild after code changes (Windows)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
```

### Production

```bash
docker compose up --build -d
```

### Stop / destroy data

```bash
docker compose down        # stop, keep volumes
docker compose down -v     # stop, delete volumes
```

## Features

- **Auth** — login, logout, session management, profile edit, password reset (forgot-password → email token → reset page)
- **RBAC** — roles + permissions in MongoDB, enforced on API and frontend; Manage Users and Roles admin pages
- **Messaging** — in-app email-style messaging with threads, replies, inbox/sent/archive, unread badge, Tiptap rich-text editor
- **Dashboard** — placeholder with pure-SVG charts
- **Chat assistant** — Ollama-backed fixed panel (`OLLAMA_URL=http://host.docker.internal:11434`)
- **Theme toggle** — dark/light, persisted to localStorage

## Project Structure

```
example/
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Dev overlay
├── .env.example                # Environment template
├── CLAUDE.md                   # Full project reference for AI-assisted dev
├── frontend/                   # SvelteKit app — port 3000
│   └── src/
│       ├── routes/
│       │   ├── (marketing)/    # Public marketing pages
│       │   ├── api/            # SvelteKit → Fastify proxy routes
│       │   ├── dashboard/
│       │   ├── messages/
│       │   ├── users/          # Admin: Manage Users
│       │   ├── roles/          # Admin: Manage Roles
│       │   ├── login/
│       │   ├── forgot-password/
│       │   └── reset-password/
│       └── lib/
│           ├── components/     # Shared UI components
│           ├── config/logo.ts  # Brand name / logo
│           └── permissions.ts  # hasPermission(user, resource, action)
└── api/                        # Fastify app — port 4000
    └── src/
        ├── server.ts           # Entry point, plugin registration
        ├── plugins/            # session, MongoDB, CORS, seed
        ├── routes/             # auth, users, roles, messages, health
        └── lib/                # checkDuplicateUser, sendPasswordResetEmail
```

## Environment Variables

| Variable         | Default                  | Notes |
|------------------|--------------------------|-------|
| `SESSION_SECRET` | —                        | Required. 64-char hex. |
| `MONGO_DB`       | `appdb`                  | |
| `WEB_PORT`       | `3000`                   | |
| `API_PORT`       | `4000`                   | |
| `SMTP_HOST`      | _(blank)_                | Blank → Ethereal auto-provisioned in dev |
| `SMTP_PORT`      | `587`                    | |
| `SMTP_USER`      | —                        | |
| `SMTP_PASS`      | —                        | |
| `SMTP_FROM`      | `Architectonic <noreply@example.com>` | |
| `APP_URL`        | `http://localhost:3000`  | Used in password reset links |
| `OLLAMA_URL`     | `http://host.docker.internal:11434` | Dev overlay only |

Generate `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Platform Notes

### Windows 11
- Use Docker Desktop with the WSL 2 backend.
- Line endings: `git config --global core.autocrlf input` before cloning.

### macOS
- Docker Desktop works out of the box.
- Apple Silicon (M1/M2/M3/M4): all images are multi-arch.

## Docs

| Package    | URL |
|------------|-----|
| SvelteKit  | https://svelte.dev/docs/kit |
| Svelte 5   | https://svelte.dev/docs/svelte |
| Skeleton v4 | https://skeleton.dev |
| Tailwind v4 | https://tailwindcss.com/docs |
| Fastify v5 | https://fastify.dev/docs |
| Nodemailer | https://nodemailer.com |

Build a custom theme: https://themes.skeleton.dev/themes/create — place the CSS file in `frontend/` and import it in `app.css`.

## Tasks
[] change delete user to set `inactive`
[] research hosting for dev (https://railway.com/pricing)
[x] research module framework. decide on core vs module
[] research Stripe and Square integration
[] research store front and shopping cart and admin backend
[] dev/integration/staging/prod environments (dev/live switch)
[] add a catch all for the private vs public routes.
[x] password recovery
