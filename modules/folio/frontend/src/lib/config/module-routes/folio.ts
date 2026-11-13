import type { RouteRule } from '$lib/config/route-rules';

// Client portal pages: signed-in customers may open them (the API scopes data to the caller).
// Not public, so logged-out visitors still go to /login. '/client-portal/invoices' covers /[id].
export default [
  { prefix: '/client-portal/invoices',  customer: true },
  { prefix: '/client-portal/estimates', customer: true },
] satisfies RouteRule[];
