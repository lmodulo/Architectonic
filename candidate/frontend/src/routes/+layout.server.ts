import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Exposes locals.user to all pages via data.user
export const load: LayoutServerLoad = async ({ locals, cookies, depends }) => {
  depends('app:unread');

  const appName = env.APP_NAME || null;

  if (!locals.user) {
    const { brandName, brandLogo } = await fetch(`${API_URL}/settings/brand`)
      .then(r => r.ok ? r.json() : { brandName: null, brandLogo: null })
      .catch(() => ({ brandName: null, brandLogo: null }));
    return { user: null, unreadCount: 0, appName, brandName, brandLogo };
  }

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [unreadCount, chatEnabled, brandName, brandLogo] = await Promise.all([
    fetch(`${API_URL}/messages/unread-count`, { headers })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then((d: { count: number }) => d.count)
      .catch(() => 0),
    fetch(`${API_URL}/settings/chat.enabled`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => d?.value !== false)
      .catch(() => true),
    fetch(`${API_URL}/settings/brand.name`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || null)
      .catch(() => null),
    fetch(`${API_URL}/settings/brand.logo`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || null)
      .catch(() => null)
  ]);

  return { user: locals.user, unreadCount, chatEnabled, appName, brandName, brandLogo };
};
