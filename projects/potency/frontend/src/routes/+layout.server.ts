import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Exposes locals.user to all pages via data.user
export const load: LayoutServerLoad = async ({ locals, cookies, depends }) => {
  depends('app:unread');
  if (!locals.user) return { user: null, unreadCount: 0 };

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [unreadCount, chatEnabled, appName, appLogo] = await Promise.all([
    fetch(`${API_URL}/messages/unread-count`, { headers })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then((d: { count: number }) => d.count)
      .catch(() => 0),
    fetch(`${API_URL}/settings/chat.enabled`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => d?.value !== false)
      .catch(() => true),
    fetch(`${API_URL}/settings/app.name`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || null)
      .catch(() => null),
    fetch(`${API_URL}/settings/app.logo`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || null)
      .catch(() => null)
  ]);

  return { user: locals.user, unreadCount, chatEnabled, appName, appLogo };
};
