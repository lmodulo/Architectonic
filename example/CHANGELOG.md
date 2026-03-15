# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

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
