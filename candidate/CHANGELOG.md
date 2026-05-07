# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

---

## 2026-05-07 (scaffold sync — backport from lmodulo)

### Added
- **`AuthShell` component** — dark-themed auth card (`AuthShell.svelte`) with grain SVG texture, radial purple glow, and animated pulsing dot. Wraps all auth pages; accepts `title`, `subtitle?`, `brandName?`, `brandLogo?` props. Renders `MarketingNav` with brand props so DB-configured branding appears on login/register/reset pages.
- **Avatar system** — `Avatar.svelte` (initials fallback + photo, sizes `xs`–`xl`) and `AvatarCropper.svelte` (canvas drag-to-reposition, zoom slider, outputs 256×256 JPEG blob). `POST /auth/avatar` saves to `uploads/avatars/{userId}.jpg`; `DELETE /auth/avatar` clears the URL. `avatarUrl` and `avatarColor` fields added to user documents and `/auth/me` response. Full avatar management UI on the profile page (Photo and Color tabs).
- **`GET /auth/config`** — public Fastify endpoint returning `{ registrationOpen: boolean }` so the register page can warn when self-registration is disabled.
- **Registration gating** — register route checks the `registration_open` setting; non-first users are rejected with 403 when registration is closed.
- **`(public)/` route group** — auth pages (`login`, `register`, `forgot-password`, `reset-password`) moved into a SvelteKit `(public)/` route group with a shared `+layout.svelte` that applies `APP_THEME`; URL paths are unchanged.

### Changed
- **Scaffold renamed `example/` → `candidate/`** — directory, all code references, docs, and memory files updated.
- **Sidebar layout** — replaced top-bar layout with a collapsible sidebar shell: `Avatar` + name in profile footer with slide-out drawer (Profile / User Management / Settings / Sign Out); animated accordion nav groups via CSS grid `grid-template-rows: 0fr → 1fr`; mobile hamburger with overlay; `lg:static` desktop sidebar. `ChatAssistant` placed outside the `overflow-hidden` shell to avoid fixed-child clipping.
- **`APP_THEME`** — `theme.ts` export changed from `THEME = { DEFAULT: 'business' }` object to `export const APP_THEME = 'business'` named export. All layout code updated to use `APP_THEME` directly.
- **Brand on auth pages** — `+layout.server.ts` now fetches `GET /settings/brand` even when the user is unauthenticated so `brandName`/`brandLogo` are available to `AuthShell` on all auth pages.
- **`MarketingNav`** — updated to accept `brandName`/`brandLogo` props; dark glassmorphic background (`color-mix(in oklch, oklch(8% …) 88%, transparent)` + `backdrop-filter: blur(14px)`).
- **`matchPrefix` on `NavItem`** — added optional `matchPrefix?: boolean` field; sidebar uses prefix-aware active state when set (e.g. Messages nav item stays active on all `/messages/**` routes).
- **6 roles seeded** — seed updated to owner, admin, lead, contributor, viewer, customer using `$setOnInsert` for idempotent upserts. Seed users changed to generic `admin@example.com` (admin) and `viewer@example.com` (viewer) with `avatarUrl: ''` and `avatarColor: ''`.

### Fixed
- **SvelteKit proxy routes for avatar** — `routes/api/auth/avatar/+server.ts` (POST/DELETE) and `routes/api/auth/profile/+server.ts` (PATCH) added to complete the frontend → API bridge.

---

## 2026-03-17 (websocket fixes)

### Fixed
- **Double `@fastify/websocket` registration** — `api/src/routes/notifications/index.ts` was re-registering the plugin that `server.ts` already registers globally. Removed the redundant `import` and `app.register(websocket)` call; the global registration makes `{ websocket: true }` available in all scopes.
- **WS URL hardcoded to port 4000** — `notifications.svelte.ts` connected directly to `ws://localhost:4000`, bypassing SvelteKit entirely. The browser now connects to `ws://<host>/notifications/ws` (same origin as the frontend). A Vite dev-server proxy (`/notifications/ws` → `ws://api:4000`) forwards the upgrade request through the internal Docker network, keeping session-cookie handling consistent with all other API traffic. Production deployments should add a matching `proxy_pass` in nginx.

---

## 2026-03-16 (notifications)

### Added
- `CORE` **Real-time notification system** — WebSocket-push notifications with persistent storage, unread badge, and per-user preferences.
  - **`notifications` + `notification_preferences` collections** — persisted notifications with 90-day TTL, groupKey deduplication, delivery tracking; preferences with channel toggles, mute list, and quiet hours.
  - **`app.notify()` decorator** (`api/src/lib/notifications/dispatch.ts`) — registered on the Fastify instance; other modules call it without importing internals. Checks mute preferences and quiet hours before persisting, then pushes to active WebSocket connections. Guard with `app.hasDecorator('notify')` if the module may not be present.
  - **Grouping** — `groupKey` deduplication: repeated events on the same key update the existing unread notification in place instead of flooding the list.
  - **`@fastify/websocket`** added to API (`^9.0.0`); `wsConnections` Map decorated on the root Fastify instance.
  - **REST API** — `GET /notifications`, `GET /notifications/unread-count`, `GET /notifications/recent`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`, `GET|PUT /notifications/preferences`, `GET /notifications/ws` (WebSocket upgrade).
  - **WebSocket protocol** — server → client: `init`, `notification`, `count-update`, `read-confirmed`, `sync-response`. Client → server: `mark-read`, `mark-all-read`, `sync`.
  - **`notifications.svelte.ts` store** — module-level `$state`; manages connection lifecycle with exponential-backoff reconnection; sends `sync` with last timestamp on reconnect; deduplicates by `_id`.
  - **`NotificationBell.svelte`** — header bell with unread badge, `SkMenu` dropdown of 10 most recent notifications, mark-all-read, "View all" link.
  - **`NotificationItem.svelte`** — notification row with type-mapped icon, unread dot, title, body, relative time.
  - **`+layout.svelte`** — `NotificationBell` added to header; `$effect` drives `connect()`/`disconnect()` lifecycle.
  - **`/notifications` page** — All/Unread filter tabs, load-more pagination.
  - **`/notifications/settings` page** — channel toggles, per-type mute checkboxes, quiet hours.
  - **SvelteKit catch-all proxy** at `api/notifications/[...path]`.
  - **`header-widgets.ts`** config added for future module-injectable header components.
  - Notifications nav entry added (Bell icon).

---

## 2026-03-16 (user management)

### Changed
- **Consolidated User Management page** — `/manage-users` and `/roles` merged into a single tabbed `/user-management` route. Server load requires `users.read` OR `roles.read`; fetches users and roles in parallel.
  - **Users tab** — full CRUD table (search, pagination, create/edit/delete modals).
  - **Roles tab** — permission accordion + User Assignments table; role changes sync back to Users tab state.
  - User menu dropdown reduces "Manage Users" + "Roles" to a single **User Management** entry; `ShieldCheck` import removed.
  - Old `/manage-users` and `/roles` routes removed.

### Added
- **Collapsible nav groups** — `nav.ts` exports `NavGroup`, `NavEntry`, and `isNavGroup()`. Sidebar renders groups as animated accordions (CSS grid `grid-template-rows`); active group auto-expands via `$effect`.

---

## 2026-03-16 (commerce module — storefront & dashboard)

### Added
- **Public storefront** (`modules/commerce/`) — Sandqvist-inspired shop accessible without authentication.
  - `StorefrontNav` — CSS grid `1fr auto 1fr` nav with hover mega-menu (Categories / Shop by Type / Collections columns), frosted-glass backdrop, theme toggle, Sign In CTA. Brand name/logo sourced from `getContext('appBranding')` so DB-configured settings are respected.
  - `ShopBreadcrumb` — persistent strip below the nav tracking Shop › Category › Product using `$app/stores` page params.
  - `/shop` landing — category grid with first-product image per category (aggregated server-side), falls back to placeholder.
  - `/shop/[category]` — product grid with `ProductCard` (sale badges, image hover zoom, transparent background).
  - `/shop/[category]/[slug]` — split layout: sticky image gallery with thumbnail strip (left), product details with variant selectors, disabled Add to Cart, tags, stock status (right).
  - `price.ts` utility — `formatPrice`, `applyDiscount`, `activeDiscount`, `discountLabel`.
  - `/storefront/meta` API — returns categories (with first product image), variant types, and tags in one request.
  - `/storefront/products` API — active products, filterable by category slug (resolved to `_id`), tag, and full-text search.
  - `/storefront/products/:slug` API — single product by slug, 404 if not active.
  - Frontend proxy `routes/api/storefront/[...path]` — no session cookie forwarded (public).
- **Analytics API** (`routes/analytics/index.ts`) — single `GET /analytics` endpoint (`requireAuth`) returning all dashboard data in one request: daily revenue (30d, zero-filled), monthly revenue (12mo, zero-filled), revenue by product (`$unwind items`), stock by product, recent 50 orders, calendar data (90d), and KPIs (total revenue, total orders, avg order value, top product).
- **Commerce dashboard** — replaces dummy RNG data with real MongoDB aggregations.
  - 4 charts: Daily Revenue (line+area), Revenue by Product (hbar), Inventory Stock by Product (hbar), Monthly Revenue (area). All pure SVG, no chart libraries.
  - KPI cards: Total Revenue, Total Orders, Avg Order Value, Top Product.
  - Orders table: Order #, Date, Customer email, Items, Total, Status — paginated with Skeleton `Pagination`.
  - Order Calendar: heat-map intensity by revenue, order count per day.
- **Seed data** (`api/src/plugins/seed.ts`) — 3 categories, 7 products (with variants, discounts, stock), 60 orders seeded using a deterministic LCG RNG (seed `8675309`). Orders reference real product IDs; statuses distributed across all 6 states. Idempotent: orders only seeded if collection is empty.
- **`start.ps1`** for `projects/potency/` — builds and starts all services in one command.

### Fixed
- **Static file upload path** (`api/src/server.ts`) — `fastifyStatic` root was `join(__dirname, '../../uploads')` which resolved to `/uploads` (filesystem root) in the compiled Docker container. Corrected to `join(__dirname, '../uploads')` → `/app/uploads`, matching the Docker named volume mount.
- **Upload images accessible without auth** (`frontend/src/hooks.server.ts`) — unauthenticated requests to `/uploads/*` were redirected to `/login`. Added `/uploads/` to the public path exceptions alongside `/api/`.
- **StorefrontNav brand name** — was reading `brand.text` from static config; now uses `getContext('appBranding')` so the DB-configured app name/logo is shown instead of the hardcoded fallback.
- **Category/product grid background** — `product-grid` and `ProductCard` backgrounds changed from surface color variables to `transparent`, preventing a coloured fill when image slots are empty.

---

## 2026-03-15 (module system)

### Added
- **Build-time module system** — features can be composed into new projects via `arch.js` without modifying the scaffold. No runtime plugin system; modules are baked in at build time.
  - `node arch.js create <name> [--modules a,b] [--no-install]` — copies scaffold to `projects/<name>/`, updates MongoDB DB name, merges each module, runs `npm install`.
  - `node arch.js list` — prints available modules with descriptions.
  - `node arch.js info <module>` — dumps a module's `module.json`.
- **Five merge points** — each handled automatically during `arch.js create`:
  1. **Routes** — `@fastify/autoload` discovers route files by directory; modules drop files into `api/src/routes/<resource>/index.ts` with zero merge conflict.
  2. **Nav** — sidebar nav items read from `frontend/src/lib/config/nav.ts`; modules append entries. Duplicate icon imports are detected and skipped.
  3. **Permissions** — seed defaults read from `api/src/data/permissions.json`; modules declare their resource + actions and `arch.js` merges them. Admin gets all declared actions; viewer gets `read` only.
  4. **Package deps** — `dependencies` from `module.json` deep-merged into both `package.json` files; version conflicts warn and keep existing.
  5. **Env vars** — module env entries appended to `.env` and `.env.example` if key not already present; conflicting defaults emit a warning.
- **Collision safety** — `arch.js` walks all module source trees and checks for scaffold conflicts and module-vs-module conflicts before writing any files. Fails fast with a clear error.
- **`modules/notifications/`** — stub module validating the full system: `Bell` nav link (permission-gated), `notifications` resource in permissions, API route returning empty array, frontend page + proxy route.
- **Scaffold changes required by the module system:**
  - `@fastify/autoload` replaces 8 manual route registrations in `server.ts`. Route files moved to `routes/<name>/index.ts` subdirectories; relative lib imports updated to `../../lib/`.
  - `frontend/src/lib/config/nav.ts` created with `NavItem` interface; sidebar nav in `+layout.svelte` now iterates `navItems` using Svelte 5 `{@const Icon = item.icon}<Icon />` pattern.
  - `api/src/data/permissions.json` extracted from `seed.ts` constants; read via `fs.readFileSync` at boot. Dockerfile updated to copy `src/data/` into `dist/data/` alongside compiled output.

---

## 2026-03-15 (settings)

### Added
- **Settings page** — admin-only key/value configuration store backed by a `settings` MongoDB collection.
  - `GET /settings` and `PATCH /settings/:key` API endpoints, both gated by `requirePermission('settings', ...)`.
  - Three default settings seeded on boot: `app.name` (string), `app.registration_open` (boolean), `theme.mode` (select: light/dark).
  - Seed uses `$setOnInsert` on `value` — user-edited values survive restarts; structural fields (`label`, `description`, `type`) stay current.
  - Unique index on `settings.key`.
  - Frontend `/settings` page with inline row editing; input renders as checkbox, select, or text/number based on `type`.
  - Settings link added to user menu dropdown, gated by `hasPermission(data.user, 'settings', 'read')`.
  - `setting.update` audit log event on every save.
  - `settings` permission added to both default roles: admin gets read + update; viewer gets none.

---

## 2026-03-15 (audit log)

### Added
- **Audit log** — `audit_logs` MongoDB collection recording privileged and auth events.
  - Fire-and-forget `logAudit()` helper in `api/src/lib/audit.ts` — sync, returns void, errors logged to console only (no request impact).
  - `GET /audit` endpoint (admin-only, `requirePermission('audit', 'read')`) with `limit` (max 200) and `skip` pagination, sorted newest-first.
  - 14 events instrumented across 4 route files: `auth.register`, `auth.login`, `auth.logout`, `auth.profile_update`, `auth.password_reset_request`, `auth.password_reset`, `user.create`, `user.update`, `user.delete`, `user.role_change`, `role.create`, `role.update`, `role.delete`, `message.send`, `message.reply`.
  - Each entry records: `userId`, `username` (denormalized), `action`, `resourceId`, `meta`, `ip`, `createdAt`.
  - Three indexes on `audit_logs`: `createdAt`, `userId+createdAt`, `action+createdAt`.
  - `audit` resource added to default role permissions: admin gets `read: true`; viewer gets no access.

---

## 2026-03-15

### Added
- **API self-documentation via `@fastify/swagger`** — OpenAPI 3.0 spec auto-generated from existing route schemas. Dev-only (skipped when `NODE_ENV=production`).
  - `GET /docs/yaml` — human-readable YAML listing all endpoints, summaries, and request body schemas.
  - `GET /docs/json` — equivalent JSON (compatible with Insomnia, Postman, VS Code OpenAPI extensions).
  - Zero schema duplication: the plugin reads the JSON schemas already defined on every Fastify route.
  - OpenAPI metadata: title `Architectonic API`, `session` cookie security scheme declared.
- **Route summaries** added to all 26 routes across `auth.ts`, `users.ts`, `roles.ts`, `messages.ts`, and `health.ts` — one-line description per route, surfaced in the YAML output.
- **`@fastify/swagger`** added to API dependencies.

---

## 2026-03-15

### Added
- **Password reset flow** — full forgot-password → email token → reset-password recovery path.
  - `POST /auth/forgot-password` — accepts email, generates a 32-byte cryptographic token, stores the SHA-256 hash + 1-hour expiry on the user document, and fires a reset email. Always returns 204 regardless of whether the email exists (prevents user enumeration).
  - `POST /auth/reset-password` — accepts raw token + new password; hashes the token, finds the matching (non-expired) user, updates `passwordHash` with bcrypt (12 rounds), and clears the token fields. Returns 400 on invalid or expired tokens.
  - Token security: raw token never stored in MongoDB — only SHA-256 hash. Single-use; fields are `$unset` on successful reset.
- **`api/src/lib/email.ts`** — Nodemailer transport helper.
  - If `SMTP_HOST` is set: uses configured SMTP credentials (compatible with any provider — Resend, Postmark, Mailgun, etc.).
  - If `SMTP_HOST` is unset (default dev): auto-provisions an [Ethereal](https://ethereal.email) catch-all account and logs the email preview URL to the API console after each send.
  - Exports `sendPasswordResetEmail(to, resetUrl)`.
- **`/forgot-password` page** — email input form; after submission always shows a neutral “if that email is registered…” message.
- **`/reset-password` page** — new password + confirm fields; client-side mismatch validation; redirects to `/login?reset=1` on success.
- **Login page** — “Forgot password?” link below the submit button; success banner shown when arriving via `?reset=1`.
- **SMTP env vars** added to `.env.example` and forwarded to the `api` service in `docker-compose.yml`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_URL`.
- **`nodemailer`** added to API dependencies.

---

## 2026-03-14

### Added
- **In-app messaging system** — full email-style messaging between authenticated users.
  - Thread-based model: new messages start a thread (`_id === threadId`); replies inherit subject and collect all prior participants.
  - Per-user `message_state` documents track `read`, `archived`, and `deleted` independently for each recipient and the sender.
- **API routes** (`api/src/routes/messages.ts`, registered at `/messages`):
  - `GET /messages` — inbox (threads where user is in `to`/`cc`, not deleted, grouped by thread, sorted newest-first).
  - `GET /messages/unread-count` — badge count of unread, non-deleted state rows.
  - `GET /messages/sent` — threads where `from === userId`.
  - `GET /messages/archived` — threads with `archived: true`.
  - `GET /messages/:threadId` — full thread sorted chronologically; auto-marks all unread messages as read; resolves sender display names.
  - `POST /messages` — compose new thread; creates message + `message_state` rows for every recipient plus the sender (sender's row marked read).
  - `POST /messages/:threadId/reply` — appends a reply; collects all unique thread participants as recipients.
  - `PATCH /messages/:threadId/state` — updates `read`, `archived`, and/or `deleted` for the calling user across all messages in the thread.
- **SvelteKit proxy routes** (7 files under `frontend/src/routes/api/messages/`) — forward session cookie to the API, return JSON; mirrors the API surface exactly.
- **`MessageEditor` component** (`src/lib/components/MessageEditor.svelte`) — Tiptap rich-text editor with Bold, Italic, Underline, Bullet List, Ordered List, Blockquote, Undo, Redo toolbar. Exposes `bind:html` prop.
- **`MessageListItem` component** (`src/lib/components/MessageListItem.svelte`) — thread row showing unread dot, sender name (bold when unread), subject, and formatted timestamp (time for today, date for older).
- **Messages layout** (`frontend/src/routes/messages/+layout.svelte`) — two-panel shell: 288 px fixed left sidebar + scrollable right slot. Sidebar has a Compose button and Inbox / Sent / Archive tabs that fetch lazily on switch.
- **Inbox / Compose / Thread pages**:
  - `+page.svelte` — empty state with Mail icon when no thread is selected.
  - `compose/+page.svelte` — recipient chip picker (datalist autocomplete, add by Enter/comma or selection), subject field, Tiptap body; POSTs to `/api/messages` and navigates to the new thread.
  - `[threadId]/+page.svelte` — stacked messages with avatar initials, sender name, timestamp, and rendered HTML body; collapsed Reply button expands to an inline Tiptap editor.
  - `[threadId]/+page.server.ts` — server-side thread load (errors on 404/403).
- **AppBar unread badge** — Mail icon (with red count badge) added to the header between the theme toggle and the user menu. Badge also appears on the Messages sidebar link. Count is seeded from SSR on initial load, then kept live client-side via a `$effect` that re-fetches `/api/messages/unread-count` on every route change.
- **Tiptap packages** installed in `frontend/`: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`, `svelte-tiptap@3.0.1`, `@tiptap/pm`.
- **MongoDB indexes** for `messages` (`threadId + createdAt`, `from + createdAt`) and `message_state` (`userId + deleted + read`, unique `messageId + userId`).
- **`messages` permission** (`create/read/update/delete: true`) added to both `admin` and `viewer` roles in `seed.ts`.

---

## 2026-03-13

### Added
- **New User modal on Manage Users page** — "New User" button (UserPlus icon) sits inline to the right of the search filter. Visible only to users with `users.create` permission. Opens a modal with First Name, Last Name, Username, Email, Password, and Confirm Password fields. On success the new user is prepended to the table without a page reload.
- **`POST /users` API route** — admin-only endpoint (requires `users.create` permission) that creates a user, hashes the password with bcrypt, assigns the `viewer` role, and returns the new user record without establishing a session.
- **`POST /api/users` SvelteKit proxy route** — forwards create-user requests from the frontend to the API, forwarding the session cookie for auth.

### Removed
- **Public registration page** (`/register`) — route, server action, and all associated files deleted.
- **Registration links** — removed from MarketingNav, login page footer, marketing hero CTA, marketing pricing cards, and marketing bottom CTA. All former `/register` links now point to `/login`.
- `/register` removed from the server hook's `AUTH_REDIRECT_PATHS` set.

### Fixed
- Dashboard welcome message now displays `firstName` when available, falling back to `username`.
- Dashboard `$c` currency formatter renamed to `fmt` to comply with Svelte 5's reserved `$` prefix rule.
