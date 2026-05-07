import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async () => {
  try {
    const res = await fetch(`${API_URL}/auth/config`);
    if (res.ok) {
      const data = await res.json();
      return { registrationOpen: data.registrationOpen as boolean };
    }
  } catch {
    // API unreachable — default to open so the form is not incorrectly blocked
  }
  return { registrationOpen: true };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form     = await request.formData();
    const username = form.get('username') as string;
    const email    = form.get('email')    as string;
    const password = form.get('password') as string;

    if (!username || !email || !password) {
      return fail(400, { error: 'All fields are required', username, email });
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

    redirect(303, '/');
  }
};
