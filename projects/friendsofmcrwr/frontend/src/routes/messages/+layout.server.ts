import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';
import { parseTab, TAB_PATHS } from './tabs';

const API_URL = env.API_URL ?? 'http://localhost:4000';

type User = { id: string; username: string; firstName?: string; lastName?: string };

export const load: LayoutServerLoad = async ({ locals, cookies, url, depends }) => {
  if (!locals.user) redirect(303, '/login');

  // Opening a thread marks it read and then invalidates app:unread (for the header badge); re-running here as well
  // clears the thread's unread dot in the list.
  depends('app:unread');

  // Only `tab` is read from the URL, so opening or closing the compose modal (?compose) doesn't re-run this load.
  const tab = parseTab(url.searchParams.get('tab'));

  const sessionCookie = cookies.get('session');
  const headers: Record<string, string> = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [allUsers, list] = await Promise.all([
    // Recipient picker (compose) and sender names in the list
    fetch(`${API_URL}/users`, { headers })
      .then(async res => (res.ok ? ((await res.json()) as User[]).filter(u => u.id !== locals.user!.id) : []))
      .catch((): User[] => []),
    // First page of the active tab; "Load more" fetches the rest in the browser
    fetch(`${API_URL}/messages${TAB_PATHS[tab]}?limit=25`, { headers })
      .then(async res => (res.ok ? ((await res.json()) as { threads?: unknown[]; hasMore?: boolean }) : {}))
      .catch(() => ({} as { threads?: unknown[]; hasMore?: boolean })),
  ]);

  return { tab, threads: list.threads ?? [], hasMore: list.hasMore ?? false, allUsers };
};
