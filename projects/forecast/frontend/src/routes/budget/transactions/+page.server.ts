import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/signin');

  const session = cookies.get('session');
  const headers = session ? { cookie: `session=${session}` } : {};

  const qs = url.searchParams.toString();
  const res = await fetch(`${API_URL}/budget/transactions${qs ? `?${qs}` : ''}`, { headers })
    .catch(() => null);

  const data = res?.ok ? await res.json().catch(() => null) : null;

  // Load accounts for filter dropdown
  const acctRes = await fetch(`${API_URL}/budget/accounts`, { headers }).catch(() => null);
  const acctData = acctRes?.ok ? await acctRes.json().catch(() => null) : null;

  return {
    user:         locals.user,
    transactions: data?.transactions ?? [],
    total:        data?.total        ?? 0,
    pages:        data?.pages        ?? 1,
    page:         data?.page         ?? 1,
    institutions: acctData?.institutions ?? [],
  };
};
