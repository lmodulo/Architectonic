import { r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';
import { h as hasPermission } from './permissions-DOm5Hx0d.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, "/login");
  if (!hasPermission(user, "workspaces", "read")) redirect(302, "/dashboard");
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const workspaceId = user.workspaceId;
  if (!workspaceId) redirect(302, "/dashboard");
  const [workspace, members] = await Promise.all([
    fetch(`${API_URL}/workspaces/${workspaceId}`, { headers }).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API_URL}/workspaces/${workspaceId}/members`, { headers }).then((r) => r.ok ? r.json() : []).catch(() => [])
  ]);
  return { workspace, members };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 21;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CBRB0IMT.js')).default;
const server_id = "src/routes/settings/workspaces/+page.server.ts";
const imports = ["_app/immutable/nodes/21.BPStkHf-.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/NXAs61vP.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/DZ4-hrlI.js","_app/immutable/chunks/xsEczMB8.js","_app/immutable/chunks/DHYm_hqR.js","_app/immutable/chunks/KyJWj9GA.js","_app/immutable/chunks/B2VkkCaJ.js","_app/immutable/chunks/CjXhTrTO.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=21-CsqqkaVZ.js.map
