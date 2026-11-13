import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, '/login');
  if (!hasPermission(user, 'workspaces', 'read')) redirect(302, '/dashboard');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const workspaceId = user.workspaceId;
  if (!workspaceId) redirect(302, '/dashboard');

  const [workspace, members] = await Promise.all([
    fetch(`${API_URL}/workspaces/${workspaceId}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null),
    fetch(`${API_URL}/workspaces/${workspaceId}/members`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []),
  ]);

  return { workspace, members };
};
