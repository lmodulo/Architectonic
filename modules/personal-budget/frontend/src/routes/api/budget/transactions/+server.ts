import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, url }) => {
  const session = cookies.get('session');
  const qs      = url.searchParams.toString();
  const res = await fetch(`${API_URL}/budget/transactions${qs ? `?${qs}` : ''}`, {
    headers: session ? { cookie: `session=${session}` } : {},
  });
  const data = await res.json().catch(() => ({ transactions: [], total: 0 }));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
};
