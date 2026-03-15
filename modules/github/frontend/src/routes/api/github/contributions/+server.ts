import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const sessionCookie = cookies.get('session');
  const weeks = url.searchParams.get('weeks') ?? '12';

  let res: Response;
  try {
    res = await fetch(`${API_URL}/github/contributions?weeks=${encodeURIComponent(weeks)}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  const data = await res.json().catch(() => ({ data: [] }));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};
