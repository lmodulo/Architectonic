import { b as private_env } from './shared-server-DaWdgxVh.js';

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

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-BTDWyj7M.js')).default;
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.PmIBpNaa.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/olau3In0.js","_app/immutable/chunks/_GjRPHwD.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/BZ6aFe1g.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/CYllZ8dq.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/B-1UexJ4.js","_app/immutable/chunks/B5UkqD-w.js","_app/immutable/chunks/BF2ZWkyB.js","_app/immutable/chunks/VpuQ3jzJ.js","_app/immutable/chunks/BwPgQhss.js","_app/immutable/chunks/NXAs61vP.js","_app/immutable/chunks/DtqSBRU0.js","_app/immutable/chunks/PtRnALZD.js","_app/immutable/chunks/BtrUzrsK.js","_app/immutable/chunks/D6j2GvHd.js","_app/immutable/chunks/D-O0_m9T.js","_app/immutable/chunks/DOIZYDPm.js","_app/immutable/chunks/CxynDgDh.js","_app/immutable/chunks/BHzCrAbO.js","_app/immutable/chunks/CJs5rpXl.js"];
const stylesheets = ["_app/immutable/assets/0.Bo7ZaZBK.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=0-Caj07LBL.js.map
