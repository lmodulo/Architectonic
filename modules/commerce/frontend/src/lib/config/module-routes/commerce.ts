import type { RouteRule } from '$lib/config/route-rules';

// The storefront is public (no sign-in needed, customers included) and renders with its own
// StorefrontNav instead of the app shell, even for signed-in staff.
export default [{ prefix: '/shop', public: true, bare: true }] satisfies RouteRule[];
