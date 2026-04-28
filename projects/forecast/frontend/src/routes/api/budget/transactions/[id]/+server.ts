import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, params }) => {
  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/transactions/${params.id}`, {
    headers: session ? { cookie: `session=${session}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
};

export const PATCH: RequestHandler = async ({ cookies, params, request }) => {
  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/transactions/${params.id}`, {
    method:  'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(session ? { cookie: `session=${session}` } : {}),
    },
    body: await request.text(),
  });
  const data = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
};
