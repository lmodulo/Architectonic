import"./Bzak7iHL.js";import"./BKzcV6EU.js";import{e as $,f as v,a as w,J as e,al as a,am as i}from"./CU8pdfgK.js";import{I as C,s as M}from"./C4KSK_7I.js";import{l as b,s as y}from"./CS3GTii4.js";function W(s,t){const o=b(t,["children","$$slots","$$events","$$legacy"]);/**
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
 */const h=[["path",{d:"M10 11v6"}],["path",{d:"M14 11v6"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}],["path",{d:"M3 6h18"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]];C(s,y({name:"trash-2"},()=>o,{get iconNode(){return h},children:(u,p)=>{var l=$(),_=v(l);M(_,t,"default",{}),w(u,l)},$$slots:{default:!0}}))}let r=i(!1),m=i(0),g=i(0),f=i(!1),c=i(null),d=i(!1),n=null;const k=()=>e(r),x=()=>e(m),I=()=>e(g),N=()=>e(f),O=()=>e(c),V=()=>e(d);function X(s){return e(r)&&n===s}function A(){a(r,!1),a(c,null),a(d,!1),n=null}async function Y(s,t,o){if(a(f,window.innerHeight-t.bottom<228),a(g,e(f)?window.innerHeight-t.top+6:t.bottom+6,!0),a(m,Math.min(Math.max(t.left,8),window.innerWidth-288-8),!0),a(c,s,!0),n=o,a(r,!0),s.id&&s.teams===void 0){a(d,!0);try{const p=await fetch(`/api/users/${s.id}`);if(p.ok){const l=await p.json();a(c,{...s,...l},!0)}}catch{}finally{a(d,!1)}}}function j(s){var o;if(!e(r))return;const t=s.target;(o=t.closest)!=null&&o.call(t,"[data-user-card]")||n!=null&&n.contains(t)||A()}export{W as T,N as a,I as b,A as c,k as d,O as e,V as f,x as g,j as h,X as i,Y as o};
