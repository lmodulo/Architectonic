import type { RouteRule } from '$lib/config/route-rules';

// Client portal page: signed-in customers may open it (the API shows only their company's
// milestones). Not public, so logged-out visitors still go to /login.
export default [{ prefix: '/client-portal/projects', customer: true }] satisfies RouteRule[];
