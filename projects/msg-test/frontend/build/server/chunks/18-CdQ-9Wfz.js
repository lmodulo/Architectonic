import { f as fail } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  let myTeams = [];
  try {
    const res = await fetch(`${API_URL}/teams/mine`, { headers });
    if (res.ok) myTeams = await res.json();
  } catch {
  }
  return { user: locals.user, myTeams };
};
const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = form.get("username")?.trim();
    const email = form.get("email")?.trim();
    const firstName = form.get("firstName")?.trim();
    const lastName = form.get("lastName")?.trim();
    const phone = form.get("phone")?.trim();
    if (!username && !email && firstName === void 0 && lastName === void 0 && phone === void 0) {
      return fail(400, { error: "Nothing to update" });
    }
    const sessionCookie = cookies.get("session");
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
        },
        body: JSON.stringify({ username, email, firstName, lastName, phone })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server" });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Update failed"
      });
    }
    return { success: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 18;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CjY7YaSO.js')).default;
const server_id = "src/routes/profile/+page.server.ts";
const imports = ["_app/immutable/nodes/18.BAzl_LZ_.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/BZ6aFe1g.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/DsUn0r2r.js","_app/immutable/chunks/DPREQ_gD.js","_app/immutable/chunks/LH0gGYzA.js","_app/immutable/chunks/CvYtwPJb.js","_app/immutable/chunks/DV0NDNaR.js","_app/immutable/chunks/CjXhTrTO.js","_app/immutable/chunks/xsEczMB8.js","_app/immutable/chunks/B2VkkCaJ.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=18-CdQ-9Wfz.js.map
