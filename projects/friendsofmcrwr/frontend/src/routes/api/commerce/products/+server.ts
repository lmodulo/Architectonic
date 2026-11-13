import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const sessionCookie = cookies.get('session');
  const qs = url.searchParams.toString();
  const res = await fetch(`${API_URL}/commerce/products${qs ? `?${qs}` : ''}`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  const data = res.ok ? await res.json() : { products: [], total: 0 };
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/commerce/products`, {
    method: 'POST',
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
