// First URL segments this project's own routes use, so a top-level CMS page can't shadow them (or
// be shadowed by them: static routes always win over the CMS catch-all). The API has a fixed
// baseline list; this adds whatever the installed modules actually ship.
//
// Server only: the glob covers every route file, and a client bundle must never pull them in.
// The glob is lazy and its loaders are never called; only the file names are read.
const routeFiles = import.meta.glob(['/src/routes/**/+page.svelte', '/src/routes/**/+server.ts']);

function firstStaticSegment(file: string): string | null {
  const segments = file
    .replace(/^\/src\/routes\//, '')
    .split('/')
    .slice(0, -1)                                // drop the file name
    .filter(s => !/^\(.+\)$/.test(s));           // route groups don't appear in URLs
  const first = segments[0];
  return first && !first.includes('[') ? first : null;
}

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  '_app', 'api', 'uploads',
  ...Object.keys(routeFiles).map(firstStaticSegment).filter((s): s is string => s !== null),
]);

/**
 * The API's fixed baseline (api/src/routes/cms/nodes.ts RESERVED_SLUGS). The packages can't share
 * code, so keep the two lists in sync. The API refuses these even when the module isn't installed.
 * friendsofmcrwr has no 'shop': its storefront is a Content page, so that page may be /shop.
 */
const API_RESERVED_SLUGS = [
  'api', 'uploads', '_app', 'login', 'register', 'logout', 'forgot-password', 'reset-password',
  'accept-invite', 'dashboard', 'settings', 'profile', 'messages', 'notifications', 'audit-log',
  'user-management', 'manage-users', 'roles', '403', 'upcoming-events', 'documentation', 'cms',
  'client-portal', 'vault', 'crm', 'agile', 'folio', 'contracts', 'calendar-events', 'commerce',
];

/** Every slug a top-level item may not use (this project's routes plus the API's list), sorted, for inline validation. */
export const reservedSlugList = (): string[] => [...new Set([...RESERVED_SLUGS, ...API_RESERVED_SLUGS])].sort();

/** Top-level segments this project's routes actually serve: a root item with one of these slugs is shadowed. */
export const routeSlugList = (): string[] => [...RESERVED_SLUGS].filter(s => s !== '_app' && s !== 'api' && s !== 'uploads').sort();
