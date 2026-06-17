import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const sessionCookie = cookies.get('session');
  const qs = url.searchParams.toString();
  const res = await fetch(`${API_URL}/vault/documents${qs ? `?${qs}` : ''}`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  const data = res.ok ? await res.json() : { documents: [], total: 0 };
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};

export const POST: RequestHandler = async ({ cookies, request }) => {
  const sessionCookie = cookies.get('session');
  const formData = await request.formData();
  const res = await fetch(`${API_URL}/vault/documents`, {
    method: 'POST',
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {},
    body: formData
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' }
  });
};
