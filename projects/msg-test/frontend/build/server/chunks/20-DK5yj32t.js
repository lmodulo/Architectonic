import { r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';
import { h as hasPermission } from './permissions-DOm5Hx0d.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, "/login");
  if (!hasPermission(user, "automation", "read")) redirect(302, "/dashboard");
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const [rulesRes, metaRes] = await Promise.all([
    fetch(`${API_URL}/automation`, { headers }),
    fetch(`${API_URL}/automation/meta`, { headers })
  ]);
  const rules = rulesRes.ok ? await rulesRes.json() : [];
  const meta = metaRes.ok ? await metaRes.json() : { triggerEvents: [], actionTypes: [] };
  return { rules, meta };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 20;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BNFuNHHl.js')).default;
const server_id = "src/routes/settings/automation/+page.server.ts";
const imports = ["_app/immutable/nodes/20.FYcZ7PuK.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/NXAs61vP.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/Df1WxK4t.js","_app/immutable/chunks/DOj1S9df.js","_app/immutable/chunks/DsUn0r2r.js","_app/immutable/chunks/xsEczMB8.js","_app/immutable/chunks/D-O0_m9T.js","_app/immutable/chunks/D_4-SOBM.js","_app/immutable/chunks/B2VkkCaJ.js","_app/immutable/chunks/CjXhTrTO.js","_app/immutable/chunks/DOIZYDPm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=20-DK5yj32t.js.map
