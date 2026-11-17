import { f as fail, r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ url }) => {
  return { token: url.searchParams.get("token") ?? "" };
};
const actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const token = form.get("token");
    const password = form.get("password");
    const confirm = form.get("confirm");
    if (!token) return fail(400, { error: "Reset token is missing" });
    if (!password) return fail(400, { error: "Password is required" });
    if (password !== confirm) return fail(400, { error: "Passwords do not match" });
    if (password.length < 8) return fail(400, { error: "Password must be at least 8 characters" });
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server" });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Reset failed"
      });
    }
    redirect(303, "/login?reset=1");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-oTpxDEhT.js')).default;
const server_id = "src/routes/(public)/reset-password/+page.server.ts";
const imports = ["_app/immutable/nodes/9.CIBzIz0W.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/Bl4GYAKP.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/C7qetnXB.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/OVS9_fOF.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/DtqSBRU0.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/DhLccHqz.js","_app/immutable/chunks/B3mFwWvb.js"];
const stylesheets = ["_app/immutable/assets/MarketingNav.Cwt3d9C7.css","_app/immutable/assets/AuthShell.DLc9Xvo0.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=9-CvoVvaR3.js.map
