# Architectonic

A full-stack SvelteKit + Fastify scaffold with authentication, RBAC, session management, MongoDB, and DaisyUI.

## Swapping DaisyUI Themes

All theme configuration lives in **two files**:

### 1. `frontend/src/app.css` — which themes are available

```css
@plugin "daisyui" {
  themes: lofi --default, dim;
}
```

Replace `lofi` and `dim` with any [DaisyUI themes](https://daisyui.com/docs/themes/). The `--default` flag marks the light theme. Add as many themes as you want.

### 2. `frontend/src/lib/config/theme.ts` — the active light/dark pair

```ts
export const THEME = { LIGHT: 'lofi', DARK: 'dim' } as const;
```

Change `LIGHT` and `DARK` to match your chosen theme names. This drives the theme toggle button and `localStorage` persistence.

### Example: switch to `corporate` (light) + `night` (dark)

**`app.css`:**
```css
@plugin "daisyui" {
  themes: corporate --default, night;
}
```

**`theme.ts`:**
```ts
export const THEME = { LIGHT: 'corporate', DARK: 'night' } as const;
```

Rebuild the frontend container after changing either file:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build web
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d web
```

### Using a single theme (no dark mode)

Set both `LIGHT` and `DARK` to the same theme name and the toggle will have no visible effect.

### Custom themes

DaisyUI v5 supports custom themes defined directly in CSS:

```css
@plugin "daisyui" {
  themes: my-theme --default;
}

[data-theme="my-theme"] {
  --color-primary: oklch(55% 0.2 250);
  --color-base-100: oklch(98% 0 0);
  /* ... */
}
```

See the [DaisyUI theme generator](https://daisyui.com/theme-generator/) to build a custom palette.
