import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, params }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/commerce/orders/${params.id}`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};
