import type { RouteRule } from '$lib/config/route-rules';

// The public website: every CMS URL is public and renders in the site shell, not the app shell.
// `/` is bare too, so a published CMS home page renders as the site for signed-in users as well.
// Draft previews are staff-only (not public, not customer) but shell-free.
export default [
  { routeId: '/(site)/[...path=cmspath]', public: true, bare: true },
  { routeId: '/', bare: true },
  { prefix: '/cms/preview', bare: true },
] satisfies RouteRule[];
