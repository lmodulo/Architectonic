import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  let documents: unknown[] = [];
  let total = 0;
  try {
    const res = await fetch(`${API_URL}/vault/documents?limit=100`, { headers });
    if (res.ok) {
      const d = await res.json();
      documents = d.documents ?? [];
      total     = d.total     ?? 0;
    }
  } catch { /* non-fatal */ }

  let folders: unknown[] = [];
  try {
    const res = await fetch(`${API_URL}/vault/folders`, { headers });
    if (res.ok) folders = await res.json();
  } catch { /* non-fatal */ }

  return { user: locals.user, documents, total, folders };
};
