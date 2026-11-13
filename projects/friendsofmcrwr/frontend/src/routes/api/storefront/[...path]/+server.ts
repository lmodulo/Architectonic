import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

async function proxy(method: string, path: string, searchParams: URLSearchParams, body?: unknown) {
  const upstream = new URL(`${API_URL}/storefront/${path}`);
  searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  let res: Response;
  try {
    res = await fetch(upstream.toString(), {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Request failed');
  return json(data);
}

export const GET: RequestHandler = async ({ params, url }) =>
  proxy('GET', params.path, url.searchParams);
