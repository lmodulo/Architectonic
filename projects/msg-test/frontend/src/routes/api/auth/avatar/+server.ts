import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ cookies, request }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: 'POST',
    headers: {
      'content-type': request.headers.get('content-type') ?? 'multipart/form-data',
      ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
    },
    // @ts-ignore — duplex required for streaming body in Node fetch
    body: request.body,
    duplex: 'half'
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
  const sessionCookie = cookies.get('session');
  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: 'DELETE',
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  return new Response(null, { status: res.status });
};
