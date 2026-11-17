import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// POST — start uploading a photo or video for an event: { name, size, type, eventId? } → { id, chunkSize }.
// The API's answer goes through as it is, with Retry-After, so the uploader can wait out a rate limit.
export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('session');
  const body = await request.json().catch(() => ({}));

  let res: Response;
  try {
    res = await fetch(`${API_URL}/calendar-events/media`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    return json({ message: 'Cannot reach the API server' }, { status: 503 });
  }

  const data = await res.json().catch(() => ({}));
  const retryAfter = res.headers.get('retry-after');
  return json(data, { status: res.status, headers: retryAfter ? { 'retry-after': retryAfter } : {} });
};
