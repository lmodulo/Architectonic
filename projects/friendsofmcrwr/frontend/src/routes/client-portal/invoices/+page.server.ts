import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const skip   = url.searchParams.get('skip') ?? '0';
  const status = url.searchParams.get('status') ?? '';

  let invoices: unknown[] = [];
  let total = 0;
  try {
    const params = new URLSearchParams({ limit: '25', skip, sort: 'createdAt', sortDir: 'desc' });
    if (status) params.set('status', status);
    const res = await fetch(`${API_URL}/finance/invoices?${params}`, { headers });
    if (res.ok) {
      const d = await res.json();
      invoices = d.invoices ?? [];
      total    = d.total    ?? 0;
    }
  } catch { /* non-fatal */ }

  return { user: locals.user, invoices, total, skip: Number(skip), status };
};
