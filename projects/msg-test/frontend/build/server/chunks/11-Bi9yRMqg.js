import { r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';
import { h as hasPermission } from './permissions-DOm5Hx0d.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const PAGE_SIZE = 20;
const load = async ({ locals, cookies, url }) => {
  if (!hasPermission(locals.user, "audit", "read")) redirect(303, "/403");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const action = url.searchParams.get("action") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const skip = (page - 1) * PAGE_SIZE;
  const qs = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip) });
  if (action) qs.set("action", action);
  if (q) qs.set("q", q);
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  try {
    const res = await fetch(`${API_URL}/audit?${qs}`, { headers });
    if (!res.ok) {
      return { entries: [], count: 0, page, action, q, error: "Failed to load audit log" };
    }
    const json = await res.json();
    const entries = Array.isArray(json?.entries) ? json.entries : Array.isArray(json) ? json : [];
    const count = typeof json?.count === "number" ? json.count : Array.isArray(json) ? json.length : 0;
    return { entries, count, page, action, q, error: null };
  } catch {
    return { entries: [], count: 0, page, action, q, error: "Cannot reach the API server" };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 11;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BGKtwgZR.js')).default;
const server_id = "src/routes/audit-log/+page.server.ts";
const imports = ["_app/immutable/nodes/11.BalD-0Jb.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/stvuJpC7.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/CYllZ8dq.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/B-1UexJ4.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=11-Bi9yRMqg.js.map
