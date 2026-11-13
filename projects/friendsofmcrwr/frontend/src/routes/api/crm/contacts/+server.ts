import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const sessionCookie = cookies.get('session');
  const qs = url.searchParams.toString();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/crm/contacts${qs ? '?' + qs : ''}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {},
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('session');
  const body = await request.json();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/crm/contacts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Create failed');
  return json(data, { status: 201 });
};
