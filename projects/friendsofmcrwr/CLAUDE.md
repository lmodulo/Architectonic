# Architectonic — Project Reference

> **Before writing any frontend code:** Read `README.md` (repo root) — the Style Guide section is the authority for all UI patterns, tokens, and component structure.

## Purpose
Full-stack SvelteKit + Fastify application scaffold. The `candidate/` directory IS the scaffold — clone it to start a new project.

## Stack
- **Frontend:** SvelteKit 2 + Svelte 5 runes, Tailwind v4, DaisyUI v5, TypeScript
- **API:** Fastify 5, MongoDB 7, TypeScript
- **Auth:** Session cookies (`@fastify/session`), bcryptjs password hashing
- **Chat:** Ollama (host machine via `host.docker.internal:11434`)
- **Rich text:** Tiptap (`@tiptap/core`, `svelte-tiptap@3.0.1`)

## Structure
```
candidate/
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

### Rate limit
- 200 requests a minute per visitor (`plugins/rateLimitPlugin.ts`), with tighter per-route limits on the auth routes (login 10 a minute)
- Browsers reach the API only through the web server, so the web server says who the visitor is: `$lib/server/api-identity.ts` (installed by `hooks.server.ts`) wraps the global `fetch` so every server-side call to `API_URL` carries `INTERNAL_API_SECRET` plus the visitor's address, and `api/src/lib/callerKey.ts` keys the limit on that address when the secret matches. Keep calling the API with the global ``fetch(`${API_URL}…`)``; a call made any other way counts against the web server's own, shared address
- Without `INTERNAL_API_SECRET` (set in `.env`; `arch.js` generates one per project) every visitor shares one limit. Behind a reverse proxy, also set adapter-node's `ADDRESS_HEADER` / `XFF_DEPTH` on the web service

### Permissions
- Defined per-role in MongoDB `roles` collection, seeded in `api/src/plugins/seed.ts`
- Checked on the API with `requirePermission(resource, action)` preHandler
- Checked on the frontend with `hasPermission(data.user, resource, action)` from `$lib/permissions`

## Frontend Conventions

### Route structure — `frontend/src/routes/`
- API proxy routes under `api/` — forward session cookie to Fastify, return JSON
- Layout server loads handle SSR data; client-side fetches for dynamic updates
- Auth redirect enforced in `hooks.server.ts`
- Module routes: a module declares public, customer and/or shell-free ("bare") routes by shipping `src/lib/config/module-routes/<module>.ts` (default-export `RouteRule[]`, see `$lib/config/route-rules.ts`). `hooks.server.ts` and the root layout pick these up automatically; no scaffold edits needed (e.g. commerce makes `/shop` public + bare; folio makes `/client-portal/invoices` a `customer` route, open to signed-in customers but not to logged-out visitors). A rule matches a path `prefix` (on segment boundaries) or an exact SvelteKit `routeId` (e.g. `'/(site)/[...path]'`, for a catch-all whose URLs aren't known up front); with both set, both must match. Hooks pass `event.route.id`, the layout passes `page.route.id`
- Home page override: a module can replace `/` by shipping a server loader `src/lib/server/module-home/<key>.ts` (default-exports `(event) => Promise<object | null>`) plus a component `src/lib/config/module-home/<key>.svelte` that receives the loader's result as `data`. `routes/+page.server.ts` runs the loaders in file-name order and the first non-null result wins; a loader that throws is skipped. When none returns data, `/` renders the scaffold marketing page (`$lib/components/ScaffoldHome.svelte`). Keep loaders server-only (they may use `$env/dynamic/private`); the component file is client code
- Customers (role `customer`) only see `customerOnly` nav items and may only open `CUSTOMER_ALLOWED_PATHS` plus `customer`/`public` routes. After login, or when they hit a staff page, they go to `customerHome()` (`$lib/customer-home.ts`): the first `customerOnly` nav item they have permission for, else `/`. Module APIs must scope customers by their workspace role (`workspace_members`), never `users.role`, which self-registered users don't have
- Documentation: `/documentation` is public and shell-free (core rule in `route-rules.ts`). Core pages live in `routes/(docs)/documentation/`; modules add theirs plus a `$lib/config/module-docs/<module>.ts` registry entry (see `$lib/config/docs.ts`)

### Component locations
- `$lib/components/` — shared UI components
- `$lib/config/logo.ts` — `brand` object with `description` (static scaffold fallback for `<title>`)
- `$lib/permissions.ts` — `hasPermission(user, resource, action)`
- `$lib/chat.svelte.ts` — chat store (module-level `$state`, persists across navigation)

### App Name vs Brand
- **App Name** — static, from `APP_NAME` env var. Used in `<title>`. Read in `+layout.server.ts` via `$env/dynamic/private` and passed as `data.appName`. Falls back to `'Application'`.
- **Brand** — runtime-configurable MongoDB settings (`brand.name`, `brand.logo`). Publicly readable (like `theme.mode`) so logged-out pages can show them. Used in the app header logo slot. Any combination is allowed; only fields with values display in the nav.

### Logo component
- Use `<Logo brandName={...} brandLogo={...} />` — both props optional, default `''`
- If `brandLogo` is set → renders `<img>`; if `brandName` is set → renders text; if both empty → renders nothing
- Upload endpoint: `POST /api/settings/logo` (multipart) — saves `brand.logo` only
- Remove logo by PATCHing `brand.logo` with `value: ''`
- Set brand name by PATCHing `brand.name`
- Static uploads proxied through SvelteKit at `/uploads/[...path]` → API `/uploads/[...path]`

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
- **Auth:** Login, logout, session management, profile edit; `AuthShell` for all auth pages (app-shell look: top bar, `PageHeader` banner, base-200 card, active theme); `(public)/` route group
- **Avatar:** Photo upload with `AvatarCropper` (canvas crop + zoom); colour picker fallback; `Avatar` component (initials or photo); `POST/DELETE /auth/avatar`
- **Workspaces:** Multi-tenant isolation; `workspaces` + `workspace_members` collections; session-stored `workspaceId`; `WorkspaceSwitcher` component (hidden for customers and single-workspace users); `/settings/workspaces` (General + Members tabs); `POST /workspaces/:id/switch`
- **RBAC:** Roles per workspace (stored in `workspace_members`, not on user document): owner, admin, lead, contributor, viewer, customer; `requirePermission` preHandler; `hasPermission()` frontend helper; Manage Users + Roles pages
- **Messaging:** Full email-style in-app messaging — threads, replies, inbox/sent/archive, unread badge, Tiptap rich-text editor
- **Dashboard:** Calendar + live module widgets (`$lib/config/dashboard-widgets.ts`, merged from module.json `widgets`); no generated data. Opt-in demo data: `SEED_DEMO_DATA=true` runs module `api/src/seeds/*`
- **Live notifications:** the browser opens `/notifications/ws` on the web host. In dev Vite's proxy passes it to the API (`vite.config.ts`); in production `frontend/server.js` does (it starts adapter-node's `build/index.js` and adds the upgrade pass-through; the Dockerfile runs `node server.js`). The pass-through sends `INTERNAL_API_SECRET` and the visitor's address like any other API call, and refuses other paths and other sites' `Origin`
- **Chat assistant:** Ollama-backed, fixed bottom-right panel
- **Theme:** Runtime DaisyUI theme from Settings → Theme (`theme.mode`, publicly readable). Root `+layout.server.ts` loads it; `hooks.server.ts` writes it into `<html data-theme="%app.theme%">`; `APP_THEME` in `$lib/config/theme.ts` is only the fallback. Available themes = `app.css` plugin list + seed options
- **Layout:** Sidebar-based shell with collapsible nav groups, profile footer, `Avatar` in sidebar; shell `data-theme` bound to `data.theme`
