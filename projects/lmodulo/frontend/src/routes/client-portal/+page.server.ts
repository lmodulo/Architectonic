import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  // Get owner/admin users to use as recipients (customer role cannot read /users)
  let staffUsers: Array<{ id: string; username: string; firstName?: string; lastName?: string }> = [];
  try {
    const res = await fetch(`${API_URL}/messages/staff-recipients`, { headers });
    if (res.ok) {
      const d = await res.json() as { staff: Array<{ id: string; username: string; firstName?: string; lastName?: string }> };
      staffUsers = d.staff ?? [];
    }
  } catch { /* non-fatal */ }

  // Load the customer's inbox threads
  let threads: unknown[] = [];
  let hasMore = false;
  try {
    const res = await fetch(`${API_URL}/messages?limit=25`, { headers });
    if (res.ok) {
      const d = await res.json();
      threads = d.threads ?? [];
      hasMore = d.hasMore ?? false;
    }
  } catch { /* non-fatal */ }

  return { user: locals.user, staffUsers, threads, hasMore };
};
