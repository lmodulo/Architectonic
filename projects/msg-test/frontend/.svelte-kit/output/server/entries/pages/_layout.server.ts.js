import { b as private_env } from "../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies, depends }) => {
  depends("app:unread");
  const appName = private_env.APP_NAME || null;
  if (!locals.user) {
    const { brandName: brandName2, brandLogo: brandLogo2 } = await fetch(`${API_URL}/settings/brand`).then((r) => r.ok ? r.json() : { brandName: null, brandLogo: null }).catch(() => ({ brandName: null, brandLogo: null }));
    return { user: null, unreadCount: 0, appName, brandName: brandName2, brandLogo: brandLogo2 };
  }
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const [unreadCount, chatEnabled, brandName, brandLogo, userWorkspaces] = await Promise.all([
    fetch(`${API_URL}/messages/unread-count`, { headers }).then((r) => r.ok ? r.json() : { count: 0 }).then((d) => d.count).catch(() => 0),
    fetch(`${API_URL}/settings/chat.enabled`, { headers }).then((r) => r.ok ? r.json() : null).then((d) => d?.value !== false).catch(() => true),
    fetch(`${API_URL}/settings/brand.name`, { headers }).then((r) => r.ok ? r.json() : null).then((d) => d?.value || null).catch(() => null),
    fetch(`${API_URL}/settings/brand.logo`, { headers }).then((r) => r.ok ? r.json() : null).then((d) => d?.value || null).catch(() => null),
    fetch(`${API_URL}/workspaces`, { headers }).then((r) => r.ok ? r.json() : []).catch(() => [])
  ]);
  const currentWorkspace = userWorkspaces.find((ws) => ws.id === locals.user?.workspaceId) ?? userWorkspaces[0] ?? null;
  return { user: locals.user, unreadCount, chatEnabled, appName, brandName, brandLogo, userWorkspaces, currentWorkspace };
};
export {
  load
};
