import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async () => {
  let events = [];
  try {
    const res = await fetch(`${API_URL}/events/public`);
    if (res.ok) events = await res.json();
  } catch {
  }
  return { events };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 22;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BICOWvV9.js')).default;
const server_id = "src/routes/upcoming-events/+page.server.ts";
const imports = ["_app/immutable/nodes/22.DQDah1ef.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/1IIScu6R.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/Cbd4l9nN.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=22-BrKEceVw.js.map
