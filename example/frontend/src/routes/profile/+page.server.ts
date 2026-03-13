import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = ({ locals }) => {
  return { user: locals.user };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form     = await request.formData();
    const username = (form.get('username') as string)?.trim();
    const email    = (form.get('email')    as string)?.trim();

    if (!username && !email) {
      return fail(400, { error: 'Nothing to update' });
    }

    const sessionCookie = cookies.get('session');

    let apiRes: Response;
    try {
      apiRes = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
        },
        body: JSON.stringify({ username, email })
      });
    } catch {
      return fail(503, { error: 'Cannot reach the API server' });
    }

    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: (body as { message?: string }).message ?? 'Update failed'
      });
    }

    return { success: true };
  }
};
