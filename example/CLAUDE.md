# Architectonic — Project Reference

## Purpose
Full-stack SvelteKit + Fastify application scaffold. The `example/` directory IS the scaffold — clone it to start a new project.

## Stack
- **Frontend:** SvelteKit 2 + Svelte 5 runes, Tailwind v4, Skeleton v4 (`@skeletonlabs/skeleton-svelte`), TypeScript
- **API:** Fastify 5, MongoDB 7, TypeScript
- **Auth:** Session cookies (`@fastify/session`), bcryptjs password hashing
- **Chat:** Ollama (host machine via `host.docker.internal:11434`)
- **Rich text:** Tiptap (`@tiptap/core`, `svelte-tiptap@3.0.1`)

## Structure
```
example/
  frontend/          SvelteKit app — port 3000
  api/               Fastify app — port 4000
  docker-compose.yml
  docker-compose.dev.yml
```

## Commands
```bash
# Development (bind mounts — web only, API requires rebuild)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Restart a service (picks up env changes, not code changes)
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web
docker compose -f docker-compose.yml -f docker-compose.dev.yml restart api

# Rebuild after code changes (ALWAYS required on Windows — no FS event hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml build web
docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d web
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
```

> **Windows note:** Bind mounts don't propagate FS events reliably. Server-side files NEVER hot-reload; `.svelte` changes often require a rebuild too. Never say "Vite will hot-reload this."

> **PowerShell note:** `&&` is not valid in PowerShell. Use `;` or run commands separately.

## API Conventions

### Route files — `api/src/routes/`
- One file per resource: `auth.ts`, `users.ts`, `roles.ts`, `messages.ts`
- Registered in `api/src/server.ts` with a prefix (e.g. `prefix: '/users'`)
- Auth enforced via `preHandler: app.requireAuth` or `app.requirePermission(resource, action)`

### Shared utilities — `api/src/lib/`
- Cross-route helpers live here, not in route files
- Example: `lib/users.ts` exports `checkDuplicateUser()` — used by both `auth.ts` and `users.ts`

### Permissions
- Defined per-role in MongoDB `roles` collection, seeded in `api/src/plugins/seed.ts`
- Checked on the API with `requirePermission(resource, action)` preHandler
- Checked on the frontend with `hasPermission(data.user, resource, action)` from `$lib/permissions`

## Frontend Conventions

### Route structure — `frontend/src/routes/`
- API proxy routes under `api/` — forward session cookie to Fastify, return JSON
- Layout server loads handle SSR data; client-side fetches for dynamic updates
- Auth redirect enforced in `hooks.server.ts`

### Component locations
- `$lib/components/` — shared UI components
- `$lib/config/logo.ts` — `brand` object (`text`, `image`, `description`)
- `$lib/permissions.ts` — `hasPermission(user, resource, action)`
- `$lib/chat.svelte.ts` — chat store (module-level `$state`, persists across navigation)

### Logo
- Always use `<Logo />` (icon + text) or `<LogoIcon />` (SVG only) — never `<img>` for the logo
- `LogoIcon.svelte` uses `fill="currentColor"` so it inherits CSS `color`

### Svelte 5 rules
- Never name variables/functions starting with `$` in component scripts (reserved prefix)
- Use `$state`, `$derived`, `$effect`, `$props` runes
- `onMount` for DOM-dependent initialization

### UI patterns
- **Alternating table rows:** `odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors`
- **Compact badge:** `min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white`
- **Charts:** Pure SVG + JS math — no charting libraries
- **Dummy data:** Seeded LCG RNG via `makeRng(seed)` for determinism
- **Permission-gated UI:** Always wrap admin actions in `{#if hasPermission(data.user, resource, action)}`

### ChatAssistant placement
Rendered after the closing `</div>` of the `h-screen overflow-hidden` shell in `+layout.svelte`. Fixed-position children are clipped by `overflow-hidden` ancestors — placing it outside the shell avoids that.

## Ollama / Chat
- `OLLAMA_URL=http://host.docker.internal:11434` — `localhost` inside a container refers to the container, not the Windows host
- Proxied via frontend `/api/chat` route

## Features Included in Scaffold
- **Auth:** Login, logout, session management, profile edit
- **RBAC:** Roles + permissions, Manage Users page (admin), Roles page
- **Messaging:** Full email-style in-app messaging — threads, replies, inbox/sent/archive, unread badge, Tiptap rich-text editor
- **Dashboard:** Placeholder with charts (pure SVG)
- **Chat assistant:** Ollama-backed, fixed bottom-right panel
- **Theme toggle:** Dark/light, persisted to localStorage
