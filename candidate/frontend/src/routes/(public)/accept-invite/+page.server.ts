import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ url }) => {
  return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const form     = await request.formData();
    const token    = form.get('token')    as string;
    const username = form.get('username') as string;
    const password = form.get('password') as string;
    const confirm  = form.get('confirm')  as string;

    if (!token)                  return fail(400, { error: 'Invite token is missing' });
    if (!username)               return fail(400, { error: 'Username is required' });
    if (username.length < 2)     return fail(400, { error: 'Username must be at least 2 characters' });
    if (!password)               return fail(400, { error: 'Password is required' });
    if (password.length < 8)     return fail(400, { error: 'Password must be at least 8 characters' });
    if (password !== confirm)    return fail(400, { error: 'Passwords do not match' });

    let apiRes: Response;
    try {
      apiRes = await fetch(`${API_URL}/users/invite/accept`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ token, username, password })
      });
    } catch {
      return fail(503, { error: 'Cannot reach the API server' });
    }

    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: (body as { message?: string }).message ?? 'Could not accept invitation'
      });
    }

    redirect(303, '/login?invited=1');
  }
};
