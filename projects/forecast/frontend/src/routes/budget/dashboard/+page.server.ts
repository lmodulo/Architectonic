import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/signin');

  const session = cookies.get('session');
  const headers = session ? { cookie: `session=${session}` } : {};

  const [accountsRes, txRes] = await Promise.all([
    fetch(`${API_URL}/budget/accounts`, { headers }).catch(() => null),
    fetch(`${API_URL}/budget/transactions?limit=10`, { headers }).catch(() => null),
  ]);

  const accountsData = accountsRes?.ok ? await accountsRes.json().catch(() => null) : null;
  const txData       = txRes?.ok       ? await txRes.json().catch(() => null)       : null;

  return {
    user:         locals.user,
    institutions: accountsData?.institutions ?? [],
    recentTx:     txData?.transactions ?? [],
  };
};
