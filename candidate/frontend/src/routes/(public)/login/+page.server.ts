import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { customerHome } from '$lib/customer-home';
import type { Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const form     = await request.formData();
    const email    = form.get('email')    as string;
    const password = form.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    let apiRes: Response;
    try {
      apiRes = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
    } catch {
      return fail(503, { error: 'Cannot reach the API server', email });
    }

    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: (body as { message?: string }).message ?? 'Login failed',
        email
      });
    }

    let session: string | null = null;
    const setCookieHeader = apiRes.headers.get('set-cookie');
    if (setCookieHeader) {
      const match = setCookieHeader.match(/^session=([^;]+)/);
      if (match) {
        session = match[1];
        cookies.set('session', match[1], {
          // Stored exactly as the API sent it (already URL-encoded). Encoding it again broke the
          // notifications websocket, which sends the browser's copy straight to the API.
          encode:   (v) => v,
          path:     '/',
          httpOnly: true,
          sameSite: 'lax',
          secure:   url.protocol === 'https:',
          maxAge:   60 * 60 * 24 * 7
        });
      }
    }

    const user = await apiRes.json().catch(() => null);
    if (user?.role !== 'customer') redirect(303, '/dashboard');

    // Customers land on their first portal page. The login response has no permissions, so
    // fetch the full user (as hooks.server.ts does) to pick a page they can actually see.
    let home = '/';
    if (session) {
      try {
        const meRes = await fetch(`${API_URL}/auth/me`, { headers: { cookie: `session=${session}` } });
        if (meRes.ok) home = customerHome(await meRes.json());
      } catch {
        // API unreachable: fall back to '/'
      }
    }
    redirect(303, home);
  }
};
