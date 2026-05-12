# Architectonic

SvelteKit + DaisyUI v5 + Fastify + MongoDB, containerized with Docker.

The `candidate/` directory is the scaffold.
See [`candidate/CLAUDE.md`](candidate/CLAUDE.md) for the full project reference.

## Stack

| Layer      | Package                  | Version |
|------------|--------------------------|---------|
| Frontend   | SvelteKit + Svelte       | 2 / 5   |
| Components | DaisyUI                  | v5      |
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
cd candidate
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
- **Settings** — admin-only key/value config store; `GET /settings`, `PATCH /settings/:key`; typed inputs (string/boolean/number/select)
- **App branding** — `app.name` setting updates the header and browser title in real time; admins can upload a custom logo image to replace the default SVG icon
- **Audit log** — fire-and-forget `logAudit()` helper; events across auth/users/roles/messages/settings; `GET /audit` with pagination
- **Dashboard** — placeholder with pure-SVG charts
- **Chat assistant** — Ollama-backed fixed panel (`OLLAMA_URL=http://host.docker.internal:11434`); can be disabled via `chat.enabled` setting
- **Theme toggle** — dark/light, persisted to localStorage

## Project Structure

```
candidate/                      # The scaffold — clone this for new projects
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── CLAUDE.md                   # Full project reference for AI-assisted dev
├── frontend/                   # SvelteKit app — port 3000
│   └── src/
│       ├── routes/
│       │   ├── (marketing)/    # Public marketing pages
│       │   ├── api/            # SvelteKit → Fastify proxy routes
│       │   ├── dashboard/
│       │   ├── messages/
│       │   ├── settings/       # Admin: app configuration
│       │   ├── users/          # Admin: Manage Users
│       │   ├── roles/          # Admin: Manage Roles
│       │   ├── login/
│       │   ├── forgot-password/
│       │   └── reset-password/
│       └── lib/
│           ├── components/     # Shared UI components
│           ├── config/
│           │   ├── logo.ts     # Brand name / logo
│           │   └── nav.ts      # Sidebar nav items (module-extensible)
│           └── permissions.ts  # hasPermission(user, resource, action)
└── api/                        # Fastify app — port 4000
    └── src/
        ├── server.ts           # Entry point; routes auto-loaded from routes/
        ├── plugins/            # session, MongoDB, CORS, seed
        ├── routes/             # One subdirectory per resource (autoloaded)
        ├── data/
        │   └── permissions.json  # Default role permissions (module-extensible)
        └── lib/                # checkDuplicateUser, email, audit helpers

modules/                        # Build-time feature modules
├── commerce/                   # E-commerce: products, categories, orders, inventory
│   ├── module.json
│   ├── api/src/routes/commerce/
│   └── frontend/src/routes/commerce/
├── calendar-events/            # Typed timed events with subscribe/notification model
│   ├── module.json
│   ├── api/src/routes/calendar-events/
│   ├── api/src/lib/calendarNotify.ts
│   └── frontend/src/routes/calendar-events/
└── notifications/              # Example stub module
    ├── module.json
    ├── api/src/routes/notifications/
    └── frontend/src/routes/notifications/

arch.js                         # Project scaffold CLI (see below)
```

## Style Guide

Established UI patterns for the scaffold. Follow these exactly when adding new pages or components.

### Buttons

| Intent | Classes |
|--------|---------|
| Primary action | `btn btn-primary` |
| Destructive | `btn btn-error btn-outline` |
| Cancel / secondary | `btn btn-ghost` |
| Compact (in tables, toolbars) | add `btn-sm` |
| Icon-only | `btn btn-ghost btn-square btn-sm` |

### Page Header

Every route page that has a title uses this structure — do not inline it differently:

```svelte
<div>
  <h1 class="text-2xl font-bold">{title}</h1>
  <p class="text-sm opacity-60">{subtitle}</p>
</div>
```

### Cards

```svelte
<div class="card bg-base-100 border border-base-200">
  <div class="p-6 space-y-4">
    <!-- content -->
  </div>
</div>
```

Padding goes on the inner `div`, not on `.card` itself.

### Tables

Every `<tbody>` row must use the alternating-row class string:

```svelte
<tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors">
```

### Modals

Custom fixed overlay — do not use DaisyUI `.modal`:

```svelte
{#if open}
  <div transition:fade class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
    <div transition:scale class="card bg-base-100 border border-base-200 w-full max-w-md shadow-xl">
      <header class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-base-200">
        <h2 class="font-semibold">{title}</h2>
        <button class="btn btn-ghost btn-square btn-sm" onclick={() => open = false}>
          <X class="size-4" />
        </button>
      </header>
      <div class="p-6 space-y-4"><!-- body --></div>
      <footer class="flex items-center justify-between px-6 pb-5 pt-3">
        <div><!-- destructive action (delete) if applicable --></div>
        <div class="flex gap-3">
          <button class="btn btn-ghost" onclick={() => open = false}>Cancel</button>
          <button class="btn btn-primary">Save</button>
        </div>
      </footer>
    </div>
  </div>
{/if}
```

### Badges

| Use | Classes |
|-----|---------|
| Status label | `badge badge-{color}` |
| Status outline | `badge badge-{color} badge-outline` |
| Compact unread dot | `min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white bg-error` |

### Search Input

```svelte
<label class="input input-bordered flex items-center gap-2">
  <Search class="size-4 opacity-50" />
  <input class="grow" placeholder="Search…" bind:value={query} />
</label>
```

### Tabs

```svelte
<div class="flex gap-1 border-b border-base-200">
  <button
    class="px-4 py-2 text-sm font-medium border-b-2 transition-colors
      {active === 'tab' ? 'border-primary text-primary' : 'border-transparent hover:text-base-content'}"
    onclick={() => active = 'tab'}
  >Tab Label</button>
</div>
```

### Muted / Secondary Text

Use `text-sm opacity-60` for subtitles, hints, and secondary info. Do not use `text-base-content/60` or `text-gray-*`.

### Icon Sizing

| Context | Class |
|---------|-------|
| Inside buttons and inline text | `size-4` |
| Toolbar, card headers | `size-5` |
| Large decorative / empty states | `size-8` or `size-10` |

### Collapse Chevron

Always use `ChevronDown` with a CSS rotation — never swap between two icon components:

```svelte
<ChevronDown class="size-4 transition-transform {open ? 'rotate-180' : ''}" />
```

### Error / Alert Messages

```svelte
{#if error}
  <div role="alert" class="alert alert-error text-sm">{error}</div>
{/if}
```

## Module System

New projects are created from the scaffold with `arch.js`:

```bash
node arch.js create my-app                                   # scaffold only
node arch.js create my-app --modules calendar-events         # with modules
node arch.js create my-app --modules commerce,calendar-events # multiple modules
node arch.js list                                            # available modules
node arch.js info calendar-events                            # module manifest
```

`arch.js create` copies `candidate/` to `projects/<name>/`, updates the MongoDB database name, and for each module:
1. Copies route and frontend files (collision-checked before any write)
2. Appends nav entries to `frontend/src/lib/config/nav.ts`
3. Merges resource permissions into `api/src/data/permissions.json`
4. Merges `dependencies` into both `package.json` files
5. Appends env vars to `.env` and `.env.example`

### Writing a module

A module is a directory under `modules/` containing `module.json` and optional `api/` / `frontend/` subtrees that mirror the scaffold layout exactly.

```json
{
  "name": "my-feature",
  "description": "Short description",
  "nav": [{ "label": "My Feature", "href": "/my-feature", "icon": "Star", "permission": "my_feature.read" }],
  "permissions": [{ "resource": "my_feature", "actions": ["create", "read", "update", "delete"] }],
  "dependencies": { "frontend": {}, "api": {} },
  "env": [{ "key": "MY_API_KEY", "default": "", "description": "Required for My Feature" }]
}
```

Icons must be valid [lucide-svelte](https://lucide.dev) component names. The `permission` field is `"resource.action"` (dot-separated).

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
| `CALENDAR_REMINDER_INTERVAL_MS` | `1800000` | `MODULE: calendar-events` — reminder scheduler poll interval |

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
| DaisyUI v5 | https://daisyui.com/docs |
| Tailwind v4 | https://tailwindcss.com/docs |
| Fastify v5 | https://fastify.dev/docs |
| Nodemailer | https://nodemailer.com |

Build a custom theme: https://daisyui.com/docs/themes/ — set the `data-theme` attribute in `app.html` or configure themes in `tailwind.config.ts`.