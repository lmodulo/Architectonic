# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

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
