import { env } from '$env/dynamic/private';
import { resolveTheme } from '$lib/config/theme';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Active DaisyUI theme from Settings → Theme (publicly readable, so this works logged out too)
function fetchTheme(): Promise<string> {
  return fetch(`${API_URL}/settings/theme.mode`)
    .then(r => r.ok ? r.json() : null)
    .then((d: { value?: unknown } | null) => resolveTheme(d?.value))
    .catch(() => resolveTheme(null));
}

// String settings readable without a session (see PUBLIC_KEYS in the API's settings route)
function fetchPublicSetting(key: string): Promise<string | null> {
  return fetch(`${API_URL}/settings/${key}`)
    .then(r => r.ok ? r.json() : null)
    .then((d: { value?: unknown } | null) => (typeof d?.value === 'string' && d.value) || null)
    .catch(() => null);
}

// Exposes locals.user to all pages via data.user
export const load: LayoutServerLoad = async ({ locals, cookies, depends }) => {
  depends('app:unread');

  const appName = env.APP_NAME || null;

  if (!locals.user) {
    const [brandName, brandLogo, theme] = await Promise.all([
      fetchPublicSetting('brand.name'),
      fetchPublicSetting('brand.logo'),
      fetchTheme(),
    ]);
    locals.theme = theme;
    return { user: null, unreadCount: 0, appName, brandName, brandLogo, theme };
  }

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  interface WorkspaceEntry { id: string; name: string; slug: string; role: string; }

  const [unreadCount, chatEnabled, brandName, brandLogo, userWorkspaces, theme] = await Promise.all([
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
      .catch(() => null),
    fetch(`${API_URL}/workspaces`, { headers })
      .then(r => r.ok ? r.json() : [])
      .catch(() => []) as Promise<WorkspaceEntry[]>,
    fetchTheme(),
  ]);

  const currentWorkspace = userWorkspaces.find(ws => ws.id === locals.user?.workspaceId)
    ?? userWorkspaces[0]
    ?? null;

  locals.theme = theme;
  return { user: locals.user, unreadCount, chatEnabled, appName, brandName, brandLogo, userWorkspaces, currentWorkspace, theme };
};
