import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const PATCH: RequestHandler = async ({ cookies, request }) => {
  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/planning/rules/reorder`, {
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
