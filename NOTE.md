
# TERMINAL
rebuild restart frontend
docker compose build web; docker compose up -d web

rebuild restart API
docker compose -f docker-compose.yml -f docker-compose.dev.yml build api
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api

cd "c:\Application Framework\projects\potency"
.\start.ps1

# PROMPT
session end
update the CLAUDE.md file with necessary context.

# TODO
[] CMS. multipart page creation. default templates + custom. drag n drop UI for generating multipart content, snap to grid
[] CRM lead tracking and conversion
[] Shopping cart
[] Stripe integration
[] Square integration
[] Shipping matrix calculations
[] print labels from oder detail page

# THEME SWAP
Skeleton Built-in Theme
Skeleton ships themes like cerberus, vintage, rose, seafoam, etc.

1. frontend/src/app.html — change data-theme:


<html lang="en" data-theme="cerberus">
2. frontend/src/app.css — swap the import:


@import "@skeletonlabs/skeleton/themes/cerberus";
@import "@skeletonlabs/skeleton";
That's it. No custom theme file needed.

Custom Theme (lmodulo pattern)
A custom theme overrides the CSS variables for a named data-theme value.

1. frontend/lmodulo-theme.css — the theme file lives in the frontend root. The selector must match the data-theme value you choose:


[data-theme='mytheme'] {
  --base-font-family: ...;
  --color-primary-500: oklch(...);
  /* etc */
}
2. frontend/src/app.html — set the matching theme name:


<html lang="en" data-theme="mytheme">
3. frontend/src/app.css — two options:

Option A — custom only (what potency does — no built-in base):


@import "tailwindcss";
@layer theme { .dark { color-scheme: dark; } }
@import "../lmodulo-theme.css";
@import "@skeletonlabs/skeleton";
Option B — built-in base + custom overrides (what architectonic does — inherits a built-in, then patches variables):


@import "@skeletonlabs/skeleton/themes/vintage";
@import "../lmodulo-theme.css";   /* overrides on top */
@import "@skeletonlabs/skeleton";
Option B is useful when your custom theme only changes a few variables and you want to inherit the rest from a built-in.

To generate a custom theme
Use the Skeleton theme generator — it outputs the full CSS variable block ready to paste into lmodulo-theme.css.

After any theme change
Rebuild the web container — the theme CSS is processed at build time by Tailwind v4:


docker compose -f docker-compose.yml -f docker-compose.dev.yml build web
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d web
(The vite.config.ts has a themeHotReload() plugin that watches lmodulo-theme.css in dev, but on Windows inside Docker the FS events don't fire reliably, so a rebuild is always the safe path.)

# NEW PROJECT
Create module `commerce` in `modules/commerce/` with these files:

**module.json** — nav label "Commerce", href "/commerce", icon `store` from lucide-svelte, permission "commerce.read". Permissions: resource "commerce", actions create/read/update/delete. No extra dependencies or env vars.

**API route** — `api/src/routes/commerce/index.ts`. Single GET `/` endpoint, requirePermission('commerce', 'read'), returns `{ items: [] }`.

**Frontend proxy** — `frontend/src/routes/api/commerce/+server.ts`. Proxy GET to `${API_URL}/commerce`.

**Page server** — `frontend/src/routes/commerce/+page.server.ts`. Load from `/api/commerce`, return `{ items }`.

**Page** — `frontend/src/routes/commerce/+page.svelte`. Page heading "Commerce", empty state text "Commerce." Follow existing page conventions from the scaffold (shell, header layout).

Then run: `node arch.js create potency --modules commerce`

Verify the built project at `projects/potency/` has the nav entry, permissions seed, and route files in place.

---

That's the full prompt. It separates module authoring from project creation so each step is independently verifiable. If you wanted to skip having Claude write the module and instead just test the build tool with an already-written module, the prompt shortens to just the `node arch.js create` line and the verification step.


# Theme
[data-theme='lmodulo'] {
	--text-scaling: 1.067;
	--base-font-color: var(--color-surface-950);
	--base-font-color-dark: var(--color-surface-50);
	--base-font-family: Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif;
	--base-font-size: 18px;
	--base-line-height: 28px;
	--base-font-weight: normal;
	--base-font-style: normal;
	--base-letter-spacing: 0em;
	--heading-font-color: inherit;
	--heading-font-color-dark: inherit;
	--heading-font-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif;
	--heading-font-weight: bolder;
	--heading-font-style: normal;
	--heading-letter-spacing: inherit;
	--anchor-font-color: var(--color-primary-600);
	--anchor-font-color-dark: var(--color-primary-500);
	--anchor-font-family: inherit;
	--anchor-font-size: inherit;
	--anchor-line-height: inherit;
	--anchor-font-weight: inherit;
	--anchor-font-style: inherit;
	--anchor-letter-spacing: inherit;
	--anchor-text-decoration: none;
	--anchor-text-decoration-hover: underline;
	--anchor-text-decoration-active: none;
	--anchor-text-decoration-focus: none;
	--spacing: 0.25rem;
	--radius-base: 0.25rem;
	--radius-container: 0.25rem;
	--default-border-width: 1px;
	--default-divide-width: 1px;
	--default-ring-width: 1px;
	--body-background-color: var(--color-surface-50);
	--body-background-color-dark: var(--color-surface-950);
	--color-primary-50: oklch(92.8% 0.06 138.06deg);
	--color-primary-100: oklch(85.51% 0.06 138.65deg);
	--color-primary-200: oklch(77.81% 0.06 138.49deg);
	--color-primary-300: oklch(70.24% 0.06 138.32deg);
	--color-primary-400: oklch(62.14% 0.06 138.15deg);
	--color-primary-500: oklch(54.06% 0.06 138.8deg);
	--color-primary-600: oklch(47.29% 0.06 139.1deg);
	--color-primary-700: oklch(40.2% 0.06 140.34deg);
	--color-primary-800: oklch(32.62% 0.05 141.5deg);
	--color-primary-900: oklch(24.81% 0.05 143.01deg);
	--color-primary-950: oklch(16.18% 0.06 142.5deg);
	--color-primary-contrast-dark: var(--color-primary-950);
	--color-primary-contrast-light: var(--color-primary-50);
	--color-primary-contrast-50: var(--color-primary-contrast-dark);
	--color-primary-contrast-100: var(--color-primary-contrast-dark);
	--color-primary-contrast-200: var(--color-primary-contrast-dark);
	--color-primary-contrast-300: var(--color-primary-contrast-dark);
	--color-primary-contrast-400: var(--color-primary-contrast-light);
	--color-primary-contrast-500: var(--color-primary-contrast-light);
	--color-primary-contrast-600: var(--color-primary-contrast-light);
	--color-primary-contrast-700: var(--color-primary-contrast-light);
	--color-primary-contrast-800: var(--color-primary-contrast-light);
	--color-primary-contrast-900: var(--color-primary-contrast-light);
	--color-primary-contrast-950: var(--color-primary-contrast-light);
	--color-secondary-50: oklch(94.96% 0.05 104.97deg);
	--color-secondary-100: oklch(87.61% 0.05 106.19deg);
	--color-secondary-200: oklch(79.96% 0.05 104.99deg);
	--color-secondary-300: oklch(72.27% 0.05 106.31deg);
	--color-secondary-400: oklch(64.22% 0.05 105.07deg);
	--color-secondary-500: oklch(56.08% 0.05 106.54deg);
	--color-secondary-600: oklch(49.19% 0.05 106.5deg);
	--color-secondary-700: oklch(41.81% 0.04 104.61deg);
	--color-secondary-800: oklch(34.37% 0.04 104.12deg);
	--color-secondary-900: oklch(26.2% 0.03 100.86deg);
	--color-secondary-950: oklch(17.58% 0.04 101.88deg);
	--color-secondary-contrast-dark: var(--color-secondary-950);
	--color-secondary-contrast-light: var(--color-secondary-50);
	--color-secondary-contrast-50: var(--color-secondary-contrast-dark);
	--color-secondary-contrast-100: var(--color-secondary-contrast-dark);
	--color-secondary-contrast-200: var(--color-secondary-contrast-dark);
	--color-secondary-contrast-300: var(--color-secondary-contrast-dark);
	--color-secondary-contrast-400: var(--color-secondary-contrast-light);
	--color-secondary-contrast-500: var(--color-secondary-contrast-light);
	--color-secondary-contrast-600: var(--color-secondary-contrast-light);
	--color-secondary-contrast-700: var(--color-secondary-contrast-light);
	--color-secondary-contrast-800: var(--color-secondary-contrast-light);
	--color-secondary-contrast-900: var(--color-secondary-contrast-light);
	--color-secondary-contrast-950: var(--color-secondary-contrast-light);
	--color-tertiary-50: oklch(92.37% 0.06 149.31deg);
	--color-tertiary-100: oklch(85.04% 0.06 149.21deg);
	--color-tertiary-200: oklch(77.44% 0.06 149.39deg);
	--color-tertiary-300: oklch(69.78% 0.06 149.23deg);
	--color-tertiary-400: oklch(61.77% 0.06 149.37deg);
	--color-tertiary-500: oklch(53.66% 0.06 149.08deg);
	--color-tertiary-600: oklch(46.93% 0.06 148.47deg);
	--color-tertiary-700: oklch(39.96% 0.06 147.73deg);
	--color-tertiary-800: oklch(32.46% 0.05 146.14deg);
	--color-tertiary-900: oklch(24.77% 0.05 144.89deg);
	--color-tertiary-950: oklch(16.18% 0.06 142.5deg);
	--color-tertiary-contrast-dark: var(--color-tertiary-950);
	--color-tertiary-contrast-light: var(--color-tertiary-50);
	--color-tertiary-contrast-50: var(--color-tertiary-contrast-dark);
	--color-tertiary-contrast-100: var(--color-tertiary-contrast-dark);
	--color-tertiary-contrast-200: var(--color-tertiary-contrast-dark);
	--color-tertiary-contrast-300: var(--color-tertiary-contrast-dark);
	--color-tertiary-contrast-400: var(--color-tertiary-contrast-dark);
	--color-tertiary-contrast-500: var(--color-tertiary-contrast-light);
	--color-tertiary-contrast-600: var(--color-tertiary-contrast-light);
	--color-tertiary-contrast-700: var(--color-tertiary-contrast-light);
	--color-tertiary-contrast-800: var(--color-tertiary-contrast-light);
	--color-tertiary-contrast-900: var(--color-tertiary-contrast-light);
	--color-tertiary-contrast-950: var(--color-tertiary-contrast-light);
	--color-success-50: oklch(96.13% 0.03 196.6deg);
	--color-success-100: oklch(89.16% 0.04 198.67deg);
	--color-success-200: oklch(82.03% 0.04 200.1deg);
	--color-success-300: oklch(75.02% 0.05 197.81deg);
	--color-success-400: oklch(67.65% 0.06 198.95deg);
	--color-success-500: oklch(60.21% 0.06 199.99deg);
	--color-success-600: oklch(53.37% 0.06 200.31deg);
	--color-success-700: oklch(46.07% 0.05 200.91deg);
	--color-success-800: oklch(38.74% 0.05 201.47deg);
	--color-success-900: oklch(30.8% 0.04 202.62deg);
	--color-success-950: oklch(22.58% 0.04 203.51deg);
	--color-success-contrast-dark: var(--color-success-950);
	--color-success-contrast-light: var(--color-success-50);
	--color-success-contrast-50: var(--color-success-contrast-dark);
	--color-success-contrast-100: var(--color-success-contrast-dark);
	--color-success-contrast-200: var(--color-success-contrast-dark);
	--color-success-contrast-300: var(--color-success-contrast-dark);
	--color-success-contrast-400: var(--color-success-contrast-dark);
	--color-success-contrast-500: var(--color-success-contrast-dark);
	--color-success-contrast-600: var(--color-success-contrast-light);
	--color-success-contrast-700: var(--color-success-contrast-light);
	--color-success-contrast-800: var(--color-success-contrast-light);
	--color-success-contrast-900: var(--color-success-contrast-light);
	--color-success-contrast-950: var(--color-success-contrast-light);
	--color-warning-50: oklch(99.02% 0.05 107.26deg);
	--color-warning-100: oklch(97.17% 0.08 106.9deg);
	--color-warning-200: oklch(95.37% 0.1 106.93deg);
	--color-warning-300: oklch(93.92% 0.12 107.05deg);
	--color-warning-400: oklch(92.23% 0.14 107.19deg);
	--color-warning-500: oklch(90.62% 0.16 107.27deg);
	--color-warning-600: oklch(82.89% 0.15 105.38deg);
	--color-warning-700: oklch(74.98% 0.14 103.08deg);
	--color-warning-800: oklch(66.88% 0.13 100.09deg);
	--color-warning-900: oklch(58.57% 0.11 96.14deg);
	--color-warning-950: oklch(50% 0.1 90.39deg);
	--color-warning-contrast-dark: var(--color-warning-950);
	--color-warning-contrast-light: var(--color-warning-50);
	--color-warning-contrast-50: var(--color-warning-contrast-dark);
	--color-warning-contrast-100: var(--color-warning-contrast-dark);
	--color-warning-contrast-200: var(--color-warning-contrast-dark);
	--color-warning-contrast-300: var(--color-warning-contrast-dark);
	--color-warning-contrast-400: var(--color-warning-contrast-dark);
	--color-warning-contrast-500: var(--color-warning-contrast-dark);
	--color-warning-contrast-600: var(--color-warning-contrast-dark);
	--color-warning-contrast-700: var(--color-warning-contrast-dark);
	--color-warning-contrast-800: var(--color-warning-contrast-light);
	--color-warning-contrast-900: var(--color-warning-contrast-light);
	--color-warning-contrast-950: var(--color-warning-contrast-light);
	--color-error-50: oklch(92.15% 0.04 17.94deg);
	--color-error-100: oklch(88.79% 0.06 17.06deg);
	--color-error-200: oklch(85.66% 0.08 18.81deg);
	--color-error-300: oklch(82.49% 0.1 18.61deg);
	--color-error-400: oklch(79.59% 0.12 20.01deg);
	--color-error-500: oklch(76.7% 0.14 20.25deg);
	--color-error-600: oklch(69.93% 0.13 22.17deg);
	--color-error-700: oklch(63.19% 0.13 24.3deg);
	--color-error-800: oklch(55.97% 0.12 26.75deg);
	--color-error-900: oklch(48.9% 0.11 29.49deg);
	--color-error-950: oklch(41.46% 0.11 32.39deg);
	--color-error-contrast-dark: var(--color-error-950);
	--color-error-contrast-light: var(--color-error-50);
	--color-error-contrast-50: var(--color-error-contrast-dark);
	--color-error-contrast-100: var(--color-error-contrast-dark);
	--color-error-contrast-200: var(--color-error-contrast-dark);
	--color-error-contrast-300: var(--color-error-contrast-dark);
	--color-error-contrast-400: var(--color-error-contrast-dark);
	--color-error-contrast-500: var(--color-error-contrast-dark);
	--color-error-contrast-600: var(--color-error-contrast-dark);
	--color-error-contrast-700: var(--color-error-contrast-light);
	--color-error-contrast-800: var(--color-error-contrast-light);
	--color-error-contrast-900: var(--color-error-contrast-light);
	--color-error-contrast-950: var(--color-error-contrast-light);
	--color-surface-50: oklch(97.61% 0 none);
	--color-surface-100: oklch(90.06% 0 none);
	--color-surface-200: oklch(82.34% 0 none);
	--color-surface-300: oklch(74.44% 0 none);
	--color-surface-400: oklch(66.33% 0 none);
	--color-surface-500: oklch(57.95% 0 none);
	--color-surface-600: oklch(49.62% 0 none);
	--color-surface-700: oklch(40.91% 0 none);
	--color-surface-800: oklch(32.11% 0 none);
	--color-surface-900: oklch(22.21% 0 none);
	--color-surface-950: oklch(9.69% 0 none);
	--color-surface-contrast-dark: var(--color-surface-950);
	--color-surface-contrast-light: var(--color-surface-50);
	--color-surface-contrast-50: var(--color-surface-contrast-dark);
	--color-surface-contrast-100: var(--color-surface-contrast-dark);
	--color-surface-contrast-200: var(--color-surface-contrast-dark);
	--color-surface-contrast-300: var(--color-surface-contrast-dark);
	--color-surface-contrast-400: var(--color-surface-contrast-dark);
	--color-surface-contrast-500: var(--color-surface-contrast-dark);
	--color-surface-contrast-600: var(--color-surface-contrast-light);
	--color-surface-contrast-700: var(--color-surface-contrast-light);
	--color-surface-contrast-800: var(--color-surface-contrast-light);
	--color-surface-contrast-900: var(--color-surface-contrast-light);
	--color-surface-contrast-950: var(--color-surface-contrast-light);
}