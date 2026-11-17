import"../chunks/Bzak7iHL.js";import{o as W}from"../chunks/C_D3Akx_.js";import{e as X,f as Y,a as g,b9 as Z,p as ee,am as w,aw as te,ah as ae,al as o,b as re,J as a,c as h,d as n,s as c,r as s,t as $,K as B,ba as N}from"../chunks/CU8pdfgK.js";import{s as _}from"../chunks/BaOFUj-7.js";import{i as P}from"../chunks/B31pwaH6.js";import{e as se}from"../chunks/DrSFo_nn.js";import{h as oe}from"../chunks/1IIScu6R.js";import{d as E,i as ne}from"../chunks/BA0_6Id9.js";import{M as ie}from"../chunks/DqGHvmO1.js";import{A as le}from"../chunks/TQBwJGr3.js";import"../chunks/BKzcV6EU.js";import{I as de,s as pe}from"../chunks/C4KSK_7I.js";import{l as ce,s as me}from"../chunks/CS3GTii4.js";import{g as I}from"../chunks/Cbd4l9nN.js";import{c as ve}from"../chunks/DsUn0r2r.js";import{c as ue}from"../chunks/Dxr0fsLO.js";import{e as fe}from"../chunks/BhvGcbMx.js";import{e as _e}from"../chunks/CjXhTrTO.js";function H(r,l){const f=ce(l,["children","$$slots","$$events","$$legacy"]);/**
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
 */const y=[["path",{d:"M20 18v-2a4 4 0 0 0-4-4H4"}],["path",{d:"m9 17-5-5 5-5"}]];de(r,me({name:"reply"},()=>f,{get iconNode(){return y},children:(m,x)=>{var p=X(),M=Y(p);pe(M,l,"default",{}),g(m,p)},$$slots:{default:!0}}))}const A=Object.assign((r=>`${r==null?void 0:r["count, plural, one {# message"]} other }`),{parts:(r=>[{type:"text",value:String(r==null?void 0:r["count, plural, one {# message"])},{type:"text",value:" other "},{type:"markup-start",name:"messages",options:{},attributes:{}},{type:"text",value:"}"}])}),ye=Object.assign(((r,l={})=>(l.locale??I(),A(r))),{parts:((r,l={})=>(l.locale??I(),typeof A.parts=="function"?A.parts(r):[{type:"text",value:A(r)}]))}),be=()=>"Reply body is required",ge=((r={},l={})=>(l.locale??I(),be())),he=()=>"Reply",K=((r={},l={})=>(l.locale??I(),he()));var xe=h('<div class="px-6 py-3 border-b border-base-300 shrink-0"><h1 class="text-base font-semibold truncate"> </h1> <p class="text-xs opacity-50 mt-0.5"> </p></div>'),ke=h('<div class="flex gap-3"><!> <div class="flex-1 min-w-0"><div class="flex items-baseline gap-2 mb-1"><span class="text-sm font-medium"> </span> <span class="text-[11px] opacity-40"> </span></div> <div class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"></div></div></div>'),we=h('<aside class="alert alert-error p-3 rounded text-sm mb-3"> </aside>'),$e=h('<div class="space-y-3"><!> <div class="flex gap-2 justify-end"><button type="button" class="btn btn-ghost"> </button> <button type="button" class="btn btn-primary"><!> </button></div></div>'),je=h('<button type="button" class="btn btn-ghost w-full text-sm opacity-70 hover:opacity-100"><!> </button>'),Oe=h('<div class="flex flex-col h-full"><!> <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4"></div> <div class="shrink-0 border-t border-base-300 px-6 py-4"><!> <!></div></div>');function Fe(r,l){ee(l,!0);let f=w(te(l.data.messages)),y=w(!1),m=w(""),x=w(!1),p=w("");W(()=>{E("app:unread")}),ae(()=>{o(f,l.data.messages,!0),o(y,!1),o(m,""),o(p,"")});function M(e){return new Date(e).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}const T=B(()=>{var e;return((e=a(f)[0])==null?void 0:e.threadId)??""});async function C(){if(!a(m).trim()||a(m)==="<p></p>"){o(p,ge(),!0);return}o(x,!0),o(p,"");try{const e=await fetch(`/api/messages/${a(T)}/reply`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({body:a(m)})});if(!e.ok){const t=await e.json().catch(()=>({}));o(p,t.message??fe(),!0);return}o(m,""),o(y,!1),await Promise.all([E("app:unread"),ne()])}catch{o(p,_e(),!0)}finally{o(x,!1)}}var R=Oe(),D=n(R);{var F=e=>{var t=xe(),i=n(t),u=n(i,!0);s(i);var d=c(i,2),b=n(d,!0);s(d),s(t),$(v=>{_(u,a(f)[0].subject),_(b,v)},[()=>ye({count:a(f).length})]),g(e,t)};P(D,e=>{a(f).length>0&&e(F)})}var S=c(D,2);se(S,21,()=>a(f),e=>e.id,(e,t)=>{var i=ke(),u=n(i);{let q=B(()=>({username:a(t).from.username}));le(u,{get user(){return a(q)},size:"md"})}var d=c(u,2),b=n(d),v=n(b),j=n(v,!0);s(v);var O=c(v,2),k=n(O,!0);s(O),s(b);var z=c(b,2);oe(z,()=>a(t).body,!0),s(z),s(d),s(i),$(q=>{_(j,a(t).from.name),_(k,q)},[()=>M(a(t).createdAt)]),g(e,i)}),s(S);var J=c(S,2),L=n(J);{var G=e=>{var t=we(),i=n(t,!0);s(t),$(()=>_(i,a(p))),g(e,t)};P(L,e=>{a(p)&&e(G)})}var Q=c(L,2);{var U=e=>{var t=$e(),i=n(t);ie(i,{get html(){return a(m)},set html(k){o(m,k,!0)}});var u=c(i,2),d=n(u),b=n(d,!0);s(d);var v=c(d,2),j=n(v);H(j,{class:"size-4"});var O=c(j);s(v),s(u),s(t),$((k,z)=>{_(b,k),v.disabled=a(x),_(O,` ${z??""}`)},[()=>ve(),()=>a(x)?ue():K()]),N("click",d,()=>{o(y,!1),o(m,""),o(p,"")}),N("click",v,C),g(e,t)},V=e=>{var t=je(),i=n(t);H(i,{class:"size-4"});var u=c(i);s(t),$(d=>_(u,` ${d??""}`),[()=>K()]),N("click",t,()=>o(y,!0)),g(e,t)};P(Q,e=>{a(y)?e(U):e(V,-1)})}s(J),s(R),g(r,R),re()}Z(["click"]);export{Fe as component};
