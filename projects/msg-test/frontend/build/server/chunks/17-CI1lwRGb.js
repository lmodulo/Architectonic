import { b as private_env } from './shared-server-DaWdgxVh.js';
import { f as fail } from './index-B2LGyy1l.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  if (!locals.user) return { prefs: null };
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const res = await fetch(`${API_URL}/notifications/preferences`, { headers });
  const prefs = res.ok ? await res.json() : null;
  return { prefs };
};
const actions = {
  default: async ({ request, cookies }) => {
    const sessionCookie = cookies.get("session");
    const headers = { "content-type": "application/json" };
    if (sessionCookie) headers.cookie = `session=${sessionCookie}`;
    const form = await request.formData();
    const body = {
      channels: {
        email: form.get("email_channel") === "on"
      },
      muted: form.getAll("muted").map(String),
      quiet: {
        enabled: form.get("quiet_enabled") === "on",
        start: form.get("quiet_start"),
        end: form.get("quiet_end"),
        timezone: form.get("quiet_timezone")
      }
    };
    const res = await fetch(`${API_URL}/notifications/preferences`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) return fail(res.status, { error: "Failed to save preferences" });
    return { success: true };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions,
  load: load
});

const index = 17;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BuclM6Gi.js')).default;
const server_id = "src/routes/notifications/settings/+page.server.ts";
const imports = ["_app/immutable/nodes/17.D4Pvn707.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/Bl4GYAKP.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/CJs5rpXl.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/Cbd4l9nN.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=17-CI1lwRGb.js.map
