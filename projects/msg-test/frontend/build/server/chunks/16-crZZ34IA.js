import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies, url }) => {
  if (!locals.user) return { items: [], total: 0, page: 1, pages: 1 };
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const filter = url.searchParams.get("filter") ?? "all";
  const res = await fetch(`${API_URL}/notifications?filter=${filter}&page=1`, { headers });
  const data = res.ok ? await res.json() : { items: [], total: 0, page: 1, pages: 1 };
  return { ...data, filter };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 16;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-D9XPtQZl.js')).default;
const server_id = "src/routes/notifications/+page.server.ts";
const imports = ["_app/immutable/nodes/16.D0uw1j4W.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/olau3In0.js","_app/immutable/chunks/BF2ZWkyB.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/VpuQ3jzJ.js","_app/immutable/chunks/qsaJWkkE.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/DOIZYDPm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=16-crZZ34IA.js.map
