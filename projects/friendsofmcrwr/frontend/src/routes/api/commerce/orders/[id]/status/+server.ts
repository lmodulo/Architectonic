import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/commerce/orders/${params.id}/status`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
    },
    body: await request.text()
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};
