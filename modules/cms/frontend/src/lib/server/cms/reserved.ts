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

/** Sorted, for the admin UI's inline validation. */
export const reservedSlugList = (): string[] => [...RESERVED_SLUGS].sort();
