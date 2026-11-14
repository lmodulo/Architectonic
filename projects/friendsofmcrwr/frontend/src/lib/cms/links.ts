// Link helpers shared by the public renderer and the admin. Hrefs are re-checked at render time
// even though the API sanitizes on save (defense in depth).
import type { LinkRef } from './types';

/** Same rule as the API sanitizer: http(s), mailto, tel, same-site paths (not `//` or `/\`), #anchors. */
const SAFE_HREF = /^(https?:|mailto:|tel:|\/(?![/\\])|#)/i;
const CONTROL_OR_SPACE = /[\u0000- \u007F]/;

export function safeHref(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s || s.length > 2048 || CONTROL_OR_SPACE.test(s)) return undefined;
  return SAFE_HREF.test(s) ? s : undefined;
}

/** The href for a LinkRef: nodeIds go through the page's `links` map (missing = not public). */
export function linkHref(link: LinkRef | undefined, links: Record<string, string>): string | undefined {
  if (!link) return undefined;
  if ('nodeId' in link) return safeHref(links[link.nodeId]);
  return safeHref(link.url);
}

export const isExternal = (href: string) => /^https?:\/\//i.test(href);

/** Same as the API's toSlug (candidate/api/src/lib/slug.ts). */
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
