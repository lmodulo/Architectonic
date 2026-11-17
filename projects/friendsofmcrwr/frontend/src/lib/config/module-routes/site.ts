// friendsofmcrwr's public website always renders in its brand theme ('mcrwr', defined in
// $lib/components/mcrwr/theme.css). Settings → Theme keeps choosing the staff app's theme.
import type { RouteRule } from '$lib/config/route-rules';

export default [
  { routeId: '/', theme: 'mcrwr' },                          // the landing page
  { routeId: '/(site)/[...path=cmspath]', theme: 'mcrwr' },  // CMS pages and their 404s
  { prefix: '/cms/preview', theme: 'mcrwr' },                // editors' draft previews
] satisfies RouteRule[];
