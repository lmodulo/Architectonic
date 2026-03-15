import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/github`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  const data = res.ok ? await res.json() : { items: [] };
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' }
  });
};
