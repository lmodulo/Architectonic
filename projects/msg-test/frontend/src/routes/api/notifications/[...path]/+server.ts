import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

function headers(cookies: Parameters<RequestHandler>[0]['cookies']) {
  const session = cookies.get('session');
  return session ? { cookie: `session=${session}` } : {};
}

export const GET: RequestHandler = async ({ params, url, cookies }) => {
  const path   = params.path ?? '';
  const query  = url.search;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/notifications/${path}${query}`, { headers: headers(cookies) });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
  const path = params.path ?? '';
  const body = await request.json().catch(() => undefined);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/notifications/${path}`, {
      method: 'PUT',
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...headers(cookies),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data);
};
