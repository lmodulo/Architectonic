import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, params }) => {
  if (!locals.user) redirect(303, '/signin');

  const session = cookies.get('session');
  const res = await fetch(`${API_URL}/budget/transactions/${params.id}`, {
    headers: session ? { cookie: `session=${session}` } : {},
  }).catch(() => null);

  if (!res || !res.ok) error(res?.status ?? 500, 'Transaction not found');

  const transaction = await res.json();
  return { user: locals.user, transaction };
};
