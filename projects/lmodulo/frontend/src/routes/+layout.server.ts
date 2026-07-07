import { env } from '$env/dynamic/private';
import { APP_THEME, APP_FONTS } from '$lib/config/theme';
import type { LayoutServerLoad } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Exposes locals.user to all pages via data.user
export const load: LayoutServerLoad = async ({ locals, cookies, depends }) => {
  depends('app:unread');

  const appName = env.APP_NAME || null;

  if (!locals.user) {
    const [{ brandName, brandLogo }, themeMode, fonts] = await Promise.all([
      fetch(`${API_URL}/settings/brand`)
        .then(r => r.ok ? r.json() : { brandName: null, brandLogo: null })
        .catch(() => ({ brandName: null, brandLogo: null })),
      fetch(`${API_URL}/settings/theme`)
        .then(r => r.ok ? r.json() : null)
        .then((d: { mode?: string } | null) => d?.mode || APP_THEME)
        .catch(() => APP_THEME),
      fetch(`${API_URL}/settings/fonts`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null) as Promise<{ display?: string; body?: string; mono?: string } | null>
    ]);
    const fontDisplay = fonts?.display || APP_FONTS.display.family;
    const fontBody    = fonts?.body    || APP_FONTS.body.family;
    const fontMono    = fonts?.mono    || APP_FONTS.mono.family;
    return { user: null, unreadCount: 0, appName, brandName, brandLogo, themeMode, fontDisplay, fontBody, fontMono };
  }

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  const [unreadCount, chatEnabled, brandName, brandLogo, iconLibrary, themeMode, fontDisplay, fontBody, fontMono] = await Promise.all([
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
    fetch(`${API_URL}/settings/theme.icon_library`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || 'lucide')
      .catch(() => 'lucide'),
    fetch(`${API_URL}/settings/theme.mode`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || APP_THEME)
      .catch(() => APP_THEME),
    fetch(`${API_URL}/settings/theme.font_display`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || APP_FONTS.display.family)
      .catch(() => APP_FONTS.display.family),
    fetch(`${API_URL}/settings/theme.font_body`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || APP_FONTS.body.family)
      .catch(() => APP_FONTS.body.family),
    fetch(`${API_URL}/settings/theme.font_mono`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then((d: { value?: unknown } | null) => (d?.value as string) || APP_FONTS.mono.family)
      .catch(() => APP_FONTS.mono.family)
  ]);

  return { user: locals.user, unreadCount, chatEnabled, appName, brandName, brandLogo, iconLibrary, themeMode, fontDisplay, fontBody, fontMono };
};
