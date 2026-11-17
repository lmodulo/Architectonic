import { F as sanitize_props, G as spread_props, J as slot, K as stringify, P as attr_class, z as derived, Q as ensure_array_like } from "../../../chunks/index2.js";
import { p as page } from "../../../chunks/index3.js";
import { p as attr, k as escape_html } from "../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { S as Send } from "../../../chunks/send.js";
import { g as getLocale } from "../../../chunks/runtime.js";
function Archive($$renderer, $$props) {
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
    [
      "rect",
      { "width": "20", "height": "5", "x": "2", "y": "3", "rx": "1" }
    ],
    ["path", { "d": "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }],
    ["path", { "d": "M10 12h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "archive" },
    $$sanitized_props,
    {
      /**
       * @component @name Archive
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iNSIgeD0iMiIgeT0iMyIgcng9IjEiIC8+CiAgPHBhdGggZD0iTTQgOHYxMWEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWOCIgLz4KICA8cGF0aCBkPSJNMTAgMTJoNCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/archive
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
function Inbox($$renderer, $$props) {
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
    [
      "polyline",
      { "points": "22 12 16 12 14 15 10 15 8 12 2 12" }
    ],
    [
      "path",
      {
        "d": "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "inbox" },
    $$sanitized_props,
    {
      /**
       * @component @name Inbox
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxNiAxMiAxNCAxNSAxMCAxNSA4IDEyIDIgMTIiIC8+CiAgPHBhdGggZD0iTTUuNDUgNS4xMSAyIDEydjZhMiAyIDAgMCAwIDIgMmgxNmEyIDIgMCAwIDAgMi0ydi02bC0zLjQ1LTYuODlBMiAyIDAgMCAwIDE2Ljc2IDRINy4yNGEyIDIgMCAwIDAtMS43OSAxLjExeiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/inbox
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
function Square_pen($$renderer, $$props) {
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
    [
      "path",
      {
        "d": "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      }
    ],
    [
      "path",
      {
        "d": "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "square-pen" },
    $$sanitized_props,
    {
      /**
       * @component @name SquarePen
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgM0g1YTIgMiAwIDAgMC0yIDJ2MTRhMiAyIDAgMCAwIDIgMmgxNGEyIDIgMCAwIDAgMi0ydi03IiAvPgogIDxwYXRoIGQ9Ik0xOC4zNzUgMi42MjVhMSAxIDAgMCAxIDMgM2wtOS4wMTMgOS4wMTRhMiAyIDAgMCAxLS44NTMuNTA1bC0yLjg3My44NGEuNS41IDAgMCAxLS42Mi0uNjJsLjg0LTIuODczYTIgMiAwIDAgMSAuNTA2LS44NTJ6IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/square-pen
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
const en_common_load_more = (
  /** @type {(inputs: Common_Load_MoreInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Load more`
    );
  }
);
const common_load_more = (
  /** @type {((inputs?: Common_Load_MoreInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Load_MoreInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_load_more();
  })
);
const en_messages_title = (
  /** @type {(inputs: Messages_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Messages`
    );
  }
);
const messages_title = (
  /** @type {((inputs?: Messages_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_title();
  })
);
const en_messages_subtitle = (
  /** @type {(inputs: Messages_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Inbox, sent mail, and archived conversations`
    );
  }
);
const messages_subtitle = (
  /** @type {((inputs?: Messages_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_subtitle();
  })
);
const en_messages_compose = (
  /** @type {(inputs: Messages_ComposeInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Compose`
    );
  }
);
const messages_compose = (
  /** @type {((inputs?: Messages_ComposeInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_ComposeInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_compose();
  })
);
const en_messages_inbox = (
  /** @type {(inputs: Messages_InboxInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Inbox`
    );
  }
);
const messages_inbox = (
  /** @type {((inputs?: Messages_InboxInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_InboxInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_inbox();
  })
);
const en_messages_sent = (
  /** @type {(inputs: Messages_SentInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sent`
    );
  }
);
const messages_sent = (
  /** @type {((inputs?: Messages_SentInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_SentInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_sent();
  })
);
const en_messages_archive = (
  /** @type {(inputs: Messages_ArchiveInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Archive`
    );
  }
);
const messages_archive = (
  /** @type {((inputs?: Messages_ArchiveInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_ArchiveInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_archive();
  })
);
const en_messages_none = (
  /** @type {(inputs: Messages_NoneInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No messages`
    );
  }
);
const messages_none = (
  /** @type {((inputs?: Messages_NoneInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_NoneInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_none();
  })
);
function MessageListItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      threadId,
      subject,
      latestFrom,
      latestAt,
      unreadCount = 0,
      active = false
    } = $$props;
    const date = derived(() => () => {
      const d = new Date(latestAt);
      const now = /* @__PURE__ */ new Date();
      const isToday = d.toDateString() === now.toDateString();
      return isToday ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" });
    });
    $$renderer2.push(`<a${attr("href", `/messages/${stringify(threadId)}`)}${attr_class(`flex items-start gap-3 px-4 py-3 border-b border-base-200 transition-colors cursor-pointer ${stringify(active ? "bg-primary/10 text-primary" : "hover:bg-base-200")}`)}><div${attr_class(`mt-1.5 shrink-0 size-2 rounded-full ${stringify(unreadCount > 0 ? "bg-primary" : "bg-transparent")}`)}></div> <div class="flex-1 min-w-0"><div class="flex items-baseline justify-between gap-2"><span${attr_class(`text-sm truncate ${stringify(unreadCount > 0 ? "font-semibold" : "font-normal opacity-80")}`)}>${escape_html(latestFrom)}</span> <span class="text-[10px] opacity-50 shrink-0">${escape_html(date()())}</span></div> <p${attr_class(`text-xs truncate mt-0.5 ${stringify(unreadCount > 0 ? "opacity-90" : "opacity-50")}`)}>${escape_html(subject)}</p></div> `);
    if (unreadCount > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="shrink-0 mt-1 bg-primary min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-white">${escape_html(unreadCount)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></a>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    let activeTab = "inbox";
    let listData = data.inbox;
    let hasMore = data.inboxHasMore ?? false;
    let loadingMore = false;
    const currentThreadId = derived(() => page.params.threadId ?? null);
    function resolveFrom(userId) {
      const u = data.allUsers.find((x) => x.id === userId);
      if (!u) return userId;
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
      return name || u.username;
    }
    $$renderer2.push(`<div class="flex flex-col h-full overflow-hidden gap-4"><div class="shrink-0">`);
    PageHeader($$renderer2, { title: messages_title(), subtitle: messages_subtitle() });
    $$renderer2.push(`<!----></div> <div class="flex flex-1 overflow-hidden border border-base-300 rounded-box"><aside class="w-72 shrink-0 flex flex-col border-r border-base-300 overflow-hidden"><div class="px-3 py-3 border-b border-base-300"><a href="/messages/compose" class="btn btn-primary w-full">`);
    Square_pen($$renderer2, { class: "size-4" });
    $$renderer2.push(`<!----> <span>${escape_html(messages_compose())}</span></a></div> <div class="flex border-b border-base-300 shrink-0"><!--[-->`);
    const each_array = ensure_array_like([
      ["inbox", messages_inbox(), Inbox],
      ["sent", messages_sent(), Send],
      ["archived", messages_archive(), Archive]
    ]);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [tab, label, Icon2] = each_array[$$index];
      $$renderer2.push(`<button type="button"${attr_class(`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${stringify(activeTab === tab ? "bg-primary/15 text-primary border-b-2 border-primary" : "opacity-60 hover:opacity-100")}`)}>`);
      if (Icon2) {
        $$renderer2.push("<!--[-->");
        Icon2($$renderer2, { class: "size-3.5" });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(` ${escape_html(label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="flex-1 overflow-y-auto">`);
    if (listData.length === 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<p class="text-xs text-center opacity-40 mt-8">${escape_html(messages_none())}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(listData);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let thread = each_array_1[$$index_1];
        MessageListItem($$renderer2, {
          threadId: thread.threadId,
          subject: thread.subject,
          latestFrom: resolveFrom(thread.latestFrom),
          latestAt: thread.latestAt,
          unreadCount: thread.unreadCount,
          active: currentThreadId() === thread.threadId
        });
      }
      $$renderer2.push(`<!--]--> `);
      if (hasMore) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="px-3 py-2"><button type="button" class="btn btn-ghost btn-sm w-full text-xs opacity-60 hover:opacity-100"${attr("disabled", loadingMore, true)}>${escape_html(common_load_more())}</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></aside> <main class="flex-1 overflow-y-auto">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main></div></div>`);
  });
}
export {
  _layout as default
};
