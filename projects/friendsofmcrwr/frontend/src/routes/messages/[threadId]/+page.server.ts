import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
  if (!locals.user) return { messages: [] };

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const res = await fetch(`${API_URL}/messages/${params.threadId}`, { headers });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw error(res.status, (d as { message?: string }).message ?? 'Failed to load thread');
  }

  const messages = await res.json();
  return { messages };
};
