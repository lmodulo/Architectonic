import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const sessionCookie = cookies.get('session');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/agile/milestones/${params.id}/attachments/${encodeURIComponent(params.filename)}`, {
      method: 'DELETE',
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {},
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw error(res.status, (data as { message?: string }).message ?? 'Delete failed');
  }
  return new Response(null, { status: 204 });
};
