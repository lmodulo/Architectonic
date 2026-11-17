import * as server from '../entries/pages/messages/_threadId_/_page.server.ts.js';

export const index = 14;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/messages/_threadId_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/messages/[threadId]/+page.server.ts";
export const imports = ["_app/immutable/nodes/14.DArQsytl.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/1IIScu6R.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/DqGHvmO1.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/BZ6aFe1g.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/DsUn0r2r.js","_app/immutable/chunks/Dxr0fsLO.js","_app/immutable/chunks/BhvGcbMx.js","_app/immutable/chunks/CjXhTrTO.js"];
export const stylesheets = ["_app/immutable/assets/MessageEditor.DjOUu3UH.css"];
export const fonts = [];
