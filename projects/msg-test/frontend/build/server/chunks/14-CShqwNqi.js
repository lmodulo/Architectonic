import { e as error } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ params, cookies, locals }) => {
  if (!locals.user) return { messages: [] };
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const res = await fetch(`${API_URL}/messages/${params.threadId}`, { headers });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw error(res.status, d.message ?? "Failed to load thread");
  }
  const messages = await res.json();
  return { messages };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 14;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-T8i7rmmp.js')).default;
const server_id = "src/routes/messages/[threadId]/+page.server.ts";
const imports = ["_app/immutable/nodes/14.DArQsytl.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/1IIScu6R.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/DqGHvmO1.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/BZ6aFe1g.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/DsUn0r2r.js","_app/immutable/chunks/Dxr0fsLO.js","_app/immutable/chunks/BhvGcbMx.js","_app/immutable/chunks/CjXhTrTO.js"];
const stylesheets = ["_app/immutable/assets/MessageEditor.DjOUu3UH.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=14-CShqwNqi.js.map
