import { redirect } from '@sveltejs/kit';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, '/login');
  if (!hasPermission(user, 'github', 'read')) redirect(302, '/dashboard');

  const [reposRes, statusRes] = await Promise.all([
    fetch('/api/github'),
    fetch('/api/github/status'),
  ]);

  const repos = reposRes.ok ? ((await reposRes.json()) as { items: unknown[] }).items ?? [] : [];
  const status = statusRes.ok
    ? (await statusRes.json()) as { configured: boolean; repoCount: number; lastSync: string | null }
    : { configured: false, repoCount: 0, lastSync: null };

  return { user, repos, status };
};
