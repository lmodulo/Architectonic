import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form            = await request.formData();
    const username        = form.get('username')        as string;
    const email           = form.get('email')           as string;
    const password        = form.get('password')        as string;
    const confirmPassword = form.get('confirmPassword') as string;

    if (!username || !email || !password) {
      return fail(400, { error: 'All fields are required', username, email });
    }
    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match', username, email });
    }
    if (password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters', username, email });
    }

    let apiRes: Response;
    try {
      apiRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
    } catch {
      return fail(503, { error: 'Cannot reach the API server', username, email });
    }

    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: (body as { message?: string }).message ?? 'Registration failed',
        username,
        email
      });
    }

    // Relay the session cookie — register auto-logs-in the new user
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

    redirect(303, '/dashboard');
  }
};
