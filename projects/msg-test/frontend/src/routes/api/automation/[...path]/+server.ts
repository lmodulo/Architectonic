import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

async function proxy(method: string, path: string, cookies: { get: (k: string) => string | undefined }, body?: unknown): Promise<Response> {
  const sessionCookie = cookies.get('session');
  const headers: Record<string, string> = {};
  if (sessionCookie) headers.cookie = `session=${sessionCookie}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_URL}/automation/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  if (res.status === 204) return new Response(null, { status: 204 });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Request failed');
  return json(data, { status: res.status });
}

export const GET: RequestHandler = async ({ params, cookies }) =>
  proxy('GET', params.path ?? '', cookies);

export const POST: RequestHandler = async ({ params, cookies, request }) =>
  proxy('POST', params.path ?? '', cookies, await request.json());

export const PATCH: RequestHandler = async ({ params, cookies, request }) =>
  proxy('PATCH', params.path ?? '', cookies, await request.json());

export const DELETE: RequestHandler = async ({ params, cookies }) =>
  proxy('DELETE', params.path ?? '', cookies);
