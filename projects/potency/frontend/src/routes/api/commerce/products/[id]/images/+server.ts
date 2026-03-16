import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ cookies, params, request }) => {
  const sessionCookie = cookies.get('session');
  // Pass multipart body through directly — do not re-encode
  const res = await fetch(`${API_URL}/commerce/products/${params.id}/images`, {
    method: 'POST',
    headers: {
      'content-type': request.headers.get('content-type') ?? 'multipart/form-data',
      ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
    },
    // @ts-ignore — duplex required for streaming body
    body: request.body,
    duplex: 'half'
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};

export const DELETE: RequestHandler = async ({ cookies, params, request }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/commerce/products/${params.id}/images`, {
    method: 'DELETE',
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
