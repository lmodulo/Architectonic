import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad, Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';
  return { token };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const data     = await request.formData();
    const token    = data.get('token')    as string;
    const password = data.get('password') as string;

    const res = await fetch(`${API_URL}/auth/set-password`, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return fail(res.status, { error: (body as { message?: string }).message ?? 'Failed to set password' });
    }

    redirect(303, '/login?passwordSet=1');
  }
};
