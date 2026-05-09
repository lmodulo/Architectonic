import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  let myTeams: { id: string; name: string; description: string; memberCount: number }[] = [];
  try {
    const res = await fetch(`${API_URL}/teams/mine`, { headers });
    if (res.ok) myTeams = await res.json();
  } catch { /* non-fatal */ }
  return { user: locals.user, myTeams };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form      = await request.formData();
    const username  = (form.get('username')  as string)?.trim();
    const email     = (form.get('email')     as string)?.trim();
    const firstName = (form.get('firstName') as string)?.trim();
    const lastName  = (form.get('lastName')  as string)?.trim();
    const phone     = (form.get('phone')     as string)?.trim();

    const sessionCookie = cookies.get('session');

    let apiRes: Response;
    try {
      apiRes = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          ...(sessionCookie ? { cookie: `session=${sessionCookie}` } : {})
        },
        body: JSON.stringify({ username, email, firstName, lastName, phone })
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
