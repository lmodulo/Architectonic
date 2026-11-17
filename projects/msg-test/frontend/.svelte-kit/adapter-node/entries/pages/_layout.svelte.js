import { F as sanitize_props, G as spread_props, J as slot, K as stringify, N as head, O as attr_style, P as attr_class, Q as ensure_array_like, z as derived } from "../../chunks/index2.js";
import { A as Avatar } from "../../chunks/Avatar.js";
import { p as attr, k as escape_html } from "../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { S as Search, C as Chevron_right } from "../../chunks/search.js";
import { g as getLocale } from "../../chunks/runtime.js";
import { I as Icon } from "../../chunks/Icon.js";
import { C as Chevron_down } from "../../chunks/chevron-down.js";
import { M as Mail } from "../../chunks/mail.js";
import { B as Bell, U as Users } from "../../chunks/users.js";
import { p as page } from "../../chunks/index3.js";
import { h as hasPermission } from "../../chunks/permissions.js";
import { L as Logo } from "../../chunks/Logo.js";
import "clsx";
import { b as brand } from "../../chunks/logo2.js";
import { A as APP_THEME, a as APP_FONTS } from "../../chunks/theme.js";
import { X } from "../../chunks/x.js";
import { S as Settings } from "../../chunks/settings.js";
function Bot($$renderer, $$props) {
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
    ["path", { "d": "M12 8V4H8" }],
    [
      "rect",
      { "width": "16", "height": "12", "x": "4", "y": "8", "rx": "2" }
    ],
    ["path", { "d": "M2 14h2" }],
    ["path", { "d": "M20 14h2" }],
    ["path", { "d": "M15 13v2" }],
    ["path", { "d": "M9 13v2" }]
  ];
  Icon($$renderer, spread_props([
    { name: "bot" },
    $$sanitized_props,
    {
      /**
       * @component @name Bot
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgOFY0SDgiIC8+CiAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiB4PSI0IiB5PSI4IiByeD0iMiIgLz4KICA8cGF0aCBkPSJNMiAxNGgyIiAvPgogIDxwYXRoIGQ9Ik0yMCAxNGgyIiAvPgogIDxwYXRoIGQ9Ik0xNSAxM3YyIiAvPgogIDxwYXRoIGQ9Ik05IDEzdjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bot
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
function Building_2($$renderer, $$props) {
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
    ["path", { "d": "M10 12h4" }],
    ["path", { "d": "M10 8h4" }],
    ["path", { "d": "M14 21v-3a2 2 0 0 0-4 0v3" }],
    [
      "path",
      {
        "d": "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"
      }
    ],
    ["path", { "d": "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" }]
  ];
  Icon($$renderer, spread_props([
    { name: "building-2" },
    $$sanitized_props,
    {
      /**
       * @component @name Building2
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTJoNCIgLz4KICA8cGF0aCBkPSJNMTAgOGg0IiAvPgogIDxwYXRoIGQ9Ik0xNCAyMXYtM2EyIDIgMCAwIDAtNCAwdjMiIC8+CiAgPHBhdGggZD0iTTYgMTBINGEyIDIgMCAwIDAtMiAydjdhMiAyIDAgMCAwIDIgMmgxNmEyIDIgMCAwIDAgMi0yVjlhMiAyIDAgMCAwLTItMmgtMiIgLz4KICA8cGF0aCBkPSJNNiAyMVY1YTIgMiAwIDAgMSAyLTJoOGEyIDIgMCAwIDEgMiAydjE2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/building-2
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
function Circle_question_mark($$renderer, $$props) {
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
    ["circle", { "cx": "12", "cy": "12", "r": "10" }],
    ["path", { "d": "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
    ["path", { "d": "M12 17h.01" }]
  ];
  Icon($$renderer, spread_props([
    { name: "circle-question-mark" },
    $$sanitized_props,
    {
      /**
       * @component @name CircleQuestionMark
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4KICA8cGF0aCBkPSJNOS4wOSA5YTMgMyAwIDAgMSA1LjgzIDFjMCAyLTMgMy0zIDMiIC8+CiAgPHBhdGggZD0iTTEyIDE3aC4wMSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/circle-question-mark
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
function Folder_lock($$renderer, $$props) {
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
      { "width": "8", "height": "5", "x": "14", "y": "17", "rx": "1" }
    ],
    [
      "path",
      {
        "d": "M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5"
      }
    ],
    ["path", { "d": "M20 17v-2a2 2 0 1 0-4 0v2" }]
  ];
  Icon($$renderer, spread_props([
    { name: "folder-lock" },
    $$sanitized_props,
    {
      /**
       * @component @name FolderLock
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB4PSIxNCIgeT0iMTciIHJ4PSIxIiAvPgogIDxwYXRoIGQ9Ik0xMCAyMEg0YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDMuOWEyIDIgMCAwIDEgMS42OS45bC44MSAxLjJhMiAyIDAgMCAwIDEuNjcuOUgyMGEyIDIgMCAwIDEgMiAydjIuNSIgLz4KICA8cGF0aCBkPSJNMjAgMTd2LTJhMiAyIDAgMSAwLTQgMHYyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/folder-lock
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
function History($$renderer, $$props) {
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
      { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }
    ],
    ["path", { "d": "M3 3v5h5" }],
    ["path", { "d": "M12 7v5l4 2" }]
  ];
  Icon($$renderer, spread_props([
    { name: "history" },
    $$sanitized_props,
    {
      /**
       * @component @name History
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMyAxMmE5IDkgMCAxIDAgOS05IDkuNzUgOS43NSAwIDAgMC02Ljc0IDIuNzRMMyA4IiAvPgogIDxwYXRoIGQ9Ik0zIDN2NWg1IiAvPgogIDxwYXRoIGQ9Ik0xMiA3djVsNCAyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/history
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
function House($$renderer, $$props) {
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
      { "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }
    ],
    [
      "path",
      {
        "d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "house" },
    $$sanitized_props,
    {
      /**
       * @component @name House
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMjF2LThhMSAxIDAgMCAwLTEtMWgtNGExIDEgMCAwIDAtMSAxdjgiIC8+CiAgPHBhdGggZD0iTTMgMTBhMiAyIDAgMCAxIC43MDktMS41MjhsNy02YTIgMiAwIDAgMSAyLjU4MiAwbDcgNkEyIDIgMCAwIDEgMjEgMTB2OWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/house
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
function Log_out($$renderer, $$props) {
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
    ["path", { "d": "m16 17 5-5-5-5" }],
    ["path", { "d": "M21 12H9" }],
    ["path", { "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "log-out" },
    $$sanitized_props,
    {
      /**
       * @component @name LogOut
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTYgMTcgNS01LTUtNSIgLz4KICA8cGF0aCBkPSJNMjEgMTJIOSIgLz4KICA8cGF0aCBkPSJNOSAyMUg1YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/log-out
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
function Menu($$renderer, $$props) {
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
    ["path", { "d": "M4 5h16" }],
    ["path", { "d": "M4 12h16" }],
    ["path", { "d": "M4 19h16" }]
  ];
  Icon($$renderer, spread_props([
    { name: "menu" },
    $$sanitized_props,
    {
      /**
       * @component @name Menu
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCA1aDE2IiAvPgogIDxwYXRoIGQ9Ik00IDEyaDE2IiAvPgogIDxwYXRoIGQ9Ik00IDE5aDE2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/menu
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
function Pin_off($$renderer, $$props) {
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
    ["path", { "d": "M12 17v5" }],
    [
      "path",
      { "d": "M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" }
    ],
    ["path", { "d": "m2 2 20 20" }],
    [
      "path",
      {
        "d": "M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "pin-off" },
    $$sanitized_props,
    {
      /**
       * @component @name PinOff
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTd2NSIgLz4KICA8cGF0aCBkPSJNMTUgOS4zNFY3YTEgMSAwIDAgMSAxLTEgMiAyIDAgMCAwIDAtNEg3Ljg5IiAvPgogIDxwYXRoIGQ9Im0yIDIgMjAgMjAiIC8+CiAgPHBhdGggZD0iTTkgOXYxLjc2YTIgMiAwIDAgMS0xLjExIDEuNzlsLTEuNzguOUEyIDIgMCAwIDAgNSAxNS4yNFYxNmExIDEgMCAwIDAgMSAxaDExIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/pin-off
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
function User($$renderer, $$props) {
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
    ["path", { "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }],
    ["circle", { "cx": "12", "cy": "7", "r": "4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "user" },
    $$sanitized_props,
    {
      /**
       * @component @name User
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTkgMjF2LTJhNCA0IDAgMCAwLTQtNEg5YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/user
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
function Zap($$renderer, $$props) {
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
        "d": "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "zap" },
    $$sanitized_props,
    {
      /**
       * @component @name Zap
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNCAxNGExIDEgMCAwIDEtLjc4LTEuNjNsOS45LTEwLjJhLjUuNSAwIDAgMSAuODYuNDZsLTEuOTIgNi4wMkExIDEgMCAwIDAgMTMgMTBoN2ExIDEgMCAwIDEgLjc4IDEuNjNsLTkuOSAxMC4yYS41LjUgMCAwIDEtLjg2LS40NmwxLjkyLTYuMDJBMSAxIDAgMCAwIDExIDE0eiIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/zap
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
const en_nav_dashboard = (
  /** @type {(inputs: Nav_DashboardInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Dashboard`
    );
  }
);
const nav_dashboard = (
  /** @type {((inputs?: Nav_DashboardInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_DashboardInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_dashboard();
  })
);
const en_nav_messages = (
  /** @type {(inputs: Nav_MessagesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Messages`
    );
  }
);
const nav_messages = (
  /** @type {((inputs?: Nav_MessagesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_MessagesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_messages();
  })
);
const en_nav_notifications = (
  /** @type {(inputs: Nav_NotificationsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Notifications`
    );
  }
);
const nav_notifications = (
  /** @type {((inputs?: Nav_NotificationsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_NotificationsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_notifications();
  })
);
const en_nav_automation = (
  /** @type {(inputs: Nav_AutomationInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Automation`
    );
  }
);
const nav_automation = (
  /** @type {((inputs?: Nav_AutomationInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_AutomationInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_automation();
  })
);
const en_nav_workspace = (
  /** @type {(inputs: Nav_WorkspaceInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Workspace`
    );
  }
);
const nav_workspace = (
  /** @type {((inputs?: Nav_WorkspaceInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_WorkspaceInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_workspace();
  })
);
const en_nav_audit_log = (
  /** @type {(inputs: Nav_Audit_LogInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Audit Log`
    );
  }
);
const nav_audit_log = (
  /** @type {((inputs?: Nav_Audit_LogInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_Audit_LogInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_audit_log();
  })
);
const en_nav_vault = (
  /** @type {(inputs: Nav_VaultInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Vault`
    );
  }
);
const nav_vault = (
  /** @type {((inputs?: Nav_VaultInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_VaultInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_nav_vault();
  })
);
const en_layout_close_nav = (
  /** @type {(inputs: Layout_Close_NavInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Close navigation`
    );
  }
);
const layout_close_nav = (
  /** @type {((inputs?: Layout_Close_NavInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_Close_NavInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_close_nav();
  })
);
const en_layout_unpin_nav = (
  /** @type {(inputs: Layout_Unpin_NavInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Unpin navigation`
    );
  }
);
const layout_unpin_nav = (
  /** @type {((inputs?: Layout_Unpin_NavInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_Unpin_NavInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_unpin_nav();
  })
);
const en_layout_toggle_nav = (
  /** @type {(inputs: Layout_Toggle_NavInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Toggle navigation`
    );
  }
);
const layout_toggle_nav = (
  /** @type {((inputs?: Layout_Toggle_NavInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_Toggle_NavInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_toggle_nav();
  })
);
const en_layout_profile = (
  /** @type {(inputs: Layout_ProfileInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Profile`
    );
  }
);
const layout_profile = (
  /** @type {((inputs?: Layout_ProfileInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_ProfileInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_profile();
  })
);
const en_layout_user_management = (
  /** @type {(inputs: Layout_User_ManagementInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `User Management`
    );
  }
);
const layout_user_management = (
  /** @type {((inputs?: Layout_User_ManagementInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_User_ManagementInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_user_management();
  })
);
const en_layout_settings = (
  /** @type {(inputs: Layout_SettingsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Settings`
    );
  }
);
const layout_settings = (
  /** @type {((inputs?: Layout_SettingsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_SettingsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_settings();
  })
);
const en_layout_support = (
  /** @type {(inputs: Layout_SupportInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Support`
    );
  }
);
const layout_support = (
  /** @type {((inputs?: Layout_SupportInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_SupportInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_support();
  })
);
const en_layout_sign_out = (
  /** @type {(inputs: Layout_Sign_OutInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sign Out`
    );
  }
);
const layout_sign_out = (
  /** @type {((inputs?: Layout_Sign_OutInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Layout_Sign_OutInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_layout_sign_out();
  })
);
const en_assistant_open = (
  /** @type {(inputs: Assistant_OpenInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Open assistant`
    );
  }
);
const assistant_open = (
  /** @type {((inputs?: Assistant_OpenInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Assistant_OpenInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_assistant_open();
  })
);
const en_search_placeholder = (
  /** @type {(inputs: Search_PlaceholderInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Search…`
    );
  }
);
const search_placeholder = (
  /** @type {((inputs?: Search_PlaceholderInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Search_PlaceholderInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_search_placeholder();
  })
);
const en_workspace_switcher_fallback = (
  /** @type {(inputs: Workspace_Switcher_FallbackInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Workspace`
    );
  }
);
const workspace_switcher_fallback = (
  /** @type {((inputs?: Workspace_Switcher_FallbackInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Workspace_Switcher_FallbackInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_workspace_switcher_fallback();
  })
);
function GlobalSearch($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let query = "";
    $$renderer2.push(`<div class="relative flex-1 max-w-sm"><label class="input input-sm w-full flex items-center gap-2 bg-base-100 border-base-300">`);
    {
      $$renderer2.push("<!--[-1-->");
      Search($$renderer2, { class: "size-3.5 shrink-0 opacity-50" });
    }
    $$renderer2.push(`<!--]--> <input${attr("value", query)} type="search"${attr("placeholder", search_placeholder())} autocomplete="off" class="grow bg-transparent text-sm outline-none"/></label> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function WorkspaceSwitcher($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { workspaces, current } = $$props;
    let switching = false;
    if (workspaces.length > 1) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="relative"><button type="button" class="flex items-center gap-2 w-full px-3 py-2 rounded hover:bg-base-300/50 transition-colors text-sm"${attr("disabled", switching, true)}>`);
      Building_2($$renderer2, { class: "size-4 shrink-0 opacity-60" });
      $$renderer2.push(`<!----> <span class="flex-1 text-left truncate">${escape_html(current?.name ?? workspace_switcher_fallback())}</span> `);
      Chevron_down($$renderer2, {
        class: `size-3 opacity-40 transition-transform duration-200 ${stringify("")}`
      });
      $$renderer2.push(`<!----></button> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function isNavGroup(entry) {
  return "children" in entry;
}
function isSeparator(entry) {
  return "separator" in entry;
}
const navItems = [
  { label: nav_dashboard(), href: "/dashboard", icon: House },
  { label: nav_messages(), href: "/messages", icon: Mail, matchPrefix: true },
  { label: nav_notifications(), href: "/notifications", icon: Bell },
  { label: nav_automation(), href: "/settings/automation", icon: Zap, permission: { resource: "automation", action: "read" } },
  { label: nav_workspace(), href: "/settings/workspaces", icon: Building_2, permission: { resource: "workspaces", action: "read" } },
  { label: nav_audit_log(), href: "/audit-log", icon: History, permission: { resource: "audit", action: "read" } },
  { label: nav_vault(), href: "/vault", icon: Folder_lock, permission: { resource: "vault_documents", action: "read" } }
];
function ChatAssistant($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<button type="button" class="fixed bottom-6 right-6 z-50 btn btn-primary btn-circle shadow-lg size-12"${attr("aria-label", assistant_open())}>`);
    Bot($$renderer2, { class: "size-6" });
    $$renderer2.push(`<!----></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function UserCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const fontVars = [
      `--display:'${APP_FONTS.display.family}',${APP_FONTS.display.fallback}`,
      `--body:'${APP_FONTS.body.family}',${APP_FONTS.body.fallback}`,
      `--mono:'${APP_FONTS.mono.family}',${APP_FONTS.mono.fallback}`
    ].join(";");
    let { children, data } = $$props;
    let sidebarExpanded = false;
    const pathname = derived(() => page.url.pathname);
    let unreadCount = data.unreadCount ?? 0;
    let openGroups = {};
    let profileOpen = false;
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.appName ?? "Application")} — ${escape_html(brand.description)}</title>`);
      });
      if (APP_FONTS.preconnect) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(APP_FONTS.preconnect);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let href = each_array[$$index];
          $$renderer3.push(`<link rel="preconnect"${attr("href", href)} crossorigin=""/>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (APP_FONTS.cdnUrls) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(APP_FONTS.cdnUrls);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let href = each_array_1[$$index_1];
          $$renderer3.push(`<link rel="stylesheet"${attr("href", href)}/>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]-->`);
    });
    if (data.user) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<form method="POST" action="/logout" class="hidden"></form> <div${attr("data-theme", APP_THEME)}${attr_style(fontVars)} class="h-screen flex overflow-hidden">`);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <aside${attr_class(` fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden bg-base-200 border-r border-base-300 transition-[width,transform] duration-200 ease-in-out rounded-br-xl lg:static lg:translate-x-0 lg:mr-2 lg:mb-2 ${stringify("-translate-x-full")} ${stringify("w-64 lg:w-[67px]")} `)}><div class="relative flex items-center gap-2 px-4 h-16 shrink-0"><a href="/dashboard"${attr_class(`flex items-center gap-2 flex-1 min-w-0 no-underline text-inherit transition-opacity duration-150 ${stringify("lg:opacity-0 lg:pointer-events-none")}`)}>`);
      Logo($$renderer2, {
        brandName: data.brandName ?? "",
        brandLogo: data.brandLogo ?? ""
      });
      $$renderer2.push(`<!----></a> <a href="/dashboard"${attr_class(`hidden lg:flex absolute inset-0 items-center justify-center no-underline transition-opacity duration-150 ${stringify("opacity-100")}`)} aria-hidden="true"${attr("tabindex", 0)}><span style="font-family: var(--display); background: radial-gradient(circle, color-mix(in oklch, var(--color-primary) 20%, transparent) 0%, transparent 70%);" class="text-3xl font-bold text-base-content select-none w-10 h-10 flex items-center justify-center rounded-full">A</span></a> <button type="button" class="btn btn-ghost btn-sm btn-square lg:hidden shrink-0"${attr("aria-label", layout_close_nav())}>`);
      X($$renderer2, { class: "size-4" });
      $$renderer2.push(`<!----></button> <button type="button"${attr_class(`hidden lg:flex btn btn-ghost btn-sm btn-square shrink-0 transition-opacity duration-150 ${stringify("opacity-0 pointer-events-none")}`)}${attr("aria-label", layout_unpin_nav())}>`);
      {
        $$renderer2.push("<!--[0-->");
        Pin_off($$renderer2, { class: "size-3.5" });
      }
      $$renderer2.push(`<!--]--></button></div> `);
      if (data.user?.role !== "customer") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr_class(`border-b border-base-300 px-2 py-2 transition-opacity duration-150 overflow-hidden ${stringify("lg:opacity-0 lg:pointer-events-none")}`)}>`);
        WorkspaceSwitcher($$renderer2, {
          workspaces: data.userWorkspaces ?? [],
          current: data.currentWorkspace ?? null
        });
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <nav class="flex-1 overflow-y-auto p-3"><ul class="flex flex-col gap-0.5"><!--[-->`);
      const each_array_2 = ensure_array_like(navItems.filter((entry) => {
        if (!data.user) return false;
        const isCustomer = data.user.role === "customer";
        if (isCustomer) return "customerOnly" in entry && entry.customerOnly;
        return !("customerOnly" in entry) || !entry.customerOnly;
      }));
      for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
        let entry = each_array_2[$$index_3];
        if (isSeparator(entry)) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<li><div class="border-t border-base-300/50 my-1"></div></li>`);
        } else if (isNavGroup(entry)) {
          $$renderer2.push("<!--[1-->");
          const anyChildActive = entry.children.some((c) => pathname().startsWith(c.href));
          const isOpen = openGroups[entry.label] ?? false;
          const GroupIcon = entry.icon;
          $$renderer2.push(`<li><button type="button"${attr_class(`flex items-center gap-3 p-3 rounded w-full text-sm ${stringify(anyChildActive ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
          if (GroupIcon) {
            $$renderer2.push("<!--[-->");
            GroupIcon($$renderer2, { class: "size-4 shrink-0" });
            $$renderer2.push("<!--]-->");
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push("<!--]-->");
          }
          $$renderer2.push(` <span${attr_class(`flex-1 text-left whitespace-nowrap transition-opacity duration-150 ${stringify("lg:opacity-0")}`)}>${escape_html(entry.label)}</span> `);
          if (isOpen) {
            $$renderer2.push("<!--[0-->");
            Chevron_down($$renderer2, {
              class: `size-3 opacity-40 transition-opacity duration-150 ${stringify("lg:opacity-0")}`
            });
          } else {
            $$renderer2.push("<!--[-1-->");
            Chevron_right($$renderer2, {
              class: `size-3 opacity-40 transition-opacity duration-150 ${stringify("lg:opacity-0")}`
            });
          }
          $$renderer2.push(`<!--]--></button> <div${attr_class("nav-subnav svelte-12qhfyh", void 0, {
            "nav-subnav-open": isOpen && sidebarExpanded
          })}><div class="nav-subnav-inner svelte-12qhfyh"><!--[-->`);
          const each_array_3 = ensure_array_like(entry.children);
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let child = each_array_3[$$index_2];
            if (!child.permission || hasPermission(data.user, child.permission.resource, child.permission.action)) {
              $$renderer2.push("<!--[0-->");
              const ChildIcon = child.icon;
              $$renderer2.push(`<a${attr("href", child.href)}${attr_class(`flex items-center gap-3 pl-9 pr-3 py-2 rounded text-sm ${stringify(pathname().startsWith(child.href) ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
              if (ChildIcon) {
                $$renderer2.push("<!--[-->");
                ChildIcon($$renderer2, { class: "size-3.5 shrink-0 opacity-70" });
                $$renderer2.push("<!--]-->");
              } else {
                $$renderer2.push("<!--[!-->");
                $$renderer2.push("<!--]-->");
              }
              $$renderer2.push(` ${escape_html(child.label)}</a>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]--></div></div></li>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          if (!entry.permission || hasPermission(data.user, entry.permission.resource, entry.permission.action)) {
            $$renderer2.push("<!--[0-->");
            const Icon2 = entry.icon;
            $$renderer2.push(`<li><a${attr("href", entry.href)}${attr_class(`flex items-center gap-3 p-3 rounded ${stringify((entry.matchPrefix ? pathname().startsWith(entry.href) : pathname() === entry.href) ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
            if (Icon2) {
              $$renderer2.push("<!--[-->");
              Icon2($$renderer2, { class: "size-4 shrink-0" });
              $$renderer2.push("<!--]-->");
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push("<!--]-->");
            }
            $$renderer2.push(` <span${attr_class(`text-sm flex-1 whitespace-nowrap transition-opacity duration-150 ${stringify("lg:opacity-0")}`)}>${escape_html(entry.label)}</span></a></li>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></ul></nav> <div class="border-t border-base-300 p-2 flex flex-col gap-0.5"><div><button type="button" class="flex items-center gap-3 w-full px-3 py-2 rounded hover:bg-base-300/50 transition-colors">`);
      Avatar($$renderer2, { user: data.user, size: "sm" });
      $$renderer2.push(`<!----> <div${attr_class(`flex-1 min-w-0 text-left overflow-hidden transition-opacity duration-150 ${stringify("lg:opacity-0")}`)}><p class="text-sm font-medium truncate leading-tight">${escape_html(data.user.firstName && data.user.lastName ? `${data.user.firstName} ${data.user.lastName}` : data.user.username)}</p> <p class="text-xs opacity-50 truncate leading-tight">${escape_html(data.user.username)}</p></div> `);
      Chevron_down($$renderer2, {
        class: `size-3 opacity-40 transition-[transform,opacity] duration-200 ${stringify("")} ${stringify("lg:opacity-0")}`
      });
      $$renderer2.push(`<!----></button> <div${attr_class("nav-subnav svelte-12qhfyh", void 0, {
        "nav-subnav-open": profileOpen
      })}><div class="nav-subnav-inner pt-1 svelte-12qhfyh"><a href="/profile"${attr_class(`flex items-center gap-3 px-3 py-2 rounded text-sm ${stringify(pathname() === "/profile" ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
      User($$renderer2, { class: "size-4 shrink-0" });
      $$renderer2.push(`<!----> <span>${escape_html(layout_profile())}</span></a> `);
      if (hasPermission(data.user, "users", "read") || hasPermission(data.user, "roles", "read")) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a href="/user-management"${attr_class(`flex items-center gap-3 px-3 py-2 rounded text-sm ${stringify(pathname() === "/user-management" ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
        Users($$renderer2, { class: "size-4 shrink-0" });
        $$renderer2.push(`<!----> <span>${escape_html(layout_user_management())}</span></a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (hasPermission(data.user, "settings", "read")) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a href="/settings"${attr_class(`flex items-center gap-3 px-3 py-2 rounded text-sm ${stringify(pathname() === "/settings" ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
        Settings($$renderer2, { class: "size-4 shrink-0" });
        $$renderer2.push(`<!----> <span>${escape_html(layout_settings())}</span></a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="border-t border-base-300/50 my-1"></div> <a href="/documentation"${attr_class(`flex items-center gap-3 px-3 py-2 rounded text-sm ${stringify(pathname().startsWith("/documentation") ? "bg-primary text-primary-content" : "hover:bg-base-300/50")}`)}>`);
      Circle_question_mark($$renderer2, { class: "size-4 shrink-0" });
      $$renderer2.push(`<!----> <span>${escape_html(layout_support())}</span></a> <div class="border-t border-base-300/50 my-1"></div> <button type="button" class="flex items-center gap-3 w-full px-3 py-2 rounded text-sm text-error hover:bg-error/10 transition-colors">`);
      Log_out($$renderer2, { class: "size-4 shrink-0" });
      $$renderer2.push(`<!----> <span>${escape_html(layout_sign_out())}</span></button></div></div></div></div></aside> <div class="relative flex flex-col flex-1 min-w-0 overflow-hidden"><header class="flex items-center gap-3 px-4 h-16 shrink-0 bg-base-200 rounded-br-xl"><button type="button" class="btn btn-ghost btn-sm btn-square lg:hidden"${attr("aria-label", layout_toggle_nav())}>`);
      Menu($$renderer2, { class: "size-5" });
      $$renderer2.push(`<!----></button> <div${attr_class(`hidden lg:grid h-16 items-center transition-[grid-template-columns] duration-200 ease-in-out ${stringify("grid-cols-[1fr]")}`)}><div class="overflow-hidden h-full flex items-center"><div class="flex items-center gap-3 pr-0.5"><a href="/dashboard" class="flex items-center no-underline text-inherit">`);
      Logo($$renderer2, {
        brandName: data.brandName ?? "",
        brandLogo: data.brandLogo ?? ""
      });
      $$renderer2.push(`<!----></a></div></div></div> <div class="flex-1"></div> `);
      if (data.user?.role !== "customer") {
        $$renderer2.push("<!--[0-->");
        GlobalSearch($$renderer2);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="w-px h-5 bg-base-300 shrink-0"></div> <div class="flex items-center gap-1"><div class="tooltip tooltip-bottom"${attr("data-tip", nav_messages())}><a href="/messages" class="btn btn-ghost btn-sm btn-square relative">`);
      Mail($$renderer2, { class: "size-4" });
      $$renderer2.push(`<!----> `);
      if (unreadCount > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="bg-error absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[2px] rounded-full text-[10px] leading-[14px] text-center text-error-content">${escape_html(unreadCount > 99 ? "99+" : unreadCount)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></a></div> <div class="tooltip tooltip-bottom"${attr("data-tip", nav_notifications())}><a href="/notifications" class="btn btn-ghost btn-sm btn-square relative">`);
      Bell($$renderer2, { class: "size-4" });
      $$renderer2.push(`<!----> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></a></div></div> <div${attr_class(`hidden lg:grid transition-[grid-template-columns] duration-200 ease-in-out ${stringify("grid-cols-[1fr]")}`)}><div class="overflow-hidden"><div class="pl-0.5"><div class="w-px h-5 bg-base-300 shrink-0"></div></div></div></div></header> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <main class="flex-1 overflow-y-auto overflow-x-hidden"><!---->`);
      {
        $$renderer2.push(`<div${attr_class(`container mx-auto px-6 pb-6 max-w-5xl page-content transition-[opacity,filter] duration-200 ${stringify("")}`)}>`);
        children($$renderer2);
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!----></main></div></div> <div${attr("data-theme", APP_THEME)} style="display:contents">`);
      UserCard($$renderer2);
      $$renderer2.push(`<!----></div> `);
      if (data.chatEnabled) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div${attr("data-theme", APP_THEME)} style="display:contents">`);
        ChatAssistant($$renderer2);
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _layout as default
};
