import * as server from '../entries/pages/messages/_layout.server.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/messages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/messages/+layout.server.ts";
export const imports = ["_app/immutable/nodes/3.BR7sTtYa.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/olau3In0.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/BwPgQhss.js","_app/immutable/chunks/BA0_6Id9.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/D6j2GvHd.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/DOIZYDPm.js"];
export const stylesheets = [];
export const fonts = [];
