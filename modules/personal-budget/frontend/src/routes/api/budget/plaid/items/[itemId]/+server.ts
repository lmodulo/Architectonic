import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const DELETE: RequestHandler = async ({ cookies, params }) => {
  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/plaid/items/${params.itemId}`, {
    method:  'DELETE',
    headers: session ? { cookie: `session=${session}` } : {},
  });
  return new Response(null, { status: res.status });
};
