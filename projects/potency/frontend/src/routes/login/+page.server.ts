import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form     = await request.formData();
    const email    = form.get('email')    as string;
    const password = form.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    let apiRes: Response;
    try {
      apiRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
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

    // Relay the session cookie from Fastify to the browser
    const setCookieHeader = apiRes.headers.get('set-cookie');
    if (setCookieHeader) {
      const match = setCookieHeader.match(/^session=([^;]+)/);
      if (match) {
        cookies.set('session', match[1], {
          path:     '/',
          httpOnly: true,
          sameSite: 'lax',
          secure:   process.env.NODE_ENV === 'production',
          maxAge:   60 * 60 * 24 * 7
        });
      }
    }

    const body = await apiRes.json().catch(() => ({})) as { role?: string };
    redirect(303, body.role === 'customer' ? '/' : '/dashboard');
  }
};
