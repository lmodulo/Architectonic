import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const GET: RequestHandler = async ({ url }) => {
  const qs = url.searchParams.toString();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/calendar-events/public${qs ? '?' + qs : ''}`);
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, 'Failed to load events');
  return json(data);
};
