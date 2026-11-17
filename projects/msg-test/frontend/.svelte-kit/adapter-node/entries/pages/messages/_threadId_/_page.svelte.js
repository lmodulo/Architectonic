import { F as sanitize_props, G as spread_props, J as slot, Q as ensure_array_like } from "../../../../chunks/index2.js";
import { k as escape_html } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "@tiptap/starter-kit";
import "@tiptap/extension-underline";
import "@tiptap/extension-placeholder";
/* empty css                                                             */
import { A as Avatar } from "../../../../chunks/Avatar.js";
import { I as Icon } from "../../../../chunks/Icon.js";
import { g as getLocale } from "../../../../chunks/runtime.js";
import { h as html } from "../../../../chunks/html.js";
function Reply($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
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
   */
  const iconNode = [
    ["path", { "d": "M20 18v-2a4 4 0 0 0-4-4H4" }],
    ["path", { "d": "m9 17-5-5 5-5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "reply" },
    $$sanitized_props,
    {
      /**
       * @component @name Reply
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTh2LTJhNCA0IDAgMCAwLTQtNEg0IiAvPgogIDxwYXRoIGQ9Im05IDE3LTUtNSA1LTUiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/reply
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
const en_messages_count = (
  /** @type {((inputs: Messages_CountInputs) => LocalizedString) & { parts: (inputs: Messages_CountInputs) => import('../runtime.js').MessagePart[] }} */
  /* @__PURE__ */ Object.assign(
    /** @type {(inputs: Messages_CountInputs) => LocalizedString} */
    ((i) => {
      return (
        /** @type {LocalizedString} */
        `${i?.["count, plural, one {# message"]} other }`
      );
    }),
    {
      parts: (
        /** @type {(inputs: Messages_CountInputs) => import('../runtime.js').MessagePart[]} */
        ((i) => {
          return (
            /** @type {import('../runtime.js').MessagePart[]} */
            [{ type: "text", value: String(i?.["count, plural, one {# message"]) }, { type: "text", value: " other " }, { type: "markup-start", name: "messages", options: {}, attributes: {} }, { type: "text", value: "}" }]
          );
        })
      )
    }
  )
);
const messages_count = (
  /** @type {((inputs: Messages_CountInputs, options?: { locale?: "en" }) => LocalizedString) & { parts: (inputs: Messages_CountInputs, options?: { locale?: "en" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Messages_CountInputs, { locale?: "en" }, { messages: { options: {}; attributes: {}; children: true } }>} */
  /* @__PURE__ */ Object.assign(
    /** @type {(inputs: Messages_CountInputs, options?: { locale?: "en" }) => LocalizedString} */
    ((inputs, options = {}) => {
      options.locale ?? getLocale();
      return en_messages_count(inputs);
    }),
    {
      parts: (
        /** @type {(inputs: Messages_CountInputs, options?: { locale?: "en" }) => import('../runtime.js').MessagePart[]} */
        ((inputs, options = {}) => {
          options.locale ?? getLocale();
          return typeof en_messages_count.parts === "function" ? en_messages_count.parts(inputs) : [{ type: "text", value: en_messages_count(inputs) }];
        })
      )
    }
  )
);
const en_messages_reply = (
  /** @type {(inputs: Messages_ReplyInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Reply`
    );
  }
);
const messages_reply = (
  /** @type {((inputs?: Messages_ReplyInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_ReplyInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_reply();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let messages = data.messages;
    function formatDate(d) {
      return new Date(d).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="flex flex-col h-full">`);
      if (messages.length > 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="px-6 py-3 border-b border-base-300 shrink-0"><h1 class="text-base font-semibold truncate">${escape_html(messages[0].subject)}</h1> <p class="text-xs opacity-50 mt-0.5">${escape_html(messages_count({ count: messages.length }))}</p></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4"><!--[-->`);
      const each_array = ensure_array_like(messages);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let msg = each_array[$$index];
        $$renderer3.push(`<div class="flex gap-3">`);
        Avatar($$renderer3, { user: { username: msg.from.username }, size: "md" });
        $$renderer3.push(`<!----> <div class="flex-1 min-w-0"><div class="flex items-baseline gap-2 mb-1"><span class="text-sm font-medium">${escape_html(msg.from.name)}</span> <span class="text-[11px] opacity-40">${escape_html(formatDate(msg.createdAt))}</span></div> <div class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">${html(msg.body)}</div></div></div>`);
      }
      $$renderer3.push(`<!--]--></div> <div class="shrink-0 border-t border-base-300 px-6 py-4">`);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<button type="button" class="btn btn-ghost w-full text-sm opacity-70 hover:opacity-100">`);
        Reply($$renderer3, { class: "size-4" });
        $$renderer3.push(`<!----> ${escape_html(messages_reply())}</button>`);
      }
      $$renderer3.push(`<!--]--></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
