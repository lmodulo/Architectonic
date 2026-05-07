import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const actions: Actions = {
  default: async ({ request }) => {
    const form  = await request.formData();
    const email = form.get('email') as string;

    if (!email) return fail(400, { error: 'Email is required' });

    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ email })
      });
    } catch {
      return fail(503, { error: 'Cannot reach the API server' });
    }

    // Always return sent:true — no enumeration
    return { sent: true };
  }
};
