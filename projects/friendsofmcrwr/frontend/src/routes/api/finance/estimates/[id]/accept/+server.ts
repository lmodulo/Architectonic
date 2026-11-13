import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ params, cookies }) => {
  const sessionCookie = cookies.get('session');
  const headers: Record<string, string> = {};
  if (sessionCookie) headers.cookie = `session=${sessionCookie}`;

  const res = await fetch(`${API_URL}/finance/estimates/${params.id}/accept`, {
    method: 'POST',
    headers,
  });

  const data = await res.json().catch(() => ({}));
  return json(data, { status: res.status });
};
