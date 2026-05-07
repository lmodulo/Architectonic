import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) return { items: [], total: 0, page: 1, pages: 1 };

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const filter  = url.searchParams.get('filter') ?? 'all';

  const res = await fetch(`${API_URL}/notifications?filter=${filter}&page=1`, { headers });
  const data = res.ok ? await res.json() : { items: [], total: 0, page: 1, pages: 1 };

  return { ...data, filter };
};
