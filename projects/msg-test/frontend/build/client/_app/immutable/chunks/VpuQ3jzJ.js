import"./Bzak7iHL.js";import"./BKzcV6EU.js";import{e as _,f as N,a as v,am as y,aw as A,al as n,J as l}from"./CU8pdfgK.js";import{I as w,s as C}from"./C4KSK_7I.js";import{l as S,s as T}from"./CS3GTii4.js";function U(i,r){const d=S(r,["children","$$slots","$$events","$$legacy"]);/**
 * @license lucide-svelte v0.577.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2026 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */const e=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"}]];w(i,T({name:"bell"},()=>d,{get iconNode(){return e},children:(o,s)=>{var c=_(),$=N(c);C($,r,"default",{}),v(o,c)},$$slots:{default:!0}}))}function x(i,r){const d=S(r,["children","$$slots","$$events","$$legacy"]);/**
 * @license lucide-svelte v0.577.0 - ISC
 *
 * ISC License
 *
 * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2026.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * ---
 *
 * The MIT License (MIT) (for portions derived from Feather)
 *
 * Copyright (c) 2013-2026 Cole Bemis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */const e=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87"}],["circle",{cx:"9",cy:"7",r:"4"}]];w(i,T({name:"users"},()=>d,{get iconNode(){return e},children:(o,s)=>{var c=_(),$=N(c);C($,r,"default",{}),v(o,c)},$$slots:{default:!0}}))}let h=y(!1),a=y(A([])),u=y(0),t=null,f=null,m=1e3,p=null,g=!0;const D=()=>l(u);function J(){t&&(t.readyState===WebSocket.OPEN||t.readyState===WebSocket.CONNECTING)||(g=!0,k())}function W(){g=!1,f&&(clearTimeout(f),f=null),t==null||t.close(),t=null,n(h,!1)}function k(){const r=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/notifications/ws`;t=new WebSocket(r),t.onopen=()=>{n(h,!0),m=1e3,p&&t.send(JSON.stringify({type:"sync",since:p}))},t.onclose=()=>{n(h,!1),t=null,g&&M()},t.onerror=()=>{t==null||t.close()},t.onmessage=d=>{let e;try{e=JSON.parse(d.data)}catch{return}if(e.type==="init")n(u,e.unreadCount??0,!0);else if(e.type==="notification"){const o=e.payload;l(a).some(s=>s._id===o._id)||(n(a,[o,...l(a)],!0),p=o.createdAt),n(u,l(u)+1)}else if(e.type==="count-update")n(u,e.unreadCount??0,!0);else if(e.type==="read-confirmed"){const o=e.notificationId;n(a,l(a).map(s=>s._id===o?{...s,read:!0}:s),!0)}else if(e.type==="sync-response"){const o=e.notifications??[];for(const s of o)l(a).some(c=>c._id===s._id)||n(a,[...l(a),s],!0);n(a,l(a).sort((s,c)=>new Date(c.createdAt).getTime()-new Date(s.createdAt).getTime()),!0),n(u,e.unreadCount??0,!0),o.length>0&&(p=o[0].createdAt)}}}function M(){f=setTimeout(()=>{f=null,k()},m),m=Math.min(m*2,3e4)}async function z(i){try{const r=await fetch(`/api/notifications/${i}/read`,{method:"PUT"});if(r.ok){n(a,l(a).map(e=>e._id===i?{...e,read:!0}:e),!0);const d=await r.json();d.unreadCount!==void 0&&n(u,d.unreadCount,!0)}}catch{}}function B(i){n(a,i,!0)}export{U as B,x as U,J as c,W as d,D as g,z as m,B as s};
