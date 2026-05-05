# Module Integration Guide

This document describes the convention for adding optional feature modules to Architectonic without modifying core files.

---

## Concept

A module is a self-contained folder under `modules/` that declares its own API routes, frontend pages, nav items, and permissions. Enabling a module is a one-line uncomment in two registry files plus a container restart.

---

## Module Directory Layout

```
modules/
  shop/
    module.manifest.ts        ← declares nav items, permissions, API prefix
    api/
      index.ts                ← barrel: exports a Fastify plugin
      products.ts             ← route handlers (same pattern as api/src/routes/)
      orders.ts
    frontend/
      components/
        ProductCard.svelte
      stores/
        cart.svelte.ts
```

> **Pages** live in `frontend/src/routes/[module]/` by SvelteKit convention — no symlinks or magic needed.

---

## Module Manifest

```ts
// modules/shop/module.manifest.ts
import type { ModuleManifest } from '$lib/config/modules';

export default {
  id: 'shop',
  apiPrefix: '/shop',
  permissions: {
    // Resource added to all seeded roles (admin gets full access, viewer gets read)
    shop: { create: true, read: true, update: true, delete: true }
  },
  navItems: [
    {
      label:      'Shop',
      href:       '/shop',
      permission: { resource: 'shop', action: 'read' }
    },
    {
      label:      'Shop Admin',
      href:       '/shop/admin',
      permission: { resource: 'shop', action: 'update' }
    },
  ]
} satisfies ModuleManifest;
```

---

## Registries

### Frontend — `frontend/src/lib/config/modules.ts`

```ts
import type { Action } from '$lib/permissions';

export interface NavItem {
  label:      string;
  href:       string;
  permission: { resource: string; action: Action };
}

export interface ModuleManifest {
  id:          string;
  apiPrefix:   string;
  permissions: Record<string, Record<Action, boolean>>;
  navItems:    NavItem[];
}

// ── Enable modules here ──────────────────────────────────────────
// import shopModule from '../../../../modules/shop/module.manifest';

export const enabledModules: ModuleManifest[] = [
  // shopModule,
];
```

### API — `api/src/modules.ts`

```ts
import type { FastifyPluginAsync } from 'fastify';

// import shopRoutes from '../../modules/shop/api/index.js';

export const moduleRoutes: { routes: FastifyPluginAsync; prefix: string }[] = [
  // { routes: shopRoutes, prefix: '/shop' },
];
```

---

## Core Wiring (one-time setup)

These changes are made once to the core files and never need to change again as new modules are added.

### `api/src/server.ts`
```ts
import { moduleRoutes } from './modules.js';

// After the built-in routes:
for (const m of moduleRoutes) {
  await app.register(m.routes, { prefix: m.prefix });
}
```

### `api/src/plugins/seed.ts`
```ts
import { moduleRoutes } from '../modules.js';

// Before upserting roles, merge module permissions into ADMIN_PERMS:
for (const m of enabledModules) {
  Object.assign(ADMIN_PERMS, m.permissions);
  // Viewer gets read-only on each module resource by default
  for (const resource of Object.keys(m.permissions)) {
    VIEWER_PERMS[resource] = { create: false, read: true, update: false, delete: false };
  }
}
```

### `frontend/src/routes/+layout.svelte`
```svelte
<script>
  import { enabledModules } from '$lib/config/modules';
</script>

<!-- After core nav items, inside the authenticated nav: -->
{#each enabledModules as mod}
  {#each mod.navItems as item}
    {#if hasPermission(data.user, item.permission.resource, item.permission.action)}
      <SkMenu.Item href={item.href}>{item.label}</SkMenu.Item>
    {/if}
  {/each}
{/each}
```

### `frontend/src/hooks.server.ts`
```ts
import { enabledModules } from '$lib/config/modules';

const modulePerms = Object.fromEntries(
  enabledModules.flatMap(m =>
    m.navItems.map(n => [n.href, n.permission])
  )
);

const ROUTE_PERMISSIONS: Record<string, { resource: string; action: Action }> = {
  '/manage-users': { resource: 'users', action: 'read' },
  '/roles':        { resource: 'roles', action: 'read' },
  ...modulePerms,
};
```

---

## Adding a New Module

1. Create `modules/[name]/` with `module.manifest.ts` and API route files
2. Add frontend pages to `frontend/src/routes/[name]/`
3. Uncomment the import + entry in `frontend/src/lib/config/modules.ts`
4. Uncomment the import + entry in `api/src/modules.ts`
5. Restart both containers:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml restart web api
   ```

The nav item appears automatically, the route guard is applied, and the API routes are live.

---

## Disabling a Module

Comment out the module entry in both registry files and restart. No database migrations, no file deletions.
