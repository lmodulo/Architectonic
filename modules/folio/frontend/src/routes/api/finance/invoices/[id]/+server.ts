import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, params }) => {
  const sessionCookie = cookies.get('session');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/finance/invoices/${params.id}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};

export const PATCH: RequestHandler = async ({ request, cookies, params }) => {
  const sessionCookie = cookies.get('session');
  const body = await request.json();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/finance/invoices/${params.id}`, {
      method:  'PATCH',
      headers: { 'content-type': 'application/json', ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}) },
      body:    JSON.stringify(body),
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
  const sessionCookie = cookies.get('session');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/finance/invoices/${params.id}`, {
      method:  'DELETE',
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  if (res.status === 204) return new Response(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};
