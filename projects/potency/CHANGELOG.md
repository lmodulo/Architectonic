# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

---

## 2026-03-16 (notifications)

### Added
- **Real-time notification system** — WebSocket-push notifications with persistent storage, unread badge, and per-user preferences.
  - **`app.notify()` decorator** — registered on the Fastify instance; call from any route with `app.notify({ userId, type, title, ... })`.
  - **Grouping** — `groupKey` deduplication prevents notification flooding from high-frequency events.
  - **`@fastify/websocket`** added; `wsConnections` Map decorated on root Fastify instance.
  - **REST API** — list (paginated), unread count, recent (bell dropdown), mark read, mark all read, preferences CRUD, WebSocket upgrade at `GET /notifications/ws`.
  - **WebSocket store** (`notifications.svelte.ts`) — exponential-backoff reconnection, `sync` on reconnect, `_id` deduplication.
  - **`NotificationBell`** in header with unread badge and dropdown.
  - **`/notifications`** and **`/notifications/settings`** pages.
  - `@fastify/websocket: ^9.0.0` added to API dependencies.

---

## 2026-03-16 (user management)

### Changed
- **Consolidated User Management page** — `/manage-users` and `/roles` merged into a single tabbed `/user-management` route. Server load fetches users + roles in parallel; requires `users.read` OR `roles.read` (403 redirect if neither).
  - **Users tab** — full CRUD table (search, pagination, create/edit/delete modals).
  - **Roles tab** — permission accordion + User Assignments table; role changes sync back to the Users tab state reactively.
  - User menu dropdown reduced to a single **User Management** entry visible with either users or roles read permission.
  - Old `/manage-users` and `/roles` routes removed.

---

## 2026-03-16 (storefront & commerce dashboard)

### Added
- **Public storefront** — customer-facing shop accessible without authentication.
  - `StorefrontNav` — CSS grid `1fr auto 1fr` nav with hover mega-menu, frosted-glass backdrop, theme toggle, Sign In CTA. Brand name/logo read from `getContext('appBranding')`.
  - `ShopBreadcrumb` — persistent Shop › Category › Product trail.
  - `/shop` — category grid with first-product image per category (server-side aggregation).
  - `/shop/[category]` — product grid with `ProductCard` (sale badges, hover zoom).
  - `/shop/[category]/[slug]` — sticky image gallery + variant selectors, Add to Cart (disabled), stock status.
  - `price.ts` — `formatPrice`, `applyDiscount`, `activeDiscount`, `discountLabel`.
  - Storefront API: `/storefront/meta` (categories, variant types, tags), `/storefront/products` (filterable), `/storefront/products/:slug`.
  - Frontend proxy `api/storefront/[...path]` — no session forwarded (public).
- **Analytics API** — `GET /analytics` returns all dashboard data in one request: daily revenue (30d), monthly revenue (12mo), revenue by product, stock by product, recent orders, calendar data (90d), KPIs.
- **Commerce dashboard** — replaces dummy data with real MongoDB aggregations.
  - 4 pure-SVG charts: Daily Revenue (line+area), Revenue by Product (hbar), Inventory Stock (hbar), Monthly Revenue (area).
  - KPI cards: Total Revenue, Total Orders, Avg Order Value, Top Product.
  - Orders table with pagination.
  - Order Calendar heat-map by revenue.
- **Seed data** — 3 categories, 7 products (variants, discounts, stock), 60 orders generated with deterministic LCG RNG (seed `8675309`). Idempotent.
- **`start.ps1`** — single command to build and start all services.

### Fixed
- `fastifyStatic` root path corrected from `../../uploads` to `../uploads` — resolves to `/app/uploads` in the Docker container (was resolving to filesystem root).
- Unauthenticated requests to `/uploads/*` were redirected to `/login`; added `/uploads/` to public path exceptions in `hooks.server.ts`.
- `StorefrontNav` brand name now reads `getContext('appBranding')` instead of static `brand.text`.

---

## 2026-03-16 (nav groups & design)

### Added
- **Collapsible nav groups** — sidebar supports `NavGroup` entries (label + icon + children array) with CSS grid accordion animation. Active group auto-expands on load.
- **Commerce nav group** — Products, Orders, Categories, Inventory grouped under a collapsible "Commerce" section with `Store` icon.

### Changed
- **Custom theme** — `lmodulo-theme.css` applied; `app.css` uses Option A (custom-only, no built-in base). `app.html` sets `data-theme="lmodulo"`.
- **Marketing page** redesigned — full-page hero, feature sections, and pricing reworked to match the lmodulo design system.
- **`MarketingNav`** updated with Sign In / Sign Up links and correct branding.
- **`StorefrontNav`** background and layout tweaks for lmodulo theme compatibility.

---

## 2026-03-16 (customer role)

### Added
- **`customer` role** — new role seeded on boot alongside `admin` and `viewer`. Permissions: `commerce_products` read, `commerce_orders` create + read, `commerce_categories` read. No access to admin resources (users, roles, settings, audit, messages, dashboard).
- **Public registration** (`/register`) — customers self-register via a new `/register` page and server action. Calls `POST /auth/register`; sets session cookie and redirects to `/`. Login page now shows a "Sign up" link.
- **Customer route guard** (`hooks.server.ts`) — authenticated customers are restricted to `/`, `/profile`, and `/logout`. Any other route redirects to `/`. Staff (admin/viewer) are unaffected.
- **Role-based login redirect** — login action reads `role` from the API response and redirects customers to `/` and staff to `/dashboard`.
- **`UserProfile` interface** (`api/src/lib/users.ts`) — typed `profile` subdocument shape (`shippingAddresses`, `billingAddress`, `stripeCustomerId`, `marketingOptIn`) for future customer-specific data.

### Changed
- `POST /auth/register` assigns `customer` role to all non-first-user registrations (previously `viewer`). First user still becomes `admin`.
- `POST /auth/login` response now includes `role` field.
- `GET /users` excludes documents with `role: 'customer'` — staff user list stays clean. A dedicated Customer section will be added separately.

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
