import { f as fail, r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async () => {
  try {
    const res = await fetch(`${API_URL}/auth/config`);
    if (res.ok) {
      const data = await res.json();
      return { registrationOpen: data.registrationOpen };
    }
  } catch {
  }
  return { registrationOpen: true };
};
const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = form.get("username");
    const email = form.get("email");
    const password = form.get("password");
    if (!username || !email || !password) {
      return fail(400, { error: "All fields are required", username, email });
    }
    if (password.length < 8) {
      return fail(400, { error: "Password must be at least 8 characters", username, email });
    }
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server", username, email });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Registration failed",
        username,
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
    redirect(303, "/");
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 8;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-C-6qiRRI.js')).default;
const server_id = "src/routes/(public)/register/+page.server.ts";
const imports = ["_app/immutable/nodes/8.Dzzxu6Nx.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/Bl4GYAKP.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C7qetnXB.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/OVS9_fOF.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/DtqSBRU0.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/B3mFwWvb.js","_app/immutable/chunks/LH0gGYzA.js","_app/immutable/chunks/CvYtwPJb.js","_app/immutable/chunks/BCIG-tPQ.js"];
const stylesheets = ["_app/immutable/assets/MarketingNav.Cwt3d9C7.css","_app/immutable/assets/AuthShell.DLc9Xvo0.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=8-C38oC3Hq.js.map
