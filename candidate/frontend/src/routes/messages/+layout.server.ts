import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, '/login');

  const sessionCookie = cookies.get('session');

  // Load users list for recipient picker (compose form)
  let allUsers: { id: string; username: string; firstName?: string; lastName?: string }[] = [];
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) {
      const raw = await res.json();
      allUsers = (raw as Array<{ id: string; username: string; firstName?: string; lastName?: string }>)
        .filter(u => u.id !== locals.user!.id);
    }
  } catch { /* non-fatal */ }

  // Load inbox for left panel
  let inbox: unknown[] = [];
  try {
    const res = await fetch(`${API_URL}/messages`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) inbox = await res.json();
  } catch { /* non-fatal */ }

  return { inbox, allUsers };
};
