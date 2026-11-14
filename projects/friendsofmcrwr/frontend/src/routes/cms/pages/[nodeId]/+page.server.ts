import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { CmsNode, PageDraft } from '$lib/cms/types';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// The page builder: the draft (with its rev) and the node list (page info, link pickers, link URLs).
export const load: PageServerLoad = async ({ params, locals, cookies }) => {
  if (!hasPermission(locals.user, 'cms_pages', 'read')) redirect(303, '/403');
  const session = cookies.get('session');
  const headers: Record<string, string> = session ? { cookie: `session=${session}` } : {};

  const [pageRes, nodesRes] = await Promise.all([
    fetch(`${API_URL}/cms/pages/${encodeURIComponent(params.nodeId)}`, { headers }).catch(() => null),
    fetch(`${API_URL}/cms/nodes`, { headers }).catch(() => null),
  ]);
  // 400: not an id at all
  if (pageRes?.status === 404 || pageRes?.status === 400) error(404, 'Page not found');
  if (!pageRes?.ok || !nodesRes?.ok) error(503, 'The page could not be loaded. Try again in a moment.');
  return { page: (await pageRes.json()) as PageDraft, nodes: (await nodesRes.json()) as CmsNode[] };
};
