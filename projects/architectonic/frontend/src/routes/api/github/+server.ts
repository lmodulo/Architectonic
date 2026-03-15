import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const sessionCookie = cookies.get('session');
  const language = url.searchParams.get('language');
  const apiUrl = language
    ? `${API_URL}/github?language=${encodeURIComponent(language)}`
    : `${API_URL}/github`;

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  const data = await res.json().catch(() => ({ items: [] }));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};
