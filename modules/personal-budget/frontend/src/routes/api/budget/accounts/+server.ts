import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies }) => {
  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/accounts`, {
    headers: session ? { cookie: `session=${session}` } : {},
  });
  const data = await res.json().catch(() => ({ institutions: [], items: [] }));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
};

export const POST: RequestHandler = async ({ cookies, url }) => {
  const session = cookies.get('session');
  // POST /api/budget/accounts/refresh — proxied from ?action=refresh param
  const action = url.searchParams.get('action');
  const res = await fetch(`${API_URL}/budget/accounts${action ? `/${action}` : ''}`, {
    method:  'POST',
    headers: session ? { cookie: `session=${session}` } : {},
  });
  return new Response(null, { status: res.status });
};
