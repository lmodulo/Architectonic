import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// GET /api/users — list users (paginated)
export const GET: RequestHandler = async ({ url, cookies }) => {
  const sessionCookie = cookies.get('session');
  const params = url.searchParams.toString();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/users${params ? `?${params}` : ''}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }
  const data = await res.json().catch(() => ({ users: [], total: 0 }));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Fetch failed');
  return json(data);
};

// POST /api/users — admin invites a new user
export const POST: RequestHandler = async ({ request, cookies }) => {
  const sessionCookie = cookies.get('session');
  const body = await request.json();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/users/invite`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw error(503, 'Cannot reach the API server');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, (data as { message?: string }).message ?? 'Invite failed');
  return json(data, { status: 201 });
};
