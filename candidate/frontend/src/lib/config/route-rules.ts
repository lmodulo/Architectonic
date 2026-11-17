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
//     { routeId: '/(site)/[...path]', public: true },       // a catch-all whose URLs aren't known up front
//     { routeId: '/', theme: 'acme' },                      // always this theme, whatever Settings → Theme says
//   ] satisfies RouteRule[];

export interface RouteRule {
  /** Path prefix, e.g. '/shop' matches '/shop' and '/shop/anything' (but not '/shopping'). */
  prefix?: string;
  /**
   * SvelteKit route id, matched exactly, e.g. '/(site)/[...path=cmspath]' or '/'. Use it for routes
   * whose URLs aren't known up front, such as a catch-all. When a rule sets both `prefix` and
   * `routeId`, both must match. A rule with neither matches nothing.
   */
  routeId?: string;
  /** Reachable without signing in, and by customers. */
  public?: boolean;
  /** Signed-in customers may visit (staff always can). Not public: logged-out visitors go to /login. */
  customer?: boolean;
  /** Rendered without the app shell (sidebar/header), even for signed-in users. */
  bare?: boolean;
  /**
   * DaisyUI theme these pages always render in, instead of the runtime theme from Settings → Theme
   * (which keeps styling everything else), e.g. a public website with its own brand. The theme's
   * `[data-theme='…']` variables must be in CSS those pages load. The first matching rule wins.
   */
  theme?: string;
}

// Scaffold's own rules: the documentation site is public and has its own shell.
export const CORE_ROUTE_RULES: RouteRule[] = [
  { prefix: '/documentation', public: true, bare: true },
];

const files = import.meta.glob<{ default: RouteRule[] }>('./module-routes/*.ts', { eager: true });
export const MODULE_ROUTE_RULES: RouteRule[] = [...CORE_ROUTE_RULES, ...Object.values(files).flatMap(f => f.default)];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');

/**
 * True when the rule covers this request. `routeId` is the SvelteKit route id (`event.route.id` on
 * the server, `page.route.id` in components); it is null for unmatched URLs, and a rule with a
 * `routeId` never applies when the caller passes none.
 */
export function applies(rule: RouteRule, path: string, routeId?: string | null): boolean {
  if (rule.prefix === undefined && rule.routeId === undefined) return false;
  if (rule.prefix !== undefined && !matches(path, rule.prefix)) return false;
  if (rule.routeId !== undefined && rule.routeId !== routeId) return false;
  return true;
}

export function isPublicRoute(path: string, routeId?: string | null): boolean {
  return MODULE_ROUTE_RULES.some(r => r.public && applies(r, path, routeId));
}

/** True when a signed-in customer may visit the path: rules marked `customer` or `public`. */
export function isCustomerRoute(path: string, routeId?: string | null): boolean {
  return MODULE_ROUTE_RULES.some(r => (r.customer || r.public) && applies(r, path, routeId));
}

export function isBareRoute(path: string, routeId?: string | null): boolean {
  return MODULE_ROUTE_RULES.some(r => r.bare && applies(r, path, routeId));
}

/** The theme a rule pins for this page, or null to use the runtime theme (Settings → Theme). */
export function routeTheme(path: string, routeId?: string | null): string | null {
  return MODULE_ROUTE_RULES.find(r => r.theme && applies(r, path, routeId))?.theme ?? null;
}
