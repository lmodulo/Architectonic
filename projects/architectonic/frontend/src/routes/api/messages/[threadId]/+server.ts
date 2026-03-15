import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// GET /api/messages/:threadId — full thread
export const GET: RequestHandler = async ({ params, cookies }) => {
  const sessionCookie = cookies.get('session');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/messages/${params.threadId}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};
