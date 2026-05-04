# Changelog

All notable changes to the Architectonic framework and its modules are documented here.

Entries are tagged:
- `CORE` — changes to the scaffold in `example/` that apply to all projects
- `MODULE: <name>` — changes to a specific module in `modules/<name>/`

---

## [Unreleased]

---

## 2026-05-04

### Added
- `MODULE: calendar-events` **Typed calendar events with subscribe/notification model** — generalized timed-event system usable for upcoming events, project scopes, deadlines, announcements, or any custom type. Designed as the pattern module for all future timed-event features.
  - **`calendar_events` collection** — documents carry `title`, `content` (HTML), `eventType` (free-text string; well-known values: `upcoming_event`, `deadline`, `announcement`, `project_scope`), `startDate`, `endDate`, `singleDay`, `allDay`, `location`, `tags[]`, `status` (`active`/`draft`/`cancelled`), `visibility` (`public`/`authenticated`/`private`), `createdBy`, `updatedBy`. 6 MongoDB indexes including compound `{status, visibility, startDate}` for the public endpoint and a weighted text index (`title:10, tags:5, content:1`).
  - **`event_subscriptions` collection** — one document per user (unique index on `userId`). Fields: `eventTypes[]` (empty = all types), `notifyOn.{newEvent, reminder, reminderDays}`, `channels.{inApp, email}`. Index on `{notifyOn.reminder, notifyOn.reminderDays}` for scheduler queries.
  - **API** (`api/src/routes/calendar-events/`):
    - `GET /calendar-events/public` — unauthenticated; returns `visibility: public` + `status: active` events within a date window (default today → +1 year); filterable by `type`, `from`, `to`.
    - `GET /calendar-events` — authenticated list; filterable by `type`, `status`, `visibility`, `search` (text index), `from`, `to`; paginated with `limit`/`skip`. Requires `calendar_events.read`.
    - `POST /calendar-events` — create; fires subscriber notifications on success. Requires `calendar_events.create`.
    - `GET /PATCH /DELETE /calendar-events/:id` — single-event CRUD. PATCH is partial. Requires appropriate permission.
    - `GET /PUT /DELETE /calendar-events/subscriptions/me` — per-user subscription upsert; GET returns defaults when no subscription exists.
  - **`calendarNotify.ts`** (`api/src/lib/`) — notification dispatch helpers. `notifyNewEvent()` calls `dispatch()` for in-app delivery (respects mute + quiet-hours via existing preferences), then sends email via nodemailer to subscribers with `channels.email: true`. `notifyEventReminder()` follows the same pattern with per-user `groupKey` deduplication.
  - **Reminder scheduler** (`api/src/routes/calendar-events/scheduler.ts`) — `setInterval` loop started in the Fastify `onReady` hook. On each tick, derives distinct `reminderDays` values from active subscriptions, queries events whose `startDate` falls within a ±½-interval window of `now + N days`, and fans out `notifyEventReminder()` calls. Interval configurable via `CALENDAR_REMINDER_INTERVAL_MS` (default 30 min). Timer is `.unref()`'d for clean process exit.
  - **Frontend components** (`frontend/src/lib/components/`):
    - `EventTypeBadge.svelte` — maps known types to Skeleton preset tonal classes; unknown types fall back to `preset-tonal-surface`.
    - `EventCalendarGrid.svelte` — pure-display monthly grid with month navigation; coloured event pills per day; `onEventClick` callback; `readonly` prop disables interaction.
    - `EventCard.svelte` — date badge (coloured by type), title, `EventTypeBadge`, formatted date range, location, tags, HTML content. `compact` prop strips content and truncates for list views.
    - `EventModal.svelte` — create/edit modal; fields: title, type, status, dates, singleDay/allDay toggles, visibility, location, tags, Tiptap `MessageEditor` for description; permission-gated delete with confirm dialog.
    - `SubscriptionPanel.svelte` — client-side subscription UI; unauthenticated state shows sign-in prompt; authenticated state shows master toggle, per-type checkboxes, new-event and reminder toggles (with day selector), email opt-in; saves via `PUT /api/calendar-events/subscriptions`.
  - **Frontend utility** (`frontend/src/lib/utils/calendarEvents.ts`) — `normalizeEvent()`, `fmtDateRange()`, `fmtShortRange()`, `eventsForDay()`, `groupByMonth()`, `typePreset()`, `typePillClass()`, `typeLabel()`.
  - **Public page** (`/calendar-events`) — SSR-loaded upcoming public events; type-filter tab bar; `SubscriptionPanel` for authenticated users; month-grouped `EventCard` list.
  - **Admin page** (`/calendar-events/admin`) — permission-gated; search + type + status filters; calendar/list view toggle; `EventCalendarGrid` with click-to-edit; `EventModal` for full CRUD. Redirects to `/403` if user lacks `calendar_events.read`.
  - **4 SvelteKit proxy routes** — `GET+POST /api/calendar-events`, `GET+PATCH+DELETE /api/calendar-events/[id]`, `GET /api/calendar-events/public`, `GET+PUT+DELETE /api/calendar-events/subscriptions`.
  - **`module.json`** — nav entries for "Calendar" (public, no permission gate) and "Manage Events" (`calendar_events.create` gated); permission resource `calendar_events` with full CRUD actions; `CALENDAR_REMINDER_INTERVAL_MS` env var.
  - **Post-install steps** (cannot be automated): register `calendarEventsPlugin` in `api/src/server.ts` with prefix `/calendar-events`; add `/calendar-events` to `CUSTOMER_ALLOWED_PATHS` in `hooks.server.ts`; optionally add `calendar_event.new` and `calendar_event.reminder` to `KNOWN_TYPES` in the notification preferences page.

---

## 2026-03-16 (notifications)

### Added
- `CORE` **Real-time notification system** — WebSocket-push notifications with persistent storage, unread badge, and per-user preferences.
  - **`notifications` collection** — stores per-user notification documents with `type`, `title`, `body`, `link`, `read`, `createdAt`, `source`, `groupKey`, and `delivered` fields. 90-day TTL index auto-expires old records. Four additional indexes for common query patterns.
  - **`notification_preferences` collection** — per-user document (created lazily) with `channels` (websocket/email toggles), `muted` type list, and `quiet` hours config (start/end/timezone). Unique index on `userId`.
  - **`dispatch()` function** (`api/src/lib/notifications/dispatch.ts`) — internal delivery engine registered as `app.notify()` decorator. Accepts single or batch `userId`, checks mute preferences and quiet hours before persisting, then pushes immediately to any active WebSocket connections and updates `delivered.websocket`. Other modules call `app.notify()` without importing any notifications internals; guard with `app.hasDecorator('notify')` when the module may not be installed.
  - **Grouping** (`api/src/lib/notifications/grouping.ts`) — `groupKey` deduplication: if an unread notification with the same `groupKey` already exists for the user, its `title`/`body`/`createdAt` are updated in place rather than inserting a new document. Prevents flooding from high-frequency events (e.g. chat threads).
  - **`@fastify/websocket` registered** in `api/src/server.ts`; `wsConnections` Map (`Map<string, Set<WebSocket>>`) decorated onto the Fastify instance at root level for use by any module.
  - **REST API** (`api/src/routes/notifications/index.ts`):
    - `GET /notifications` — paginated list with `filter=all|unread` and `page` params
    - `GET /notifications/unread-count` — badge count
    - `GET /notifications/recent` — last 10 for the bell dropdown
    - `PUT /notifications/:id/read` — mark single read, returns updated count
    - `PUT /notifications/read-all` — mark all read
    - `GET /notifications/preferences` — get or lazily-create preferences
    - `PUT /notifications/preferences` — update channels, muted types, quiet hours
    - `GET /notifications/ws` — WebSocket upgrade endpoint
  - **WebSocket protocol** — server pushes `init` (unread count on connect), `notification` (new delivery), `count-update` (after any read operation), `read-confirmed`. Client sends `mark-read`, `mark-all-read`, `sync` (with `since` timestamp for missed notifications).
  - **`notifications.svelte.ts` store** (`frontend/src/lib/stores/`) — module-level `$state`; manages WebSocket lifecycle with exponential-backoff reconnection (1s → 2s → 4s → 8s, cap 30s). On reconnect sends `sync` with last known timestamp. Deduplicates incoming notifications by `_id`. Exports `connect()`, `disconnect()`, `markRead()`, `markAllRead()`, `getUnreadCount()`, `getNotifications()`.
  - **`NotificationBell.svelte`** — bell icon with red unread badge in the header (between Messages and user avatar). Opens a `SkMenu` dropdown showing the 10 most recent notifications, with mark-all-read and "View all" links. Fetches `/api/notifications/recent` on dropdown open.
  - **`NotificationItem.svelte`** — notification row with type-mapped icon (`Mail`, `ShieldCheck`, `Users`, `ShoppingCart`, `Package`, `Bell`), unread dot, title, optional body, and relative timestamp ("2m ago").
  - **`+layout.svelte`** — imports `NotificationBell` and renders it in the header; `$effect` calls `connect()` when `data.user` is set and returns `disconnect()` as cleanup.
  - **`/notifications` page** — full list with All/Unread filter tabs, load-more pagination, mark-all-read. Clicking an item marks it read and navigates to `link`.
  - **`/notifications/settings` page** — delivery channel toggles (push always-on, email opt-in), per-type mute checkboxes grouped by source (Messages, Account, Storefront), quiet hours window with time pickers and timezone select. Saved via SvelteKit form action.
  - **SvelteKit proxy** (`frontend/src/routes/api/notifications/[...path]`) — catch-all GET/PUT proxy forwarding session cookie; WS connects directly to the API at port 4000.
  - **`header-widgets.ts`** config (`frontend/src/lib/config/`) — empty typed array for future module-injectable header components (`position: 'before-avatar' | 'after-avatar'`), following the `dashboard-widgets.ts` pattern.
  - **Notifications nav entry** added to `nav.ts` (Bell icon, `/notifications`).
  - `@fastify/websocket: ^9.0.0` added to API dependencies.
  - Applied to both `example/` and `projects/potency/`.

---

## 2026-03-16 (user management)

### Changed
- `CORE` **Consolidated User Management page** — `/manage-users` and `/roles` merged into a single tabbed `/user-management` route. Server load requires `users.read` OR `roles.read` (redirects to `/403` if neither); each tab renders only when the user holds the relevant permission.
  - **Users tab** — full CRUD table (search, pagination, create/edit/delete modals) preserved from the old `/manage-users` page.
  - **Roles tab** — accordion permission matrix and User Assignments table preserved from the old `/roles` page. Role changes in the Assignments table now also update the Users tab's local state reactively.
  - User menu dropdown consolidates "Manage Users" and "Roles" into a single **User Management** entry; `ShieldCheck` import removed from layout.
  - Old `/manage-users` and `/roles` routes removed from both `example/` and `projects/potency/`.

### Added
- `CORE` **Collapsible nav groups** — `nav.ts` now exports a `NavGroup` type alongside `NavItem`; the sidebar renders group entries as collapsible accordions with CSS grid `grid-template-rows` animation. Active group auto-expands on load via `$effect`. `NavEntry` union type and `isNavGroup()` type guard exported for layout consumption.

---

## 2026-03-16

### Added
- `CORE` **Dynamic app name and logo** — `Application Name` from Settings now updates the header and browser title in real time. Admin can upload a custom logo image to replace the default SVG icon.
  - `app.logo` setting added to seed (string, default empty — falls back to SVG icon).
  - `POST /settings/logo` API endpoint — multipart upload, writes to `uploads/logo/`, updates `app.logo` setting, logs audit event.
  - `+layout.server.ts` fetches `app.name` and `app.logo` on every authenticated load alongside the existing `chat.enabled` fetch.
  - `Logo.svelte` refactored to accept `name` and `logo` props; renders `<img>` when a URL is set, `<LogoIcon>` SVG otherwise.
  - `frontend/src/routes/uploads/[...path]` proxy — forwards all `/uploads/...` requests from the browser to the API (also fixes product image display).
  - `frontend/src/routes/api/settings/logo` proxy — multipart passthrough with `duplex: 'half'`.
  - Settings page gains a logo upload card with preview, Upload, and Remove actions.

- `MODULE: commerce` **Commerce admin UI** — full admin frontend for the commerce module.
  - **Products** (`/commerce/products`) — searchable/filterable list with status and category filters, pagination (25/page), quick-create modal (redirects to detail page on create), archive confirmation modal.
  - **Product detail** (`/commerce/products/[id]`) — full edit page: Basic Info, Images (upload/remove), Variant Options (axis builder + cartesian generator), Variants grid (inline stock ±1 with API PATCH, editable SKU/price/threshold), Discounts (percentage/fixed/quantity-tier entries with date ranges), single Save PATCH.
  - **Orders** (`/commerce/orders`) — list with order number, customer, status badge, total, date; search + status filter; pagination.
  - **Order detail** (`/commerce/orders/[id]`) — status update dropdown + notes field, line items table, discount and totals summary.
  - **Categories** (`/commerce/categories`) — list with create/edit/delete modals; delete guarded server-side if active products reference the category.
  - **Inventory** (`/commerce/inventory`) — read-only low-stock report; variants at or below threshold shown per product; color-coded (red = 0, orange = ≤ threshold).
  - All pages permission-gated (`commerce_products`, `commerce_orders`, `commerce_categories`).
  - Nav updated to 4 entries: Products, Orders, Categories, Inventory.
  - All SvelteKit API proxy routes created for the full commerce API surface.
  - Applied to both `projects/potency/frontend/` and `modules/commerce/frontend/`.

---

## 2026-03-15

### Added
- `MODULE: commerce` **Commerce backend** — products, categories, orders, and inventory API with local/S3 image storage.
  - **Products** — full CRUD with slug generation, text search index, image upload (local or S3 via `STORAGE_PROVIDER` env), variant option axes, cartesian variant grid with per-SKU price override and stock, embedded discounts (percentage/fixed/quantity-tier with date ranges and active toggle). Soft delete (`status: archived`).
  - **Atomic stock adjustment** — `PATCH /commerce/products/:id/variants/:sku/stock` with `arrayFilters` + `$inc`; conditional filter prevents negative stock.
  - **Categories** — CRUD with slug uniqueness, delete guarded by active product count.
  - **Orders** — list + detail, atomic order number via `counters` collection (`ORD-YYYY-NNNNNN`), status update with audit log (captures previous status via `returnDocument: 'before'`).
  - **Inventory** — `GET /commerce/inventory` returns active products with at least one variant at or below `lowStockThreshold` (default 5).
  - **Storage abstraction** — `example/api/src/lib/storage.ts`; `LocalStorage` writes to `uploads/products/`, `S3Storage` lazy-imports `@aws-sdk/client-s3`. Selected by `STORAGE_PROVIDER=local|s3`.
  - **`example/api/src/lib/slug.ts`** — `toSlug()` helper.
  - **`example/api/src/lib/orderNumber.ts`** — atomic counter helper.
  - **3 permission resources** — `commerce_products`, `commerce_orders`, `commerce_categories` (replaces single `commerce` stub). Admin gets full CRUD; viewer gets read.
  - MongoDB indexes: unique slug on products and categories, text index on products, unique orderNumber on orders, status/category/userId indexes.
  - `@fastify/multipart`, `@fastify/static`, `nanoid` added to API dependencies.
  - `uploads` Docker named volume added to `docker-compose.yml`.
  - Applied to `projects/potency/api/` and `modules/commerce/api/`.

- `CORE` **Build-time module system** — features composed into projects via `arch.js` at build time; no runtime plugin layer.
  - `node arch.js create <name> [--modules a,b] [--no-install]` — copies scaffold, merges modules, runs `npm install`.
  - `node arch.js list` / `node arch.js info <module>` — module discovery commands.
  - Five automated merge points: routes (autoload), nav (deduped icon imports), permissions (JSON merge), package deps (semver warn on conflict), env vars (append if absent).
  - Collision safety — validates all source trees before writing any files.
  - `modules/notifications/` stub module validates the full pipeline.
  - Scaffold changes: `@fastify/autoload` replaces 8 manual route registrations; `frontend/src/lib/config/nav.ts` extracted for nav merging; `api/src/data/permissions.json` extracted from `seed.ts`.

- `CORE` **Settings page** — key/value configuration store backed by a `settings` MongoDB collection.
  - `GET /settings`, `PATCH /settings/:key`, `GET /settings/:key` (auth-only) API endpoints.
  - Default settings: `app.name`, `app.registration_open`, `theme.mode`, `chat.enabled`.
  - Seed uses `$setOnInsert` on `value` — user edits survive restarts.
  - Frontend inline row editing: checkbox (boolean), select, or text/number input by type.
  - `setting.update` audit log event.
  - `settings` permission: admin gets read + update; viewer gets none.

- `CORE` **Audit log** — `audit_logs` collection recording privileged and auth events.
  - `logAudit()` fire-and-forget helper in `api/src/lib/audit.ts`.
  - `GET /audit` endpoint (admin-only) with `limit`/`skip` pagination.
  - 14 instrumented events: auth register/login/logout/profile/password reset, user CRUD + role change, role CRUD, message send/reply, setting update.
  - Three indexes: `createdAt`, `userId+createdAt`, `action+createdAt`.

- `CORE` **API self-documentation** — `@fastify/swagger` generates OpenAPI 3.0 spec from existing route schemas (dev only).
  - `GET /docs/yaml` and `GET /docs/json`.
  - Route summaries added to all 26 routes.

- `CORE` **Password reset flow** — forgot-password → email token → reset-password.
  - SHA-256 hashed token stored (never raw), 1-hour expiry, single-use.
  - Nodemailer transport (`api/src/lib/email.ts`) — SMTP when configured, Ethereal catch-all in dev.
  - `/forgot-password` and `/reset-password` frontend pages.
  - SMTP env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_URL`.

---

## 2026-03-14

### Added
- `CORE` **In-app messaging system** — full email-style messaging between authenticated users.
  - Thread-based model; per-user `message_state` tracks read/archived/deleted independently.
  - 7 API routes: inbox, unread count, sent, archived, thread detail (auto-marks read), compose, reply, state PATCH.
  - 7 SvelteKit proxy routes mirroring the API surface.
  - `MessageEditor` (Tiptap rich-text) and `MessageListItem` components.
  - Two-panel messages layout: 288 px sidebar + scrollable content.
  - Inbox, compose, thread detail, and sent/archive pages.
  - Unread badge on Mail icon in header; re-fetched on every route change.
  - Tiptap packages: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`, `svelte-tiptap@3.0.1`.
  - MongoDB indexes on `messages` and `message_state`.

---

## 2026-03-13

### Added
- `CORE` **Create user from admin** — "New User" modal on Manage Users page (permission-gated). `POST /users` API endpoint creates user with bcrypt password hash, assigns `viewer` role.

### Removed
- `CORE` **Public registration page** — `/register` route removed; all entry points now point to `/login`. `AUTH_REDIRECT_PATHS` updated.

### Fixed
- `CORE` Dashboard welcome message uses `firstName` when available, falls back to `username`.
- `CORE` Dashboard currency formatter renamed from `$c` to `fmt` (Svelte 5 reserved `$` prefix).
