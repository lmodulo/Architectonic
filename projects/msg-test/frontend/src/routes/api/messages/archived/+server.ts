import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const sessionCookie = cookies.get('session');
  const qs = new URLSearchParams();
  if (url.searchParams.get('limit'))  qs.set('limit',  url.searchParams.get('limit')!);
  if (url.searchParams.get('before')) qs.set('before', url.searchParams.get('before')!);
  const suffix = qs.toString() ? `?${qs}` : '';
  let res: Response;
  try {
    res = await fetch(`${API_URL}/messages/archived${suffix}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};
