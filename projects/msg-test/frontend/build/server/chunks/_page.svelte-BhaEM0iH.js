import { V as head, Y as attr_class, _ as stringify, Z as ensure_array_like, X as attr_style, $ as sanitize_props, a0 as spread_props, a1 as slot, N as derived } from './index2-827svAZg.js';
import { k as escape_html, q as attr } from './attributes-CkcQfCjx.js';
import { P as PageHeader } from './PageHeader-B2BNqFeB.js';
import { P as Pagination, C as Chevron_left } from './Pagination-CHW2cbsH.js';
import { h as hasPermission } from './permissions-DOm5Hx0d.js';
import '@tiptap/starter-kit';
import '@tiptap/extension-underline';
import '@tiptap/extension-placeholder';
import { I as Icon } from './Icon-B4lj6fY_.js';
import { S as Search, C as Chevron_right } from './search-BLI_XRrd.js';
import { P as Plus } from './plus-BxLzpxr0.js';
import { S as Shopping_cart } from './shopping-cart-DCOHUX_Q.js';
import { g as getLocale } from './runtime-D3odmjxS.js';

function Dollar_sign($$renderer, $$props) {
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
    ["line", { "x1": "12", "x2": "12", "y1": "2", "y2": "22" }],
    [
      "path",
      { "d": "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "dollar-sign" },
    $$sanitized_props,
    {
      /**
       * @component @name DollarSign
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8bGluZSB4MT0iMTIiIHgyPSIxMiIgeTE9IjIiIHkyPSIyMiIgLz4KICA8cGF0aCBkPSJNMTcgNUg5LjVhMy41IDMuNSAwIDAgMCAwIDdoNWEzLjUgMy41IDAgMCAxIDAgN0g2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/dollar-sign
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
function Layout_dashboard($$renderer, $$props) {
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
      { "width": "7", "height": "9", "x": "3", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "14", "y": "3", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "9", "x": "14", "y": "12", "rx": "1" }
    ],
    [
      "rect",
      { "width": "7", "height": "5", "x": "3", "y": "16", "rx": "1" }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "layout-dashboard" },
    $$sanitized_props,
    {
      /**
       * @component @name LayoutDashboard
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI5IiB4PSIzIiB5PSIzIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIxNCIgeT0iMyIgcng9IjEiIC8+CiAgPHJlY3Qgd2lkdGg9IjciIGhlaWdodD0iOSIgeD0iMTQiIHk9IjEyIiByeD0iMSIgLz4KICA8cmVjdCB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4PSIzIiB5PSIxNiIgcng9IjEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/layout-dashboard
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
function Map_pin($$renderer, $$props) {
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
        "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      }
    ],
    ["circle", { "cx": "12", "cy": "10", "r": "3" }]
  ];
  Icon($$renderer, spread_props([
    { name: "map-pin" },
    $$sanitized_props,
    {
      /**
       * @component @name MapPin
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjAgMTBjMCA0Ljk5My01LjUzOSAxMC4xOTMtNy4zOTkgMTEuNzk5YTEgMSAwIDAgMS0xLjIwMiAwQzkuNTM5IDIwLjE5MyA0IDE0Ljk5MyA0IDEwYTggOCAwIDAgMSAxNiAwIiAvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/map-pin
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
function Trending_up($$renderer, $$props) {
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
    ["path", { "d": "M16 7h6v6" }],
    ["path", { "d": "m22 7-8.5 8.5-5-5L2 17" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trending-up" },
    $$sanitized_props,
    {
      /**
       * @component @name TrendingUp
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgN2g2djYiIC8+CiAgPHBhdGggZD0ibTIyIDctOC41IDguNS01LTVMMiAxNyIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/trending-up
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
const en_dashboard_title = (
  /** @type {(inputs: Dashboard_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Dashboard`
    );
  }
);
const dashboard_title = (
  /** @type {((inputs?: Dashboard_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_title();
  })
);
const en_dashboard_welcome = (
  /** @type {(inputs: Dashboard_WelcomeInputs) => LocalizedString} */
  (i) => {
    return (
      /** @type {LocalizedString} */
      `Welcome back, ${i?.firstName} — last 90 days of sales activity`
    );
  }
);
const dashboard_welcome = (
  /** @type {((inputs: Dashboard_WelcomeInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_WelcomeInputs, { locale?: "en" }, {}>} */
  ((inputs, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_welcome(inputs);
  })
);
const en_dashboard_edit_layout = (
  /** @type {(inputs: Dashboard_Edit_LayoutInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Edit Layout`
    );
  }
);
const dashboard_edit_layout = (
  /** @type {((inputs?: Dashboard_Edit_LayoutInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Edit_LayoutInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_edit_layout();
  })
);
const en_dashboard_section_sales = (
  /** @type {(inputs: Dashboard_Section_SalesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sales Records`
    );
  }
);
const dashboard_section_sales = (
  /** @type {((inputs?: Dashboard_Section_SalesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Section_SalesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_section_sales();
  })
);
const en_dashboard_section_calendar = (
  /** @type {(inputs: Dashboard_Section_CalendarInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Order Calendar`
    );
  }
);
const dashboard_section_calendar = (
  /** @type {((inputs?: Dashboard_Section_CalendarInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Section_CalendarInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_section_calendar();
  })
);
const en_dashboard_sales_search = (
  /** @type {(inputs: Dashboard_Sales_SearchInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Search by ID, product, region, or status…`
    );
  }
);
const dashboard_sales_search = (
  /** @type {((inputs?: Dashboard_Sales_SearchInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Sales_SearchInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_sales_search();
  })
);
const en_dashboard_col_order = (
  /** @type {(inputs: Dashboard_Col_OrderInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Order`
    );
  }
);
const dashboard_col_order = (
  /** @type {((inputs?: Dashboard_Col_OrderInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_OrderInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_order();
  })
);
const en_dashboard_col_date = (
  /** @type {(inputs: Dashboard_Col_DateInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Date`
    );
  }
);
const dashboard_col_date = (
  /** @type {((inputs?: Dashboard_Col_DateInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_DateInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_date();
  })
);
const en_dashboard_col_product = (
  /** @type {(inputs: Dashboard_Col_ProductInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Product`
    );
  }
);
const dashboard_col_product = (
  /** @type {((inputs?: Dashboard_Col_ProductInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_ProductInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_product();
  })
);
const en_dashboard_col_region = (
  /** @type {(inputs: Dashboard_Col_RegionInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Region`
    );
  }
);
const dashboard_col_region = (
  /** @type {((inputs?: Dashboard_Col_RegionInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_RegionInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_region();
  })
);
const en_dashboard_col_units = (
  /** @type {(inputs: Dashboard_Col_UnitsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Units`
    );
  }
);
const dashboard_col_units = (
  /** @type {((inputs?: Dashboard_Col_UnitsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_UnitsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_units();
  })
);
const en_dashboard_col_revenue = (
  /** @type {(inputs: Dashboard_Col_RevenueInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Revenue`
    );
  }
);
const dashboard_col_revenue = (
  /** @type {((inputs?: Dashboard_Col_RevenueInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_RevenueInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_revenue();
  })
);
const en_dashboard_col_status = (
  /** @type {(inputs: Dashboard_Col_StatusInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Status`
    );
  }
);
const dashboard_col_status = (
  /** @type {((inputs?: Dashboard_Col_StatusInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Col_StatusInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_col_status();
  })
);
const en_dashboard_no_records = (
  /** @type {(inputs: Dashboard_No_RecordsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No records found.`
    );
  }
);
const dashboard_no_records = (
  /** @type {((inputs?: Dashboard_No_RecordsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_No_RecordsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_no_records();
  })
);
const en_dashboard_calendar_search = (
  /** @type {(inputs: Dashboard_Calendar_SearchInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Search events by title…`
    );
  }
);
const dashboard_calendar_search = (
  /** @type {((inputs?: Dashboard_Calendar_SearchInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Calendar_SearchInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_calendar_search();
  })
);
const en_dashboard_new_event = (
  /** @type {(inputs: Dashboard_New_EventInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `New Event`
    );
  }
);
const dashboard_new_event = (
  /** @type {((inputs?: Dashboard_New_EventInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_New_EventInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_new_event();
  })
);
const en_dashboard_prev_month = (
  /** @type {(inputs: Dashboard_Prev_MonthInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Previous month`
    );
  }
);
const dashboard_prev_month = (
  /** @type {((inputs?: Dashboard_Prev_MonthInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Prev_MonthInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_prev_month();
  })
);
const en_dashboard_next_month = (
  /** @type {(inputs: Dashboard_Next_MonthInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Next month`
    );
  }
);
const dashboard_next_month = (
  /** @type {((inputs?: Dashboard_Next_MonthInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Next_MonthInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_next_month();
  })
);
const en_dashboard_day_sun = (
  /** @type {(inputs: Dashboard_Day_SunInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sun`
    );
  }
);
const dashboard_day_sun = (
  /** @type {((inputs?: Dashboard_Day_SunInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_SunInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_sun();
  })
);
const en_dashboard_day_mon = (
  /** @type {(inputs: Dashboard_Day_MonInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Mon`
    );
  }
);
const dashboard_day_mon = (
  /** @type {((inputs?: Dashboard_Day_MonInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_MonInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_mon();
  })
);
const en_dashboard_day_tue = (
  /** @type {(inputs: Dashboard_Day_TueInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Tue`
    );
  }
);
const dashboard_day_tue = (
  /** @type {((inputs?: Dashboard_Day_TueInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_TueInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_tue();
  })
);
const en_dashboard_day_wed = (
  /** @type {(inputs: Dashboard_Day_WedInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Wed`
    );
  }
);
const dashboard_day_wed = (
  /** @type {((inputs?: Dashboard_Day_WedInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_WedInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_wed();
  })
);
const en_dashboard_day_thu = (
  /** @type {(inputs: Dashboard_Day_ThuInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Thu`
    );
  }
);
const dashboard_day_thu = (
  /** @type {((inputs?: Dashboard_Day_ThuInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_ThuInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_thu();
  })
);
const en_dashboard_day_fri = (
  /** @type {(inputs: Dashboard_Day_FriInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Fri`
    );
  }
);
const dashboard_day_fri = (
  /** @type {((inputs?: Dashboard_Day_FriInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_FriInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_fri();
  })
);
const en_dashboard_day_sat = (
  /** @type {(inputs: Dashboard_Day_SatInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sat`
    );
  }
);
const dashboard_day_sat = (
  /** @type {((inputs?: Dashboard_Day_SatInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Day_SatInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_day_sat();
  })
);
const en_dashboard_chart_daily_revenue = (
  /** @type {(inputs: Dashboard_Chart_Daily_RevenueInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Daily Revenue — Last 30 Days`
    );
  }
);
const dashboard_chart_daily_revenue = (
  /** @type {((inputs?: Dashboard_Chart_Daily_RevenueInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Chart_Daily_RevenueInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_chart_daily_revenue();
  })
);
const en_dashboard_chart_revenue_product = (
  /** @type {(inputs: Dashboard_Chart_Revenue_ProductInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Revenue by Product`
    );
  }
);
const dashboard_chart_revenue_product = (
  /** @type {((inputs?: Dashboard_Chart_Revenue_ProductInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Chart_Revenue_ProductInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_chart_revenue_product();
  })
);
const en_dashboard_chart_orders_region = (
  /** @type {(inputs: Dashboard_Chart_Orders_RegionInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Orders by Region`
    );
  }
);
const dashboard_chart_orders_region = (
  /** @type {((inputs?: Dashboard_Chart_Orders_RegionInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Chart_Orders_RegionInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_chart_orders_region();
  })
);
const en_dashboard_chart_monthly_revenue = (
  /** @type {(inputs: Dashboard_Chart_Monthly_RevenueInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Monthly Revenue — Last 12 Months`
    );
  }
);
const dashboard_chart_monthly_revenue = (
  /** @type {((inputs?: Dashboard_Chart_Monthly_RevenueInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Chart_Monthly_RevenueInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_chart_monthly_revenue();
  })
);
const en_dashboard_kpi_total_revenue = (
  /** @type {(inputs: Dashboard_Kpi_Total_RevenueInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Total Revenue`
    );
  }
);
const dashboard_kpi_total_revenue = (
  /** @type {((inputs?: Dashboard_Kpi_Total_RevenueInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Total_RevenueInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_total_revenue();
  })
);
const en_dashboard_kpi_total_orders = (
  /** @type {(inputs: Dashboard_Kpi_Total_OrdersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Total Orders`
    );
  }
);
const dashboard_kpi_total_orders = (
  /** @type {((inputs?: Dashboard_Kpi_Total_OrdersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Total_OrdersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_total_orders();
  })
);
const en_dashboard_kpi_avg_order = (
  /** @type {(inputs: Dashboard_Kpi_Avg_OrderInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Avg Order Value`
    );
  }
);
const dashboard_kpi_avg_order = (
  /** @type {((inputs?: Dashboard_Kpi_Avg_OrderInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Avg_OrderInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_avg_order();
  })
);
const en_dashboard_kpi_top_region = (
  /** @type {(inputs: Dashboard_Kpi_Top_RegionInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Top Region`
    );
  }
);
const dashboard_kpi_top_region = (
  /** @type {((inputs?: Dashboard_Kpi_Top_RegionInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Top_RegionInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_top_region();
  })
);
const en_dashboard_kpi_sub_period = (
  /** @type {(inputs: Dashboard_Kpi_Sub_PeriodInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `90-day period`
    );
  }
);
const dashboard_kpi_sub_period = (
  /** @type {((inputs?: Dashboard_Kpi_Sub_PeriodInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Sub_PeriodInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_sub_period();
  })
);
const en_dashboard_kpi_sub_regions = (
  /** @type {(inputs: Dashboard_Kpi_Sub_RegionsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `across all regions`
    );
  }
);
const dashboard_kpi_sub_regions = (
  /** @type {((inputs?: Dashboard_Kpi_Sub_RegionsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Sub_RegionsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_sub_regions();
  })
);
const en_dashboard_kpi_sub_transaction = (
  /** @type {(inputs: Dashboard_Kpi_Sub_TransactionInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `per transaction`
    );
  }
);
const dashboard_kpi_sub_transaction = (
  /** @type {((inputs?: Dashboard_Kpi_Sub_TransactionInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Sub_TransactionInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_sub_transaction();
  })
);
const en_dashboard_kpi_sub_volume = (
  /** @type {(inputs: Dashboard_Kpi_Sub_VolumeInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `by order volume`
    );
  }
);
const dashboard_kpi_sub_volume = (
  /** @type {((inputs?: Dashboard_Kpi_Sub_VolumeInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Kpi_Sub_VolumeInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_dashboard_kpi_sub_volume();
  })
);
const dashboardWidgets = [];
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    function defaultLayout() {
      return {
        sections: [
          {
            id: "kpi",
            visible: true,
            items: [
              { id: "revenue", visible: true },
              { id: "orders", visible: true },
              { id: "avg-order", visible: true },
              { id: "top-region", visible: true }
            ]
          },
          {
            id: "charts",
            visible: true,
            items: [
              { id: "daily-revenue", visible: true },
              { id: "product-revenue", visible: true },
              { id: "region-orders", visible: true },
              { id: "monthly-revenue", visible: true }
            ]
          },
          { id: "sales-table", visible: true },
          { id: "calendar", visible: true },
          { id: "widgets", visible: true }
        ]
      };
    }
    function makeRng(seed) {
      let s = seed >>> 0;
      return () => {
        s = Math.imul(1664525, s) + 1013904223 >>> 0;
        return s / 4294967296;
      };
    }
    const rng = makeRng(8675309);
    const PRODUCTS = [
      "Software License",
      "Consulting",
      "Support Plan",
      "Training",
      "Hardware"
    ];
    const REGIONS = ["North", "South", "East", "West", "International"];
    const STATUSES = ["Completed", "Completed", "Completed", "Pending", "Refunded"];
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const allSales = Array.from({ length: 90 }, (_, i) => {
      const daysAgo = Math.floor(rng() * 90);
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return {
        id: `ORD-${1e3 + i}`,
        date: d,
        product: PRODUCTS[Math.floor(rng() * PRODUCTS.length)],
        region: REGIONS[Math.floor(rng() * REGIONS.length)],
        revenue: Math.round((rng() * 8500 + 500) * 100) / 100,
        units: Math.floor(rng() * 20) + 1,
        status: STATUSES[Math.floor(rng() * STATUSES.length)]
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
    const totalRevenue = allSales.reduce((s, r) => s + r.revenue, 0);
    const totalOrders = allSales.length;
    const avgOrder = totalRevenue / totalOrders;
    const topRegion = [...REGIONS].sort((a, b) => allSales.filter((s) => s.region === b).length - allSales.filter((s) => s.region === a).length)[0];
    const fmt = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
    const KPI_DEFS = derived(() => [
      {
        id: "revenue",
        label: dashboard_kpi_total_revenue(),
        value: fmt(totalRevenue),
        sub: dashboard_kpi_sub_period(),
        icon: Dollar_sign,
        color: "primary"
      },
      {
        id: "orders",
        label: dashboard_kpi_total_orders(),
        value: String(totalOrders),
        sub: dashboard_kpi_sub_regions(),
        icon: Shopping_cart,
        color: "secondary"
      },
      {
        id: "avg-order",
        label: dashboard_kpi_avg_order(),
        value: fmt(avgOrder),
        sub: dashboard_kpi_sub_transaction(),
        icon: Trending_up,
        color: "success"
      },
      {
        id: "top-region",
        label: dashboard_kpi_top_region(),
        value: topRegion,
        sub: dashboard_kpi_sub_volume(),
        icon: Map_pin,
        color: "warning"
      }
    ]);
    const dailyData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: allSales.filter((s) => s.date.toDateString() === d.toDateString()).reduce((a, s) => a + s.revenue, 0)
      };
    });
    const productData = PRODUCTS.map((p) => ({
      label: p,
      value: allSales.filter((s) => s.product === p).reduce((a, s) => a + s.revenue, 0)
    })).sort((a, b) => b.value - a.value);
    const regionData = REGIONS.map((r) => ({
      label: r,
      value: allSales.filter((s) => s.region === r).length
    }));
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      return {
        label: d.toLocaleString("en-US", { month: "short" }),
        value: allSales.filter((s) => s.date.getFullYear() === d.getFullYear() && s.date.getMonth() === d.getMonth()).reduce((a, s) => a + s.revenue, 0)
      };
    });
    function linePoints(pts, w = 480, h = 140, p = 16) {
      const mx = Math.max(...pts.map((d) => d.value), 1);
      return pts.map((d, i) => `${(p + i / (pts.length - 1) * (w - p * 2)).toFixed(1)},${(h - p - d.value / mx * (h - p * 2)).toFixed(1)}`).join(" ");
    }
    function areaPath(pts, w = 480, h = 140, p = 16) {
      const mx = Math.max(...pts.map((d) => d.value), 1);
      const coords = pts.map((d, i) => ({
        x: p + i / (pts.length - 1) * (w - p * 2),
        y: h - p - d.value / mx * (h - p * 2)
      }));
      const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L ");
      return `M${coords[0].x.toFixed(1)},${(h - p).toFixed(1)} L ${line} L${coords[coords.length - 1].x.toFixed(1)},${(h - p).toFixed(1)}Z`;
    }
    function hBars(pts, w = 460, h = 165, lblW = 118, p = 10) {
      const mx = Math.max(...pts.map((d) => d.value), 1);
      const rowH = (h - p * 2) / pts.length;
      return pts.map((d, i) => ({
        ...d,
        x: lblW,
        y: p + i * rowH + rowH * 0.12,
        w: d.value / mx * (w - lblW - p),
        bh: rowH * 0.76,
        midY: p + i * rowH + rowH / 2
      }));
    }
    const DONUT_COLORS = ["primary", "secondary", "success", "warning", "error"];
    function donutSegs(pts, cx = 90, cy = 90, r = 78, ir = 48) {
      const total = pts.reduce((s, d) => s + d.value, 0) || 1;
      let a = -Math.PI / 2;
      return pts.map((d, i) => {
        const sw = d.value / total * Math.PI * 2;
        const [x1, y1] = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        const [x2, y2] = [cx + r * Math.cos(a + sw), cy + r * Math.sin(a + sw)];
        const [xi1, yi1] = [cx + ir * Math.cos(a + sw), cy + ir * Math.sin(a + sw)];
        const [xi2, yi2] = [cx + ir * Math.cos(a), cy + ir * Math.sin(a)];
        const lg = sw > Math.PI ? 1 : 0;
        const path = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi1.toFixed(2)},${yi1.toFixed(2)} A${ir},${ir} 0 ${lg} 0 ${xi2.toFixed(2)},${yi2.toFixed(2)}Z`;
        a += sw;
        return {
          path,
          color: `var(--color-${DONUT_COLORS[i % 5]}-500)`,
          label: d.label,
          pct: Math.round(d.value / total * 100),
          value: d.value
        };
      });
    }
    const bars = hBars(productData);
    const segs = donutSegs(regionData);
    let query = "";
    let currentPage = 1;
    const PAGE_SIZE = 10;
    const filtered = derived(() => query.trim() ? allSales.filter((s) => s.id.toLowerCase().includes(query.toLowerCase()) || s.product.toLowerCase().includes(query.toLowerCase()) || s.region.toLowerCase().includes(query.toLowerCase()) || s.status.toLowerCase().includes(query.toLowerCase())) : allSales);
    const pageRows = derived(() => filtered().slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
    const STATUS_CLS = {
      Completed: "badge-success",
      Pending: "badge-warning",
      Refunded: "badge-error"
    };
    let calYear = today.getFullYear();
    let calMonth = today.getMonth();
    function buildCal(year, month) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDow = new Date(year, month, 1).getDay();
      const cells = Math.ceil((startDow + daysInMonth) / 7) * 7;
      return Array.from({ length: cells }, (_, i) => {
        const day = i - startDow + 1;
        if (day < 1 || day > daysInMonth) return null;
        const d = new Date(year, month, day);
        const ds = allSales.filter((s) => s.date.toDateString() === d.toDateString());
        return {
          day,
          isToday: d.toDateString() === today.toDateString(),
          count: ds.length,
          revenue: ds.reduce((a, s) => a + s.revenue, 0)
        };
      });
    }
    const calDays = derived(() => buildCal(calYear, calMonth));
    const calLabel = derived(() => new Date(calYear, calMonth, 1).toLocaleString("en-US", { month: "long", year: "numeric" }));
    const maxDayRevenue = derived(() => Math.max(...calDays().filter(Boolean).map((d) => d.revenue), 1));
    function toDateStr(val) {
      if (!val) return "";
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
    }
    let events = (data.events ?? []).map((e) => ({
      id: String(e.id ?? ""),
      title: String(e.title ?? ""),
      content: String(e.content ?? ""),
      startDate: toDateStr(e.startDate),
      endDate: toDateStr(e.endDate),
      singleDay: Boolean(e.singleDay)
    }));
    let eventQuery = "";
    function eventsForDay(year, month, day) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return events.filter((e) => e.startDate <= dateStr && dateStr <= e.endDate);
    }
    const sortedWidgets = derived(() => [...dashboardWidgets].sort((a, b) => a.order - b.order));
    let editMode = false;
    let layout = defaultLayout();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("x1i5gj", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>${escape_html(dashboard_title())}</title>`);
        });
      });
      $$renderer3.push(`<div class="space-y-6"><div class="flex items-start justify-between gap-4">`);
      PageHeader($$renderer3, {
        title: dashboard_title(),
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->${escape_html(dashboard_welcome({ firstName: data.user?.firstName ?? data.user?.username ?? "" }))}`);
        }
      });
      $$renderer3.push(`<!----> <button type="button"${attr_class(`btn btn-sm shrink-0 mt-1 ${stringify("btn-ghost border border-base-300")}`)}>`);
      {
        $$renderer3.push("<!--[-1-->");
        Layout_dashboard($$renderer3, { class: "size-4" });
        $$renderer3.push(`<!----> ${escape_html(dashboard_edit_layout())}`);
      }
      $$renderer3.push(`<!--]--></button></div> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <!--[-->`);
      const each_array = ensure_array_like(layout.sections);
      for (let $$index_15 = 0, $$length = each_array.length; $$index_15 < $$length; $$index_15++) {
        let section = each_array[$$index_15];
        if (section.visible || editMode) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div${attr_class(`relative transition-all duration-150 ${stringify("space-y-0")} ${stringify("")} ${stringify("")}`)}>`);
          {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <div${attr_class(`transition-opacity duration-150 ${stringify("")}`)}>`);
          if (section.id === "kpi") {
            $$renderer3.push("<!--[0-->");
            const kpiItems = section.items ?? [];
            $$renderer3.push(`<div class="grid grid-cols-2 lg:grid-cols-4 gap-4"><!--[-->`);
            const each_array_1 = ensure_array_like(kpiItems.filter((i) => i.visible || editMode));
            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
              let item = each_array_1[$$index];
              const kpi = KPI_DEFS().find((k) => k.id === item.id);
              if (kpi) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div${attr_class(`card bg-base-100 border border-base-200 p-5 flex items-start gap-4 relative transition-all duration-100 ${stringify("")} ${stringify("")} ${stringify("")} ${stringify("")}`)}${attr("draggable", editMode)}>`);
                {
                  $$renderer3.push("<!--[-1-->");
                }
                $$renderer3.push(`<!--]--> <div${attr_class(`p-2 rounded-lg bg-${stringify(kpi.color)}/10`)}>`);
                if (kpi.icon) {
                  $$renderer3.push("<!--[-->");
                  kpi.icon($$renderer3, { class: `size-5 text-${stringify(kpi.color)}` });
                  $$renderer3.push("<!--]-->");
                } else {
                  $$renderer3.push("<!--[!-->");
                  $$renderer3.push("<!--]-->");
                }
                $$renderer3.push(`</div> <div><p class="text-xs opacity-60 uppercase tracking-wide font-medium">${escape_html(kpi.label)}</p> <p class="text-2xl font-bold mt-0.5">${escape_html(kpi.value)}</p> <p class="text-xs opacity-50 mt-0.5">${escape_html(kpi.sub)}</p></div></div>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]--></div>`);
          } else if (section.id === "charts") {
            $$renderer3.push("<!--[1-->");
            const chartItems = section.items ?? [];
            $$renderer3.push(`<div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><!--[-->`);
            const each_array_2 = ensure_array_like(chartItems.filter((i) => i.visible || editMode));
            for (let $$index_8 = 0, $$length2 = each_array_2.length; $$index_8 < $$length2; $$index_8++) {
              let item = each_array_2[$$index_8];
              $$renderer3.push(`<div${attr_class(`card bg-base-100 border border-base-200 p-5 space-y-3 relative transition-all duration-100 ${stringify("")} ${stringify("")} ${stringify("")} ${stringify("")}`)}${attr("draggable", editMode)}>`);
              {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--> `);
              if (item.id === "daily-revenue") {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<h2 class="text-sm font-semibold opacity-70">${escape_html(dashboard_chart_daily_revenue())}</h2> <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true"><!--[-->`);
                const each_array_3 = ensure_array_like([0.25, 0.5, 0.75, 1]);
                for (let $$index_1 = 0, $$length3 = each_array_3.length; $$index_1 < $$length3; $$index_1++) {
                  let frac = each_array_3[$$index_1];
                  $$renderer3.push(`<line x1="16" x2="464"${attr("y1", 140 - 16 - (frac * (140 - 32)).toFixed(1))}${attr("y2", 140 - 16 - (frac * (140 - 32)).toFixed(1))} stroke="currentColor" stroke-opacity="0.08" stroke-width="1"></line>`);
                }
                $$renderer3.push(`<!--]--><path${attr("d", areaPath(dailyData))} fill="var(--color-primary-500)" fill-opacity="0.15"></path><polyline${attr("points", linePoints(dailyData))} fill="none" stroke="var(--color-primary-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline><!--[-->`);
                const each_array_4 = ensure_array_like(dailyData);
                for (let i = 0, $$length3 = each_array_4.length; i < $$length3; i++) {
                  let d = each_array_4[i];
                  if (i % 5 === 0) {
                    $$renderer3.push("<!--[0-->");
                    $$renderer3.push(`<text${attr("x", (16 + i / 29 * (480 - 32)).toFixed(1))} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">${escape_html(d.label)}</text>`);
                  } else {
                    $$renderer3.push("<!--[-1-->");
                  }
                  $$renderer3.push(`<!--]-->`);
                }
                $$renderer3.push(`<!--]--></svg>`);
              } else if (item.id === "product-revenue") {
                $$renderer3.push("<!--[1-->");
                $$renderer3.push(`<h2 class="text-sm font-semibold opacity-70">${escape_html(dashboard_chart_revenue_product())}</h2> <svg viewBox="0 0 460 165" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true"><!--[-->`);
                const each_array_5 = ensure_array_like(bars);
                for (let i = 0, $$length3 = each_array_5.length; i < $$length3; i++) {
                  let b = each_array_5[i];
                  $$renderer3.push(`<text${attr("x", b.x - 5)}${attr("y", b.midY + 3.5)} font-size="9.5" text-anchor="end" fill="currentColor" fill-opacity="0.6">${escape_html(b.label)}</text><rect${attr("x", b.x)}${attr("y", b.y)}${attr("width", b.w)}${attr("height", b.bh)} rx="3"${attr("fill", `var(--color-${stringify(DONUT_COLORS[i % 5])}-500)`)} fill-opacity="0.85"></rect><text${attr("x", b.x + b.w + 5)}${attr("y", b.midY + 3.5)} font-size="9" fill="currentColor" fill-opacity="0.5">${escape_html(fmt(b.value))}</text>`);
                }
                $$renderer3.push(`<!--]--></svg>`);
              } else if (item.id === "region-orders") {
                $$renderer3.push("<!--[2-->");
                $$renderer3.push(`<h2 class="text-sm font-semibold opacity-70">${escape_html(dashboard_chart_orders_region())}</h2> <div class="flex items-center gap-6"><svg viewBox="0 0 180 180" width="180" height="180" class="shrink-0" aria-hidden="true"><!--[-->`);
                const each_array_6 = ensure_array_like(segs);
                for (let $$index_4 = 0, $$length3 = each_array_6.length; $$index_4 < $$length3; $$index_4++) {
                  let seg = each_array_6[$$index_4];
                  $$renderer3.push(`<path${attr("d", seg.path)}${attr("fill", seg.color)} fill-opacity="0.9"></path>`);
                }
                $$renderer3.push(`<!--]--><text x="90" y="85" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${escape_html(totalOrders)}</text><text x="90" y="100" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.5">orders</text></svg> <ul class="space-y-2 text-sm flex-1"><!--[-->`);
                const each_array_7 = ensure_array_like(segs);
                for (let $$index_5 = 0, $$length3 = each_array_7.length; $$index_5 < $$length3; $$index_5++) {
                  let seg = each_array_7[$$index_5];
                  $$renderer3.push(`<li class="flex items-center justify-between gap-2"><span class="flex items-center gap-2"><span class="size-2.5 rounded-full shrink-0"${attr_style(`background:${stringify(seg.color)}`)}></span> <span class="opacity-70">${escape_html(seg.label)}</span></span> <span class="font-semibold">${escape_html(seg.pct)}%</span></li>`);
                }
                $$renderer3.push(`<!--]--></ul></div>`);
              } else if (item.id === "monthly-revenue") {
                $$renderer3.push("<!--[3-->");
                $$renderer3.push(`<h2 class="text-sm font-semibold opacity-70">${escape_html(dashboard_chart_monthly_revenue())}</h2> <svg viewBox="0 0 480 140" width="100%" preserveAspectRatio="none" class="block" aria-hidden="true"><!--[-->`);
                const each_array_8 = ensure_array_like([0.25, 0.5, 0.75, 1]);
                for (let $$index_6 = 0, $$length3 = each_array_8.length; $$index_6 < $$length3; $$index_6++) {
                  let frac = each_array_8[$$index_6];
                  $$renderer3.push(`<line x1="16" x2="464"${attr("y1", 140 - 16 - (frac * (140 - 32)).toFixed(1))}${attr("y2", 140 - 16 - (frac * (140 - 32)).toFixed(1))} stroke="currentColor" stroke-opacity="0.08" stroke-width="1"></line>`);
                }
                $$renderer3.push(`<!--]--><path${attr("d", areaPath(monthlyData))} fill="var(--color-secondary-500)" fill-opacity="0.18"></path><polyline${attr("points", linePoints(monthlyData))} fill="none" stroke="var(--color-secondary-500)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline><!--[-->`);
                const each_array_9 = ensure_array_like(monthlyData);
                for (let i = 0, $$length3 = each_array_9.length; i < $$length3; i++) {
                  let d = each_array_9[i];
                  $$renderer3.push(`<text${attr("x", (16 + i / 11 * (480 - 32)).toFixed(1))} y="135" font-size="9" text-anchor="middle" fill="currentColor" fill-opacity="0.4">${escape_html(d.label)}</text>`);
                }
                $$renderer3.push(`<!--]--></svg>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></div>`);
            }
            $$renderer3.push(`<!--]--></div>`);
          } else if (section.id === "sales-table") {
            $$renderer3.push("<!--[2-->");
            $$renderer3.push(`<div class="space-y-3"><h2 class="text-lg font-semibold">${escape_html(dashboard_section_sales())}</h2> <label class="input input-bordered flex items-center gap-2">`);
            Search($$renderer3, { class: "size-4 opacity-50 shrink-0" });
            $$renderer3.push(`<!----> <input type="search" class="grow"${attr("placeholder", dashboard_sales_search())}${attr("value", query)}/></label> <div class="card bg-base-100 border border-base-200 overflow-hidden"><table class="table table-sm"><thead><tr><th>${escape_html(dashboard_col_order())}</th><th>${escape_html(dashboard_col_date())}</th><th>${escape_html(dashboard_col_product())}</th><th>${escape_html(dashboard_col_region())}</th><th class="text-right">${escape_html(dashboard_col_units())}</th><th class="text-right">${escape_html(dashboard_col_revenue())}</th><th>${escape_html(dashboard_col_status())}</th></tr></thead><tbody>`);
            const each_array_10 = ensure_array_like(pageRows());
            if (each_array_10.length !== 0) {
              $$renderer3.push("<!--[-->");
              for (let $$index_9 = 0, $$length2 = each_array_10.length; $$index_9 < $$length2; $$index_9++) {
                let row = each_array_10[$$index_9];
                $$renderer3.push(`<tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors"><td class="font-mono text-xs opacity-60">${escape_html(row.id)}</td><td class="opacity-60">${escape_html(row.date.toLocaleDateString())}</td><td>${escape_html(row.product)}</td><td class="opacity-60">${escape_html(row.region)}</td><td class="text-right">${escape_html(row.units)}</td><td class="text-right font-semibold">${escape_html(fmt(row.revenue))}</td><td><span${attr_class(`badge text-xs ${stringify(STATUS_CLS[row.status] ?? "")}`)}>${escape_html(row.status)}</span></td></tr>`);
              }
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`<tr><td colspan="7" class="px-4 py-8 text-center opacity-50">${escape_html(dashboard_no_records())}</td></tr>`);
            }
            $$renderer3.push(`<!--]--></tbody></table> <div class="flex items-center justify-between px-4 py-2 border-t border-base-200"><span class="text-xs opacity-50">${escape_html(filtered().length === 0 ? "No records" : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered().length)} of ${filtered().length}`)}</span> `);
            Pagination($$renderer3, {
              count: filtered().length,
              pageSize: PAGE_SIZE,
              page: currentPage,
              onPageChange: (e) => currentPage = e.page,
              siblingCount: 1
            });
            $$renderer3.push(`<!----></div></div></div>`);
          } else if (section.id === "calendar") {
            $$renderer3.push("<!--[3-->");
            $$renderer3.push(`<div class="space-y-3"><h2 class="text-lg font-semibold">${escape_html(dashboard_section_calendar())}</h2> <div class="flex items-center gap-3"><div class="relative flex-1"><label class="input input-bordered flex items-center gap-2">`);
            Search($$renderer3, { class: "size-4 opacity-50 shrink-0" });
            $$renderer3.push(`<!----> <input type="search" class="grow"${attr("placeholder", dashboard_calendar_search())} autocomplete="off"${attr("value", eventQuery)}/></label> `);
            {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--></div> `);
            if (hasPermission(data.user, "events", "create")) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<button type="button" class="btn btn-primary whitespace-nowrap">`);
              Plus($$renderer3, { class: "size-4" });
              $$renderer3.push(`<!----> ${escape_html(dashboard_new_event())}</button>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--></div> <div class="card bg-base-100 border border-base-200 overflow-hidden"><div class="flex items-center justify-between px-5 py-3 border-b border-base-200"><button type="button" class="btn btn-ghost btn-square btn-sm"${attr("aria-label", dashboard_prev_month())}>`);
            Chevron_left($$renderer3, { class: "size-4" });
            $$renderer3.push(`<!----></button> <span class="font-semibold text-sm">${escape_html(calLabel())}</span> <button type="button" class="btn btn-ghost btn-square btn-sm"${attr("aria-label", dashboard_next_month())}>`);
            Chevron_right($$renderer3, { class: "size-4" });
            $$renderer3.push(`<!----></button></div> <div class="grid grid-cols-7 border-b border-base-200"><!--[-->`);
            const each_array_12 = ensure_array_like([
              dashboard_day_sun(),
              dashboard_day_mon(),
              dashboard_day_tue(),
              dashboard_day_wed(),
              dashboard_day_thu(),
              dashboard_day_fri(),
              dashboard_day_sat()
            ]);
            for (let $$index_11 = 0, $$length2 = each_array_12.length; $$index_11 < $$length2; $$index_11++) {
              let dow = each_array_12[$$index_11];
              $$renderer3.push(`<div class="px-2 py-2 text-center text-xs font-semibold opacity-50 uppercase tracking-wide">${escape_html(dow)}</div>`);
            }
            $$renderer3.push(`<!--]--></div> <div class="grid grid-cols-7"><!--[-->`);
            const each_array_13 = ensure_array_like(calDays());
            for (let i = 0, $$length2 = each_array_13.length; i < $$length2; i++) {
              let cell = each_array_13[i];
              const borderR = (i + 1) % 7 !== 0 ? "border-r" : "";
              const borderB = i < calDays().length - 7 ? "border-b" : "";
              $$renderer3.push(`<div${attr_class(`min-h-[5.5rem] p-2 border-base-200 ${stringify(borderR)} ${stringify(borderB)} relative ${stringify(cell?.isToday ? "bg-primary/5" : "")}`)}>`);
              if (cell) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<span${attr_class(`text-xs font-semibold ${stringify(cell.isToday ? "inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-content" : "opacity-70")}`)}>${escape_html(cell.day)}</span> `);
                if (cell.count > 0) {
                  $$renderer3.push("<!--[0-->");
                  $$renderer3.push(`<div class="mt-1.5 space-y-0.5"><div class="w-full rounded-sm h-1.5 overflow-hidden bg-base-200"><div class="h-full rounded-sm bg-primary"${attr_style(`width:${stringify(Math.round(cell.revenue / maxDayRevenue() * 100))}%`)}></div></div> <p class="text-[10px] text-primary font-semibold">${escape_html(fmt(cell.revenue))}</p> <p class="text-[10px] opacity-40">${escape_html(cell.count)} order${escape_html(cell.count !== 1 ? "s" : "")}</p></div>`);
                } else {
                  $$renderer3.push("<!--[-1-->");
                }
                $$renderer3.push(`<!--]--> <!--[-->`);
                const each_array_14 = ensure_array_like(eventsForDay(calYear, calMonth, cell.day));
                for (let $$index_12 = 0, $$length3 = each_array_14.length; $$index_12 < $$length3; $$index_12++) {
                  let ev = each_array_14[$$index_12];
                  $$renderer3.push(`<button type="button" class="mt-1 w-full text-left text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-sm truncate bg-accent text-accent-content hover:opacity-90 transition-opacity"${attr("title", ev.title)}>${escape_html(ev.title)}</button>`);
                }
                $$renderer3.push(`<!--]-->`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></div>`);
            }
            $$renderer3.push(`<!--]--></div></div></div>`);
          } else if (section.id === "widgets") {
            $$renderer3.push("<!--[4-->");
            if (sortedWidgets().length > 0) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_15 = ensure_array_like(sortedWidgets());
              for (let $$index_14 = 0, $$length2 = each_array_15.length; $$index_14 < $$length2; $$index_14++) {
                let w = each_array_15[$$index_14];
                if (hasPermission(data.user, w.permission.resource, w.permission.action)) {
                  $$renderer3.push("<!--[0-->");
                  if (w.component) {
                    $$renderer3.push("<!--[-->");
                    w.component($$renderer3, {});
                    $$renderer3.push("<!--]-->");
                  } else {
                    $$renderer3.push("<!--[!-->");
                    $$renderer3.push("<!--]-->");
                  }
                } else {
                  $$renderer3.push("<!--[-1-->");
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></div> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BhaEM0iH.js.map
