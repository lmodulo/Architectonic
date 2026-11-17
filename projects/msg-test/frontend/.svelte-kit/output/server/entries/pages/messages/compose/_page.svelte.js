import { _ as ssr_context, F as sanitize_props, G as spread_props, J as slot, P as attr_class, Z as bind_props, K as stringify, N as head, Q as ensure_array_like } from "../../../../chunks/index2.js";
import { p as attr, k as escape_html } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "clsx";
import "@tiptap/starter-kit";
import "@tiptap/extension-underline";
import "@tiptap/extension-placeholder";
/* empty css                                                             */
import { I as Icon } from "../../../../chunks/Icon.js";
import { g as getLocale } from "../../../../chunks/runtime.js";
import { X } from "../../../../chunks/x.js";
import { S as Send } from "../../../../chunks/send.js";
import { c as common_cancel } from "../../../../chunks/common_cancel.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function Bold($$renderer, $$props) {
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
        "d": "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "bold" },
    $$sanitized_props,
    {
      /**
       * @component @name Bold
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNiAxMmg5YTQgNCAwIDAgMSAwIDhIN2ExIDEgMCAwIDEtMS0xVjVhMSAxIDAgMCAxIDEtMWg3YTQgNCAwIDAgMSAwIDgiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bold
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
function Italic($$renderer, $$props) {
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
    ["line", { "x1": "19", "x2": "10", "y1": "4", "y2": "4" }],
    ["line", { "x1": "14", "x2": "5", "y1": "20", "y2": "20" }],
    ["line", { "x1": "15", "x2": "9", "y1": "4", "y2": "20" }]
  ];
  Icon($$renderer, spread_props([
    { name: "italic" },
    $$sanitized_props,
    {
      /**
       * @component @name Italic
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMTkiIHgyPSIxMCIgeTE9IjQiIHkyPSI0IiAvPgogIDxsaW5lIHgxPSIxNCIgeDI9IjUiIHkxPSIyMCIgeTI9IjIwIiAvPgogIDxsaW5lIHgxPSIxNSIgeDI9IjkiIHkxPSI0IiB5Mj0iMjAiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/italic
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
function List_ordered($$renderer, $$props) {
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
    ["path", { "d": "M11 5h10" }],
    ["path", { "d": "M11 12h10" }],
    ["path", { "d": "M11 19h10" }],
    ["path", { "d": "M4 4h1v5" }],
    ["path", { "d": "M4 9h2" }],
    [
      "path",
      {
        "d": "M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "list-ordered" },
    $$sanitized_props,
    {
      /**
       * @component @name ListOrdered
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTEgNWgxMCIgLz4KICA8cGF0aCBkPSJNMTEgMTJoMTAiIC8+CiAgPHBhdGggZD0iTTExIDE5aDEwIiAvPgogIDxwYXRoIGQ9Ik00IDRoMXY1IiAvPgogIDxwYXRoIGQ9Ik00IDloMiIgLz4KICA8cGF0aCBkPSJNNi41IDIwSDMuNGMwLTEgMi42LTEuOTI1IDIuNi0zLjVhMS41IDEuNSAwIDAgMC0yLjYtMS4wMiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/list-ordered
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
function List($$renderer, $$props) {
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
    ["path", { "d": "M3 5h.01" }],
    ["path", { "d": "M3 12h.01" }],
    ["path", { "d": "M3 19h.01" }],
    ["path", { "d": "M8 5h13" }],
    ["path", { "d": "M8 12h13" }],
    ["path", { "d": "M8 19h13" }]
  ];
  Icon($$renderer, spread_props([
    { name: "list" },
    $$sanitized_props,
    {
      /**
       * @component @name List
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyA1aC4wMSIgLz4KICA8cGF0aCBkPSJNMyAxMmguMDEiIC8+CiAgPHBhdGggZD0iTTMgMTloLjAxIiAvPgogIDxwYXRoIGQ9Ik04IDVoMTMiIC8+CiAgPHBhdGggZD0iTTggMTJoMTMiIC8+CiAgPHBhdGggZD0iTTggMTloMTMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/list
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
function Redo($$renderer, $$props) {
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
    ["path", { "d": "M21 7v6h-6" }],
    ["path", { "d": "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "redo" },
    $$sanitized_props,
    {
      /**
       * @component @name Redo
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEgN3Y2aC02IiAvPgogIDxwYXRoIGQ9Ik0zIDE3YTkgOSAwIDAgMSA5LTkgOSA5IDAgMCAxIDYgMi4zbDMgMi43IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/redo
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
function Text_quote($$renderer, $$props) {
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
    ["path", { "d": "M17 5H3" }],
    ["path", { "d": "M21 12H8" }],
    ["path", { "d": "M21 19H8" }],
    ["path", { "d": "M3 12v7" }]
  ];
  Icon($$renderer, spread_props([
    { name: "text-quote" },
    $$sanitized_props,
    {
      /**
       * @component @name TextQuote
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTcgNUgzIiAvPgogIDxwYXRoIGQ9Ik0yMSAxMkg4IiAvPgogIDxwYXRoIGQ9Ik0yMSAxOUg4IiAvPgogIDxwYXRoIGQ9Ik0zIDEydjciIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/text-quote
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
function Underline($$renderer, $$props) {
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
    ["path", { "d": "M6 4v6a6 6 0 0 0 12 0V4" }],
    ["line", { "x1": "4", "x2": "20", "y1": "20", "y2": "20" }]
  ];
  Icon($$renderer, spread_props([
    { name: "underline" },
    $$sanitized_props,
    {
      /**
       * @component @name Underline
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNiA0djZhNiA2IDAgMCAwIDEyIDBWNCIgLz4KICA8bGluZSB4MT0iNCIgeDI9IjIwIiB5MT0iMjAiIHkyPSIyMCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/underline
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
function Undo($$renderer, $$props) {
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
    ["path", { "d": "M3 7v6h6" }],
    ["path", { "d": "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" }]
  ];
  Icon($$renderer, spread_props([
    { name: "undo" },
    $$sanitized_props,
    {
      /**
       * @component @name Undo
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyA3djZoNiIgLz4KICA8cGF0aCBkPSJNMjEgMTdhOSA5IDAgMCAwLTktOSA5IDkgMCAwIDAtNiAyLjNMMyAxMyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/undo
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
const en_common_send = (
  /** @type {(inputs: Common_SendInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Send`
    );
  }
);
const common_send = (
  /** @type {((inputs?: Common_SendInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SendInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_send();
  })
);
const en_messages_compose_title = (
  /** @type {(inputs: Messages_Compose_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `New Message`
    );
  }
);
const messages_compose_title = (
  /** @type {((inputs?: Messages_Compose_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_Compose_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_compose_title();
  })
);
const en_messages_compose_to = (
  /** @type {(inputs: Messages_Compose_ToInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `To`
    );
  }
);
const messages_compose_to = (
  /** @type {((inputs?: Messages_Compose_ToInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_Compose_ToInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_compose_to();
  })
);
const en_messages_compose_to_placeholder = (
  /** @type {(inputs: Messages_Compose_To_PlaceholderInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Type a username…`
    );
  }
);
const messages_compose_to_placeholder = (
  /** @type {((inputs?: Messages_Compose_To_PlaceholderInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_Compose_To_PlaceholderInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_compose_to_placeholder();
  })
);
const en_messages_compose_subject = (
  /** @type {(inputs: Messages_Compose_SubjectInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Subject`
    );
  }
);
const messages_compose_subject = (
  /** @type {((inputs?: Messages_Compose_SubjectInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_Compose_SubjectInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_compose_subject();
  })
);
const en_messages_compose_body = (
  /** @type {(inputs: Messages_Compose_BodyInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Message`
    );
  }
);
const messages_compose_body = (
  /** @type {((inputs?: Messages_Compose_BodyInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_Compose_BodyInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_compose_body();
  })
);
const en_editor_bold = (
  /** @type {(inputs: Editor_BoldInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Bold`
    );
  }
);
const editor_bold = (
  /** @type {((inputs?: Editor_BoldInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_BoldInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_bold();
  })
);
const en_editor_italic = (
  /** @type {(inputs: Editor_ItalicInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Italic`
    );
  }
);
const editor_italic = (
  /** @type {((inputs?: Editor_ItalicInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_ItalicInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_italic();
  })
);
const en_editor_underline = (
  /** @type {(inputs: Editor_UnderlineInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Underline`
    );
  }
);
const editor_underline = (
  /** @type {((inputs?: Editor_UnderlineInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_UnderlineInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_underline();
  })
);
const en_editor_bullet_list = (
  /** @type {(inputs: Editor_Bullet_ListInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Bullet list`
    );
  }
);
const editor_bullet_list = (
  /** @type {((inputs?: Editor_Bullet_ListInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Bullet_ListInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_bullet_list();
  })
);
const en_editor_ordered_list = (
  /** @type {(inputs: Editor_Ordered_ListInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Ordered list`
    );
  }
);
const editor_ordered_list = (
  /** @type {((inputs?: Editor_Ordered_ListInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Ordered_ListInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_ordered_list();
  })
);
const en_editor_blockquote = (
  /** @type {(inputs: Editor_BlockquoteInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Blockquote`
    );
  }
);
const editor_blockquote = (
  /** @type {((inputs?: Editor_BlockquoteInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_BlockquoteInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_blockquote();
  })
);
const en_editor_undo = (
  /** @type {(inputs: Editor_UndoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Undo`
    );
  }
);
const editor_undo = (
  /** @type {((inputs?: Editor_UndoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_UndoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_undo();
  })
);
const en_editor_redo = (
  /** @type {(inputs: Editor_RedoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Redo`
    );
  }
);
const editor_redo = (
  /** @type {((inputs?: Editor_RedoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_RedoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_editor_redo();
  })
);
function MessageEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { html = "", placeholder = "Write your message…" } = $$props;
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="flex flex-col border border-base-300 rounded-lg overflow-hidden"><div class="flex items-center gap-0.5 px-2 py-1.5 border-b border-base-200 bg-base-200/50 flex-wrap"><button type="button"${attr_class(`btn btn-ghost btn-square btn-xs ${stringify("")}`)}${attr("aria-label", editor_bold())}${attr("title", editor_bold())}>`);
    Bold($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <button type="button"${attr_class(`btn btn-ghost btn-square btn-xs ${stringify("")}`)}${attr("aria-label", editor_italic())}${attr("title", editor_italic())}>`);
    Italic($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <button type="button"${attr_class(`btn btn-ghost btn-square btn-xs ${stringify("")}`)}${attr("aria-label", editor_underline())}${attr("title", editor_underline())}>`);
    Underline($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <span class="w-px h-4 bg-base-content/20 mx-1"></span> <button type="button"${attr_class(`btn btn-ghost btn-square btn-xs ${stringify("")}`)}${attr("aria-label", editor_bullet_list())}${attr("title", editor_bullet_list())}>`);
    List($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <button type="button"${attr_class(`btn btn-ghost btn-square btn-xs ${stringify("")}`)}${attr("aria-label", editor_ordered_list())}${attr("title", editor_ordered_list())}>`);
    List_ordered($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <span class="w-px h-4 bg-base-content/20 mx-1"></span> <button type="button"${attr_class(`btn btn-ghost btn-square btn-xs ${stringify("")}`)}${attr("aria-label", editor_blockquote())}${attr("title", editor_blockquote())}>`);
    Text_quote($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <span class="w-px h-4 bg-base-content/20 mx-1"></span> <button type="button" class="btn btn-ghost btn-square btn-xs"${attr("aria-label", editor_undo())}${attr("title", editor_undo())}>`);
    Undo($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button> <button type="button" class="btn btn-ghost btn-square btn-xs"${attr("aria-label", editor_redo())}${attr("title", editor_redo())}>`);
    Redo($$renderer2, { class: "size-3.5" });
    $$renderer2.push(`<!----></button></div> <div class="min-h-[8rem] max-h-[24rem] overflow-y-auto p-3 text-sm prose prose-sm dark:prose-invert max-w-none focus-within:outline-none"></div></div>`);
    bind_props($$props, { html });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let toInput = "";
    let toIds = [];
    let subject = "";
    let body = "";
    let sending = false;
    const allUsers = data.allUsers;
    function displayName(u) {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
      return name ? `${name} (${u.username})` : u.username;
    }
    function recipientName(id) {
      const u = allUsers.find((u2) => u2.id === id);
      if (!u) return id;
      return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username;
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1390swk", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>${escape_html(messages_compose_title())}</title>`);
        });
      });
      $$renderer3.push(`<div class="max-w-2xl mx-auto p-6 space-y-4"><div class="flex items-center justify-between"><h1 class="text-lg font-semibold">${escape_html(messages_compose_title())}</h1> <a href="/messages" class="btn btn-ghost btn-sm btn-square"${attr("aria-label", common_cancel())}>`);
      X($$renderer3, { class: "size-5" });
      $$renderer3.push(`<!----></a></div> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="space-y-1"><label class="text-xs font-medium opacity-60 uppercase tracking-wide">${escape_html(messages_compose_to())}</label> <div class="flex flex-wrap gap-1.5 items-center border border-base-300 rounded px-2 py-1.5 min-h-[2.5rem]"><!--[-->`);
      const each_array = ensure_array_like(toIds);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let id = each_array[$$index];
        $$renderer3.push(`<span class="badge badge-primary badge-soft text-xs flex items-center gap-1">${escape_html(recipientName(id))} <button type="button" class="opacity-60 hover:opacity-100">`);
        X($$renderer3, { class: "size-3" });
        $$renderer3.push(`<!----></button></span>`);
      }
      $$renderer3.push(`<!--]--> <input type="text" class="flex-1 min-w-32 bg-transparent text-sm outline-none"${attr("placeholder", messages_compose_to_placeholder())} list="user-list"${attr("value", toInput)}/> <datalist id="user-list"><!--[-->`);
      const each_array_1 = ensure_array_like(allUsers.filter((u) => !toIds.includes(u.id)));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let u = each_array_1[$$index_1];
        $$renderer3.option({ value: u.username }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(displayName(u))}`);
        });
      }
      $$renderer3.push(`<!--]--></datalist></div></div> <div class="space-y-1"><label class="text-xs font-medium opacity-60 uppercase tracking-wide" for="subject">${escape_html(messages_compose_subject())}</label> <input id="subject" type="text" class="input w-full"${attr("placeholder", messages_compose_subject())}${attr("value", subject)} maxlength="200"/></div> <div class="space-y-1"><label class="text-xs font-medium opacity-60 uppercase tracking-wide">${escape_html(messages_compose_body())}</label> `);
      MessageEditor($$renderer3, {
        get html() {
          return body;
        },
        set html($$value) {
          body = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> <div class="flex justify-end"><button type="button" class="btn btn-primary"${attr("disabled", sending, true)}>`);
      Send($$renderer3, { class: "size-4" });
      $$renderer3.push(`<!----> ${escape_html(common_send())}</button></div></div>`);
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
