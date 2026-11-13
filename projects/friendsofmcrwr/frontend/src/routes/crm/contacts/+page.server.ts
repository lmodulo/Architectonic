import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!locals.user) redirect(303, '/login');
  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const qs = url.searchParams.toString();

  let contacts: unknown[] = [];
  let total = 0;
  try {
    const res = await fetch(`${API_URL}/crm/contacts${qs ? '?' + qs : ''}`, { headers });
    if (res.ok) { const d = await res.json(); contacts = d.contacts ?? []; total = d.total ?? 0; }
  } catch { /* non-fatal */ }

  return { user: locals.user, contacts, total };
};
