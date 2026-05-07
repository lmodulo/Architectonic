import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const sessionCookie = cookies.get('session');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/agile/jobs/${params.id}/attachments`, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') ?? 'multipart/form-data',
        ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}),
      },
      // @ts-ignore — duplex required for streaming body in Node fetch
      body: request.body,
      duplex: 'half',
    });
  } catch { throw error(503, 'Cannot reach the API server'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Upload failed');
  return json(data);
};
