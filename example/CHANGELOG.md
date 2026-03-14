# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

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
