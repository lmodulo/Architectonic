import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/signin');

  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/planning/rules`, {
    headers: session ? { cookie: `session=${session}` } : {},
  }).catch(() => null);

  const data = res?.ok ? await res.json().catch(() => null) : null;

  return {
    user:  locals.user,
    rules: data?.rules ?? [],
  };
};
