import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { CmsNode } from '$lib/cms/types';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!hasPermission(locals.user, 'cms_nodes', 'read')) redirect(303, '/403');

  const session = cookies.get('session');
  const headers: Record<string, string> = session ? { cookie: `session=${session}` } : {};
  const res = await fetch(`${API_URL}/cms/nodes`, { headers }).catch(() => null);
  const nodes: CmsNode[] = res?.ok ? await res.json() : [];
  return { nodes, loadFailed: !res?.ok };
};
