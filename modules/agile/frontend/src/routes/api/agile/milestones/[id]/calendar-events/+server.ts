import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const sessionCookie = cookies.get('session');
  const body = await request.json();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/agile/milestones/${params.id}/calendar-events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Failed');
  return json(data, { status: 201 });
};
