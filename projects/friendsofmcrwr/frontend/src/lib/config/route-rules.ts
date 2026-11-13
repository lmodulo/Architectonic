// Route rules that modules can declare without editing scaffold files.
//
// A module adds a file at  src/lib/config/module-routes/<module>.ts  that default-exports
// RouteRule[]. Every such file is picked up automatically, by hooks.server.ts (public and
// customer access) and by the root +layout.svelte (bare pages):
//
//   import type { RouteRule } from '$lib/config/route-rules';
//   export default [
//     { prefix: '/shop', public: true, bare: true },        // storefront, open to everyone
//     { prefix: '/client-portal/orders', customer: true },  // signed-in customers' own page
//   ] satisfies RouteRule[];

export interface RouteRule {
  /** Path prefix, e.g. '/shop' matches '/shop' and '/shop/anything' (but not '/shopping'). */
  prefix: string;
  /** Reachable without signing in, and by customers. */
  public?: boolean;
  /** Signed-in customers may visit (staff always can). Not public: logged-out visitors go to /login. */
  customer?: boolean;
  /** Rendered without the app shell (sidebar/header), even for signed-in users. */
  bare?: boolean;
}

// Scaffold's own rules: the documentation site is public and has its own shell.
export const CORE_ROUTE_RULES: RouteRule[] = [
  { prefix: '/documentation', public: true, bare: true },
];

const files = import.meta.glob<{ default: RouteRule[] }>('./module-routes/*.ts', { eager: true });
export const MODULE_ROUTE_RULES: RouteRule[] = [...CORE_ROUTE_RULES, ...Object.values(files).flatMap(f => f.default)];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');

export function isPublicRoute(path: string): boolean {
  return MODULE_ROUTE_RULES.some(r => r.public && matches(path, r.prefix));
}

/** True when a signed-in customer may visit the path: rules marked `customer` or `public`. */
export function isCustomerRoute(path: string): boolean {
  return MODULE_ROUTE_RULES.some(r => (r.customer || r.public) && matches(path, r.prefix));
}

export function isBareRoute(path: string): boolean {
  return MODULE_ROUTE_RULES.some(r => r.bare && matches(path, r.prefix));
}
