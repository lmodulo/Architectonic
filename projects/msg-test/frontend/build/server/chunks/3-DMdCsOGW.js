import { r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, "/login");
  const sessionCookie = cookies.get("session");
  let allUsers = [];
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) {
      const raw = await res.json();
      allUsers = raw.filter((u) => u.id !== locals.user.id);
    }
  } catch {
  }
  let inbox = [];
  let inboxHasMore = false;
  try {
    const res = await fetch(`${API_URL}/messages?limit=25`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) {
      const d = await res.json();
      inbox = d.threads ?? [];
      inboxHasMore = d.hasMore ?? false;
    }
  } catch {
  }
  return { inbox, inboxHasMore, allUsers };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 3;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-CORAiAKm.js')).default;
const server_id = "src/routes/messages/+layout.server.ts";
const imports = ["_app/immutable/nodes/3.BR7sTtYa.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/olau3In0.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/BwPgQhss.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/D6j2GvHd.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/DOIZYDPm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=3-DMdCsOGW.js.map
