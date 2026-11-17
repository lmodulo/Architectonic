import { f as fail, r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");
    if (!email || !password) {
      return fail(400, { error: "Email and password are required", email });
    }
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server", email });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Login failed",
        email
      });
    }
    const setCookieHeader = apiRes.headers.get("set-cookie");
    if (setCookieHeader) {
      const match = setCookieHeader.match(/^session=([^;]+)/);
      if (match) {
        cookies.set("session", match[1], {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7
        });
      }
    }
    const user = await apiRes.json().catch(() => null);
    redirect(303, user?.role === "customer" ? "/" : "/dashboard");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DfGzSxz6.js')).default;
const server_id = "src/routes/(public)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.4UoaYtIa.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/Bl4GYAKP.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C7qetnXB.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/OVS9_fOF.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/DtqSBRU0.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/BwPgQhss.js","_app/immutable/chunks/CvYtwPJb.js","_app/immutable/chunks/BCIG-tPQ.js"];
const stylesheets = ["_app/immutable/assets/MarketingNav.Cwt3d9C7.css","_app/immutable/assets/AuthShell.DLc9Xvo0.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-Da3aKSH-.js.map
