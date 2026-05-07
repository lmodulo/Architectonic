import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) return { prefs: null };

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const res = await fetch(`${API_URL}/notifications/preferences`, { headers });
  const prefs = res.ok ? await res.json() : null;

  return { prefs };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session');
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (sessionCookie) headers.cookie = `session=${sessionCookie}`;

    const form = await request.formData();

    const body = {
      channels: {
        email: form.get('email_channel') === 'on',
      },
      muted: form.getAll('muted').map(String),
      quiet: {
        enabled:  form.get('quiet_enabled') === 'on',
        start:    form.get('quiet_start')   as string,
        end:      form.get('quiet_end')     as string,
        timezone: form.get('quiet_timezone') as string,
      },
    };

    const res = await fetch(`${API_URL}/notifications/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) return fail(res.status, { error: 'Failed to save preferences' });
    return { success: true };
  }
};
