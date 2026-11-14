import { env } from '$env/dynamic/private';
import { reservedSlugList, routeSlugList } from '$lib/server/cms/reserved';
import type { CmsNode } from '$lib/cms/types';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// The site tree. `reserved` drives the inline slug check for top-level items; `routeSlugs` marks
// top-level items that an app route shadows.
export const load: PageServerLoad = async ({ cookies }) => {
  const session = cookies.get('session');
  const headers: Record<string, string> = session ? { cookie: `session=${session}` } : {};
  const res = await fetch(`${API_URL}/cms/nodes`, { headers }).catch(() => null);
  const nodes: CmsNode[] = res?.ok ? await res.json() : [];
  return { nodes, loadFailed: !res?.ok, reserved: reservedSlugList(), routeSlugs: routeSlugList() };
};
