import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// PUT ?offset=N — the next chunk of an upload, as raw bytes (each is under the web server's body limit).
// Passes the API's answer through as it is: a 409 carries the offset to resume from, a 429 its Retry-After.
export const PUT: RequestHandler = async ({ params, url, request, cookies }) => {
  const sessionCookie = cookies.get('session');
  const offset = url.searchParams.get('offset') ?? '';
  const chunk = await request.arrayBuffer();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/calendar-events/media/${encodeURIComponent(params.id)}?offset=${encodeURIComponent(offset)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/octet-stream',
        ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}),
      },
      body: chunk,
    });
  } catch {
    return json({ message: 'Cannot reach the API server' }, { status: 503 });
  }

  const data = await res.json().catch(() => ({}));
  const retryAfter = res.headers.get('retry-after');
  return json(data, { status: res.status, headers: retryAfter ? { 'retry-after': retryAfter } : {} });
};

// DELETE — cancel an upload, or drop one that isn't on an event yet
export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const sessionCookie = cookies.get('session');

  let res: Response;
  try {
    res = await fetch(`${API_URL}/calendar-events/media/${encodeURIComponent(params.id)}`, {
      method: 'DELETE',
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {},
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  if (res.status !== 204 && !res.ok) {
    const data = await res.json().catch(() => ({}));
    throw error(res.status, (data as { message?: string }).message ?? 'Delete failed');
  }
  return new Response(null, { status: 204 });
};
