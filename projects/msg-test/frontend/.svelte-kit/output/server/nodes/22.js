import * as server from '../entries/pages/upcoming-events/_page.server.ts.js';

export const index = 22;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/upcoming-events/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/upcoming-events/+page.server.ts";
export const imports = ["_app/immutable/nodes/22.DQDah1ef.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/1IIScu6R.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/Cbd4l9nN.js"];
export const stylesheets = [];
export const fonts = [];
