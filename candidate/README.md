# Architectonic

A full-stack SvelteKit + Fastify scaffold with authentication, RBAC, in-app messaging, avatar management, and a sidebar UI — ready to clone and extend.

## Quick Start

```bash
cp .env.example .env
# Set SESSION_SECRET and MONGO_URL in .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

The app runs at **http://localhost:3000**. Seed accounts are created on first boot.

## What Ships

- **Auth** — Login, registration, password reset; bcrypt hashing; HTTP-only session cookies; dark-themed `AuthShell` wrapping all auth pages; `(public)/` SvelteKit route group; `GET /auth/config` exposes `registrationOpen`
- **Avatar** — Photo upload with canvas crop/zoom (`AvatarCropper`); `Avatar` component (initials fallback, photo, colour picker); `POST/DELETE /auth/avatar`
- **RBAC** — 6 seeded roles (owner, admin, lead, contributor, viewer, customer); `requirePermission` Fastify preHandler; `hasPermission()` frontend helper; Manage Users + Roles pages
- **Messaging** — Email-style in-app threads; inbox, sent, archive, unread badge; Tiptap rich-text editor
- **Notifications** — Real-time WebSocket push; unread bell with dropdown; per-user channel preferences and quiet hours
- **Dashboard** — Placeholder with pure-SVG charts; deterministic seeded data via `makeRng(seed)`
- **Chat assistant** — Ollama-backed fixed bottom-right panel; `OLLAMA_URL=http://host.docker.internal:11434`
- **Settings** — Admin key/value store (MongoDB); `registration_open`, `app.name` seeded with `$setOnInsert`
- **Layout** — Collapsible sidebar; animated accordion nav groups; `Avatar` in profile footer; mobile hamburger overlay

## Changing the DaisyUI Theme

All theme configuration lives in **two files**:

### 1. `frontend/src/app.css` — which themes are available

```css
@plugin "daisyui" {
  themes: business;
}
```

Replace `business` with any [DaisyUI theme](https://daisyui.com/docs/themes/).

### 2. `frontend/src/lib/config/theme.ts` — the active theme

```ts
export const APP_THEME = 'business';
```

Change `'business'` to match your chosen theme name. This is applied as the `data-theme` attribute on the app shell.

### Example: switch to `corporate`

**`app.css`:**
```css
@plugin "daisyui" {
  themes: corporate;
}
```

**`theme.ts`:**
```ts
export const APP_THEME = 'corporate';
```

Rebuild after changing either file:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build web
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d web
```

### Custom themes

DaisyUI v4 supports custom themes defined directly in CSS:

```css
@plugin "daisyui" {
  themes: my-theme;
}

[data-theme="my-theme"] {
  --color-primary: oklch(55% 0.2 250);
  --color-base-100: oklch(98% 0 0);
  /* ... */
}
```

See the [DaisyUI theme generator](https://daisyui.com/theme-generator/) to build a custom palette.
