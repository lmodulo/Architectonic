import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
  const sessionCookie = cookies.get('session');

  if (sessionCookie) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { cookie: `session=${sessionCookie}` }
      });
    } catch {
      // Best-effort — always clear the browser cookie regardless
    }
  }

  cookies.delete('session', { path: '/' });
  redirect(303, '/');
};
