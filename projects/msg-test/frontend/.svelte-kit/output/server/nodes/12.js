import * as server from '../entries/pages/dashboard/_page.server.ts.js';

export const index = 12;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/dashboard/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/dashboard/+page.server.ts";
export const imports = ["_app/immutable/nodes/12.BqMYTxOO.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/C_D3Akx_.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/olau3In0.js","_app/immutable/chunks/_GjRPHwD.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/stvuJpC7.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/CYllZ8dq.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/CIw9gG4K.js","_app/immutable/chunks/NXAs61vP.js","_app/immutable/chunks/DqGHvmO1.js","_app/immutable/chunks/BZ6aFe1g.js","_app/immutable/chunks/B5UkqD-w.js","_app/immutable/chunks/BtrUzrsK.js","_app/immutable/chunks/qsaJWkkE.js","_app/immutable/chunks/DsUn0r2r.js","_app/immutable/chunks/xsEczMB8.js","_app/immutable/chunks/DHYm_hqR.js","_app/immutable/chunks/DOj1S9df.js","_app/immutable/chunks/B2VkkCaJ.js","_app/immutable/chunks/CjXhTrTO.js"];
export const stylesheets = ["_app/immutable/assets/MessageEditor.DjOUu3UH.css"];
export const fonts = [];
