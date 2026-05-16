import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, '/login');
  if (!hasPermission(user, 'automation', 'read')) redirect(302, '/dashboard');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [rulesRes, metaRes] = await Promise.all([
    fetch(`${API_URL}/automation`, { headers }),
    fetch(`${API_URL}/automation/meta`, { headers }),
  ]);

  const rules = rulesRes.ok ? await rulesRes.json() : [];
  const meta  = metaRes.ok  ? await metaRes.json()  : { triggerEvents: [], actionTypes: [] };

  return { rules, meta };
};
