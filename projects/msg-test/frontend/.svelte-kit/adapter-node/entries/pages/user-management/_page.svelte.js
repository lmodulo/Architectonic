import { F as sanitize_props, G as spread_props, J as slot, P as attr_class, K as stringify, N as head, Q as ensure_array_like, z as derived } from "../../../chunks/index2.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { P as Pagination } from "../../../chunks/Pagination.js";
import { A as Avatar } from "../../../chunks/Avatar.js";
import { k as escape_html, m as clsx, p as attr } from "../../../chunks/attributes.js";
import { h as hasPermission } from "../../../chunks/permissions.js";
import { S as Search } from "../../../chunks/search.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { C as Chevron_down } from "../../../chunks/chevron-down.js";
import { P as Plus } from "../../../chunks/plus.js";
import { X } from "../../../chunks/x.js";
import { g as getLocale } from "../../../chunks/runtime.js";
import { p as profile_members_count } from "../../../chunks/profile_members_count.js";
import { c as common_cancel } from "../../../chunks/common_cancel.js";
function Pencil($$renderer, $$props) {
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
        "d": "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { "d": "m15 5 4 4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "pencil" },
    $$sanitized_props,
    {
      /**
       * @component @name Pencil
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMjEuMTc0IDYuODEyYTEgMSAwIDAgMC0zLjk4Ni0zLjk4N0wzLjg0MiAxNi4xNzRhMiAyIDAgMCAwLS41LjgzbC0xLjMyMSA0LjM1MmEuNS41IDAgMCAwIC42MjMuNjIybDQuMzUzLTEuMzJhMiAyIDAgMCAwIC44My0uNDk3eiIgLz4KICA8cGF0aCBkPSJtMTUgNSA0IDQiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/pencil
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
function Trash_2($$renderer, $$props) {
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
    ["path", { "d": "M10 11v6" }],
    ["path", { "d": "M14 11v6" }],
    ["path", { "d": "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
    ["path", { "d": "M3 6h18" }],
    ["path", { "d": "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
  ];
  Icon($$renderer, spread_props([
    { name: "trash-2" },
    $$sanitized_props,
    {
      /**
       * @component @name Trash2
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTAgMTF2NiIgLz4KICA8cGF0aCBkPSJNMTQgMTF2NiIgLz4KICA8cGF0aCBkPSJNMTkgNnYxNGEyIDIgMCAwIDEtMiAySDdhMiAyIDAgMCAxLTItMlY2IiAvPgogIDxwYXRoIGQ9Ik0zIDZoMTgiIC8+CiAgPHBhdGggZD0iTTggNlY0YTIgMiAwIDAgMSAyLTJoNGEyIDIgMCAwIDEgMiAydjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/trash-2
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
function User_plus($$renderer, $$props) {
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
    ["path", { "d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { "cx": "9", "cy": "7", "r": "4" }],
    ["line", { "x1": "19", "x2": "19", "y1": "8", "y2": "14" }],
    ["line", { "x1": "22", "x2": "16", "y1": "11", "y2": "11" }]
  ];
  Icon($$renderer, spread_props([
    { name: "user-plus" },
    $$sanitized_props,
    {
      /**
       * @component @name UserPlus
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiIgLz4KICA8Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIgLz4KICA8bGluZSB4MT0iMTkiIHgyPSIxOSIgeTE9IjgiIHkyPSIxNCIgLz4KICA8bGluZSB4MT0iMjIiIHgyPSIxNiIgeTE9IjExIiB5Mj0iMTEiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/user-plus
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
const en_common_add = (
  /** @type {(inputs: Common_AddInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Add`
    );
  }
);
const common_add = (
  /** @type {((inputs?: Common_AddInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_AddInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_add();
  })
);
const en_common_resource = (
  /** @type {(inputs: Common_ResourceInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Resource`
    );
  }
);
const common_resource = (
  /** @type {((inputs?: Common_ResourceInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ResourceInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_resource();
  })
);
const en_user_mgmt_title = (
  /** @type {(inputs: User_Mgmt_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `User Management`
    );
  }
);
const user_mgmt_title = (
  /** @type {((inputs?: User_Mgmt_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_title();
  })
);
const en_user_mgmt_tab_users = (
  /** @type {(inputs: User_Mgmt_Tab_UsersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Users`
    );
  }
);
const user_mgmt_tab_users = (
  /** @type {((inputs?: User_Mgmt_Tab_UsersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Tab_UsersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_tab_users();
  })
);
const en_user_mgmt_tab_roles = (
  /** @type {(inputs: User_Mgmt_Tab_RolesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Roles`
    );
  }
);
const user_mgmt_tab_roles = (
  /** @type {((inputs?: User_Mgmt_Tab_RolesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Tab_RolesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_tab_roles();
  })
);
const en_user_mgmt_tab_teams = (
  /** @type {(inputs: User_Mgmt_Tab_TeamsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Teams`
    );
  }
);
const user_mgmt_tab_teams = (
  /** @type {((inputs?: User_Mgmt_Tab_TeamsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Tab_TeamsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_tab_teams();
  })
);
const en_user_mgmt_search_users = (
  /** @type {(inputs: User_Mgmt_Search_UsersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Search by name or email…`
    );
  }
);
const user_mgmt_search_users = (
  /** @type {((inputs?: User_Mgmt_Search_UsersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Search_UsersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_search_users();
  })
);
const en_user_mgmt_invite_user = (
  /** @type {(inputs: User_Mgmt_Invite_UserInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Invite User`
    );
  }
);
const user_mgmt_invite_user = (
  /** @type {((inputs?: User_Mgmt_Invite_UserInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Invite_UserInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_invite_user();
  })
);
const en_user_mgmt_col_name = (
  /** @type {(inputs: User_Mgmt_Col_NameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Name`
    );
  }
);
const user_mgmt_col_name = (
  /** @type {((inputs?: User_Mgmt_Col_NameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Col_NameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_col_name();
  })
);
const en_user_mgmt_col_email = (
  /** @type {(inputs: User_Mgmt_Col_EmailInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Email`
    );
  }
);
const user_mgmt_col_email = (
  /** @type {((inputs?: User_Mgmt_Col_EmailInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Col_EmailInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_col_email();
  })
);
const en_user_mgmt_col_role = (
  /** @type {(inputs: User_Mgmt_Col_RoleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Role`
    );
  }
);
const user_mgmt_col_role = (
  /** @type {((inputs?: User_Mgmt_Col_RoleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Col_RoleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_col_role();
  })
);
const en_user_mgmt_col_joined = (
  /** @type {(inputs: User_Mgmt_Col_JoinedInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Joined`
    );
  }
);
const user_mgmt_col_joined = (
  /** @type {((inputs?: User_Mgmt_Col_JoinedInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Col_JoinedInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_col_joined();
  })
);
const en_user_mgmt_col_pending = (
  /** @type {(inputs: User_Mgmt_Col_PendingInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Pending`
    );
  }
);
const user_mgmt_col_pending = (
  /** @type {((inputs?: User_Mgmt_Col_PendingInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Col_PendingInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_col_pending();
  })
);
const en_user_mgmt_no_users = (
  /** @type {(inputs: User_Mgmt_No_UsersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No users found.`
    );
  }
);
const user_mgmt_no_users = (
  /** @type {((inputs?: User_Mgmt_No_UsersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_No_UsersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_no_users();
  })
);
const en_user_mgmt_assignments = (
  /** @type {(inputs: User_Mgmt_AssignmentsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `User Assignments`
    );
  }
);
const user_mgmt_assignments = (
  /** @type {((inputs?: User_Mgmt_AssignmentsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_AssignmentsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_assignments();
  })
);
const en_user_mgmt_search_teams = (
  /** @type {(inputs: User_Mgmt_Search_TeamsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Search teams…`
    );
  }
);
const user_mgmt_search_teams = (
  /** @type {((inputs?: User_Mgmt_Search_TeamsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Search_TeamsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_search_teams();
  })
);
const en_user_mgmt_new_team = (
  /** @type {(inputs: User_Mgmt_New_TeamInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `New Team`
    );
  }
);
const user_mgmt_new_team = (
  /** @type {((inputs?: User_Mgmt_New_TeamInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_New_TeamInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_new_team();
  })
);
const en_user_mgmt_no_teams = (
  /** @type {(inputs: User_Mgmt_No_TeamsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No teams found.`
    );
  }
);
const user_mgmt_no_teams = (
  /** @type {((inputs?: User_Mgmt_No_TeamsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_No_TeamsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_no_teams();
  })
);
const en_user_mgmt_no_members = (
  /** @type {(inputs: User_Mgmt_No_MembersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No members yet.`
    );
  }
);
const user_mgmt_no_members = (
  /** @type {((inputs?: User_Mgmt_No_MembersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_No_MembersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_no_members();
  })
);
const en_user_mgmt_select_user = (
  /** @type {(inputs: User_Mgmt_Select_UserInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Select a user…`
    );
  }
);
const user_mgmt_select_user = (
  /** @type {((inputs?: User_Mgmt_Select_UserInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Select_UserInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_select_user();
  })
);
const en_user_mgmt_add_member = (
  /** @type {(inputs: User_Mgmt_Add_MemberInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Add Member`
    );
  }
);
const user_mgmt_add_member = (
  /** @type {((inputs?: User_Mgmt_Add_MemberInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Add_MemberInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_add_member();
  })
);
const en_user_mgmt_no_roles = (
  /** @type {(inputs: User_Mgmt_No_RolesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No roles found.`
    );
  }
);
const user_mgmt_no_roles = (
  /** @type {((inputs?: User_Mgmt_No_RolesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_No_RolesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_no_roles();
  })
);
const en_user_mgmt_permissions_legend = (
  /** @type {(inputs: User_Mgmt_Permissions_LegendInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `C = create  R = read  U = update  D = delete`
    );
  }
);
const user_mgmt_permissions_legend = (
  /** @type {((inputs?: User_Mgmt_Permissions_LegendInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Mgmt_Permissions_LegendInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_user_mgmt_permissions_legend();
  })
);
function UserNameLink($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { user, class: cls = "" } = $$props;
    function dname(u) {
      if (!u) return "—";
      return u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—";
    }
    if (user) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button" data-user-trigger=""${attr_class(`cursor-pointer underline decoration-dotted hover:decoration-solid underline-offset-2 bg-transparent border-none p-0 font-[inherit] text-[inherit] ${stringify(cls)}`)}>${escape_html(dname(user))}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span${attr_class(clsx(cls))}>—</span>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const firstTab = data.canReadUsers ? "users" : data.canReadRoles ? "roles" : "teams";
    let activeTab = firstTab;
    let users = [...data.users];
    let query = "";
    let currentPage = 1;
    const PAGE_SIZE = 20;
    const filtered = derived(() => query.trim() ? users.filter((u) => {
      const q = query.toLowerCase();
      return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q);
    }) : users);
    const pageUsers = derived(() => filtered().slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
    const ACTIONS = ["create", "read", "update", "delete"];
    const RESOURCES = ["dashboard", "users", "roles", "teams"];
    let openRoles = /* @__PURE__ */ new Set([data.roles[0]?.name]);
    let roleUsers = [...data.users];
    async function assignRole(userId, role) {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        roleUsers = roleUsers.map((u) => u.id === userId ? { ...u, role } : u);
        users = users.map((u) => u.id === userId ? { ...u, role } : u);
      }
    }
    let userQuery = "";
    let rolesPage = 1;
    const filteredRoleUsers = derived(() => userQuery.trim() ? roleUsers.filter((u) => {
      const q = userQuery.toLowerCase();
      return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q);
    }) : roleUsers);
    const pageRoleUsers = derived(() => filteredRoleUsers().slice((rolesPage - 1) * PAGE_SIZE, rolesPage * PAGE_SIZE));
    let teams = [...data.teams];
    let teamQuery = "";
    let teamsPage = 1;
    const filteredTeams = derived(() => teamQuery.trim() ? teams.filter((t) => {
      const q = teamQuery.toLowerCase();
      return t.name?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }) : teams);
    const pageTeams = derived(() => filteredTeams().slice((teamsPage - 1) * PAGE_SIZE, teamsPage * PAGE_SIZE));
    let expandedTeamId = null;
    let teamDetails = /* @__PURE__ */ new Map();
    let addMemberTeamId = null;
    let selectedUserId = "";
    head("4hz8di", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(user_mgmt_title())}</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6">`);
    PageHeader($$renderer2, { title: user_mgmt_title() });
    $$renderer2.push(`<!----> `);
    if (data.error) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(data.error)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex gap-1 border-b border-base-200">`);
    if (data.canReadUsers) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button"${attr_class(`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stringify(activeTab === "users" ? "border-primary text-primary" : "border-transparent hover:text-base-content")}`)}>${escape_html(user_mgmt_tab_users())}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.canReadRoles) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button"${attr_class(`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stringify(activeTab === "roles" ? "border-primary text-primary" : "border-transparent hover:text-base-content")}`)}>${escape_html(user_mgmt_tab_roles())}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.canReadTeams) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button"${attr_class(`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stringify(activeTab === "teams" ? "border-primary text-primary" : "border-transparent hover:text-base-content")}`)}>${escape_html(user_mgmt_tab_teams())}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (activeTab === "users") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-4"><div class="flex items-center gap-3"><label class="input input-bordered flex items-center gap-2 flex-1">`);
      Search($$renderer2, { class: "size-4 opacity-50" });
      $$renderer2.push(`<!----> <input type="search"${attr("placeholder", user_mgmt_search_users())} class="grow"${attr("value", query)}/></label> `);
      if (hasPermission(data.user, "users", "create")) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button" class="btn btn-primary shrink-0">`);
        User_plus($$renderer2, { class: "size-4" });
        $$renderer2.push(`<!----> ${escape_html(user_mgmt_invite_user())}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="card bg-base-100 border border-base-200 overflow-hidden"><table class="table table-sm"><thead><tr><th>${escape_html(user_mgmt_col_name())}</th><th>${escape_html(user_mgmt_col_email())}</th><th>${escape_html(user_mgmt_col_role())}</th><th>${escape_html(user_mgmt_col_joined())}</th><th></th></tr></thead><tbody>`);
      const each_array = ensure_array_like(pageUsers());
      if (each_array.length !== 0) {
        $$renderer2.push("<!--[-->");
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let user = each_array[$$index];
          $$renderer2.push(`<tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors"><td><div class="flex items-center gap-2 font-medium">`);
          if (user.status === "pending") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="opacity-50 italic">${escape_html(user.email)}</span> <span class="badge badge-warning badge-sm">${escape_html(user_mgmt_col_pending())}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            UserNameLink($$renderer2, { user });
          }
          $$renderer2.push(`<!--]--></div> `);
          if (user.status !== "pending" && (user.firstName || user.lastName)) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="text-xs opacity-50">${escape_html(user.username)}</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></td><td class="opacity-60">${escape_html(user.email)}</td><td><span class="badge badge-primary badge-outline text-xs">${escape_html(user.role ?? "viewer")}</span></td><td class="opacity-60">${escape_html(new Date(user.createdAt).toLocaleDateString())}</td><td><div class="flex items-center justify-end gap-1">`);
          if (hasPermission(data.user, "users", "update")) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-primary"${attr("aria-label", `Edit ${stringify(user.username)}`)}>`);
            Pencil($$renderer2, { class: "size-3.5" });
            $$renderer2.push(`<!----></button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (hasPermission(data.user, "users", "delete")) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error"${attr("aria-label", `Delete ${stringify(user.username)}`)}>`);
            Trash_2($$renderer2, { class: "size-3.5" });
            $$renderer2.push(`<!----></button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div></td></tr>`);
        }
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<tr><td colspan="5" class="text-center opacity-50 py-8">${escape_html(user_mgmt_no_users())}</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table> <div class="flex items-center justify-between px-4 py-2 border-t border-base-200"><span class="text-xs opacity-60">${escape_html(filtered().length === 0 ? "No users" : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered().length)} of ${filtered().length}`)}</span> `);
      Pagination($$renderer2, {
        count: filtered().length,
        pageSize: PAGE_SIZE,
        page: currentPage,
        onPageChange: (e) => currentPage = e.page,
        siblingCount: 1
      });
      $$renderer2.push(`<!----></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (activeTab === "roles") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-6"><div class="card bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">`);
      const each_array_1 = ensure_array_like(data.roles);
      if (each_array_1.length !== 0) {
        $$renderer2.push("<!--[-->");
        for (let $$index_4 = 0, $$length = each_array_1.length; $$index_4 < $$length; $$index_4++) {
          let role = each_array_1[$$index_4];
          const open = openRoles.has(role.name);
          $$renderer2.push(`<button type="button" class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-base-200/50 transition-colors"${attr("aria-expanded", open)}><div><span class="font-semibold">${escape_html(role.label)}</span> <span class="ml-2 text-xs opacity-50">${escape_html(role.name)}</span></div> `);
          Chevron_down($$renderer2, {
            class: `size-4 opacity-40 transition-transform duration-200 ${stringify(open ? "rotate-180" : "")}`
          });
          $$renderer2.push(`<!----></button> `);
          if (open) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="px-4 py-4 bg-base-200/30"><div class="grid gap-x-4 gap-y-3" style="grid-template-columns: minmax(7rem,1fr) repeat(4, 2.5rem);"><div class="text-xs font-semibold opacity-50 uppercase tracking-wide">${escape_html(common_resource())}</div> <!--[-->`);
            const each_array_2 = ensure_array_like(ACTIONS);
            for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
              let action = each_array_2[$$index_1];
              $$renderer2.push(`<div class="text-xs font-semibold opacity-50 uppercase tracking-wide text-center">${escape_html(action[0].toUpperCase())}</div>`);
            }
            $$renderer2.push(`<!--]--> <!--[-->`);
            const each_array_3 = ensure_array_like(RESOURCES);
            for (let $$index_3 = 0, $$length2 = each_array_3.length; $$index_3 < $$length2; $$index_3++) {
              let resource = each_array_3[$$index_3];
              $$renderer2.push(`<div class="flex items-center text-sm capitalize font-medium">${escape_html(resource)}</div> <!--[-->`);
              const each_array_4 = ensure_array_like(ACTIONS);
              for (let $$index_2 = 0, $$length3 = each_array_4.length; $$index_2 < $$length3; $$index_2++) {
                let action = each_array_4[$$index_2];
                $$renderer2.push(`<div class="flex items-center justify-center"><span${attr_class(`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${stringify(role.permissions?.[resource]?.[action] ? "bg-success text-success-content" : "bg-base-300 opacity-40")}`)}>${escape_html(action[0].toUpperCase())}</span></div>`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--></div> <p class="mt-3 text-xs opacity-40">${escape_html(user_mgmt_permissions_legend())}</p></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="px-4 py-8 text-center opacity-50 text-sm">${escape_html(user_mgmt_no_roles())}</div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (data.canAssign && roleUsers.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="space-y-3"><h2 class="text-lg font-semibold">${escape_html(user_mgmt_assignments())}</h2> <label class="input input-bordered flex items-center gap-2">`);
        Search($$renderer2, { class: "size-4 opacity-50" });
        $$renderer2.push(`<!----> <input type="search"${attr("placeholder", user_mgmt_search_users())} class="grow"${attr("value", userQuery)}/></label> <div class="card bg-base-100 border border-base-200 overflow-hidden"><table class="table table-sm"><thead><tr><th>${escape_html(user_mgmt_col_name())}</th><th>${escape_html(user_mgmt_col_email())}</th><th>${escape_html(user_mgmt_col_role())}</th></tr></thead><tbody><!--[-->`);
        const each_array_5 = ensure_array_like(pageRoleUsers());
        for (let $$index_6 = 0, $$length = each_array_5.length; $$index_6 < $$length; $$index_6++) {
          let user = each_array_5[$$index_6];
          $$renderer2.push(`<tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors"><td><div class="font-medium">`);
          UserNameLink($$renderer2, { user });
          $$renderer2.push(`<!----></div> `);
          if (user.firstName || user.lastName) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="text-xs opacity-50">${escape_html(user.username)}</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></td><td class="opacity-60">${escape_html(user.email)}</td><td>`);
          $$renderer2.select(
            {
              class: "select select-bordered select-xs",
              value: user.role ?? "viewer",
              onchange: (e) => assignRole(user.id, e.currentTarget.value)
            },
            ($$renderer3) => {
              $$renderer3.push(`<!--[-->`);
              const each_array_6 = ensure_array_like(data.roles);
              for (let $$index_5 = 0, $$length2 = each_array_6.length; $$index_5 < $$length2; $$index_5++) {
                let role = each_array_6[$$index_5];
                $$renderer3.option({ value: role.name }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(role.label)}`);
                });
              }
              $$renderer3.push(`<!--]-->`);
            }
          );
          $$renderer2.push(`</td></tr>`);
        }
        $$renderer2.push(`<!--]--></tbody></table> <div class="flex items-center justify-between px-4 py-2 border-t border-base-200"><span class="text-xs opacity-60">${escape_html(filteredRoleUsers().length === 0 ? "No users" : `${(rolesPage - 1) * PAGE_SIZE + 1}–${Math.min(rolesPage * PAGE_SIZE, filteredRoleUsers().length)} of ${filteredRoleUsers().length}`)}</span> `);
        Pagination($$renderer2, {
          count: filteredRoleUsers().length,
          pageSize: PAGE_SIZE,
          page: rolesPage,
          onPageChange: (e) => rolesPage = e.page,
          siblingCount: 1
        });
        $$renderer2.push(`<!----></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (activeTab === "teams") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="space-y-4"><div class="flex items-center gap-3"><label class="input input-bordered flex items-center gap-2 flex-1">`);
      Search($$renderer2, { class: "size-4 opacity-50" });
      $$renderer2.push(`<!----> <input type="search"${attr("placeholder", user_mgmt_search_teams())} class="grow"${attr("value", teamQuery)}/></label> `);
      if (data.canCreateTeam) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button" class="btn btn-primary shrink-0">`);
        Plus($$renderer2, { class: "size-4" });
        $$renderer2.push(`<!----> ${escape_html(user_mgmt_new_team())}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="card bg-base-100 border border-base-200 divide-y divide-base-200 overflow-hidden">`);
      const each_array_7 = ensure_array_like(pageTeams());
      if (each_array_7.length !== 0) {
        $$renderer2.push("<!--[-->");
        for (let $$index_9 = 0, $$length = each_array_7.length; $$index_9 < $$length; $$index_9++) {
          let team = each_array_7[$$index_9];
          const expanded = expandedTeamId === team.id;
          const detail = teamDetails.get(team.id);
          $$renderer2.push(`<div><div class="flex items-center gap-2 px-4 py-3 hover:bg-base-200/50 transition-colors"><button type="button" class="flex-1 flex items-center gap-3 text-left min-w-0">`);
          Chevron_down($$renderer2, {
            class: `size-4 opacity-40 transition-transform duration-200 shrink-0 ${stringify(expanded ? "rotate-180" : "")}`
          });
          $$renderer2.push(`<!----> <div class="min-w-0"><span class="font-semibold">${escape_html(team.name)}</span> `);
          if (team.description) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="ml-2 text-sm opacity-50 truncate">${escape_html(team.description)}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <span class="badge badge-ghost text-xs ml-auto shrink-0">${escape_html(profile_members_count({ count: team.memberCount ?? 0 }))}</span></button> <div class="flex items-center gap-1 shrink-0">`);
          if (data.canUpdateTeam) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-primary"${attr("aria-label", `Edit ${stringify(team.name)}`)}>`);
            Pencil($$renderer2, { class: "size-3.5" });
            $$renderer2.push(`<!----></button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (data.canDeleteTeam) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error"${attr("aria-label", `Delete ${stringify(team.name)}`)}>`);
            Trash_2($$renderer2, { class: "size-3.5" });
            $$renderer2.push(`<!----></button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div></div> `);
          if (expanded) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="px-4 py-4 bg-base-200/30 space-y-3">`);
            if (detail) {
              $$renderer2.push("<!--[1-->");
              if (detail.members.length > 0) {
                $$renderer2.push("<!--[0-->");
                $$renderer2.push(`<ul class="space-y-2"><!--[-->`);
                const each_array_8 = ensure_array_like(detail.members);
                for (let $$index_7 = 0, $$length2 = each_array_8.length; $$index_7 < $$length2; $$index_7++) {
                  let member = each_array_8[$$index_7];
                  $$renderer2.push(`<li class="flex items-center gap-3">`);
                  Avatar($$renderer2, { user: member, size: "sm" });
                  $$renderer2.push(`<!----> <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">`);
                  UserNameLink($$renderer2, { user: member });
                  $$renderer2.push(`<!----></div> <div class="text-xs opacity-50">${escape_html(member.username)}</div></div> `);
                  if (data.canUpdateTeam) {
                    $$renderer2.push("<!--[0-->");
                    $$renderer2.push(`<button type="button" class="btn btn-ghost btn-square btn-xs hover:btn-error shrink-0"${attr("aria-label", `Remove ${stringify(member.username)}`)}>`);
                    X($$renderer2, { class: "size-3.5" });
                    $$renderer2.push(`<!----></button>`);
                  } else {
                    $$renderer2.push("<!--[-1-->");
                  }
                  $$renderer2.push(`<!--]--></li>`);
                }
                $$renderer2.push(`<!--]--></ul>`);
              } else {
                $$renderer2.push("<!--[-1-->");
                $$renderer2.push(`<p class="text-sm opacity-50">${escape_html(user_mgmt_no_members())}</p>`);
              }
              $$renderer2.push(`<!--]--> `);
              if (data.canUpdateTeam) {
                $$renderer2.push("<!--[0-->");
                if (addMemberTeamId === team.id) {
                  $$renderer2.push("<!--[0-->");
                  $$renderer2.push(`<div class="space-y-2 pt-1"><div class="flex items-center gap-2">`);
                  $$renderer2.select(
                    {
                      class: "select select-bordered select-sm flex-1",
                      value: selectedUserId
                    },
                    ($$renderer3) => {
                      $$renderer3.option({ value: "" }, ($$renderer4) => {
                        $$renderer4.push(`${escape_html(user_mgmt_select_user())}`);
                      });
                      $$renderer3.push(`<!--[-->`);
                      const each_array_9 = ensure_array_like(data.users.filter((u) => !detail.members.some((mbr) => mbr.id === u.id)));
                      for (let $$index_8 = 0, $$length2 = each_array_9.length; $$index_8 < $$length2; $$index_8++) {
                        let u = each_array_9[$$index_8];
                        $$renderer3.option({ value: u.id }, ($$renderer4) => {
                          $$renderer4.push(`${escape_html([u.firstName, u.lastName].filter(Boolean).join(" ") || u.username)} (${escape_html(u.email)})`);
                        });
                      }
                      $$renderer3.push(`<!--]-->`);
                    }
                  );
                  $$renderer2.push(` <button type="button" class="btn btn-primary btn-sm shrink-0"${attr("disabled", !selectedUserId, true)}>${escape_html(common_add())}</button> <button type="button" class="btn btn-ghost btn-sm shrink-0">${escape_html(common_cancel())}</button></div> `);
                  {
                    $$renderer2.push("<!--[-1-->");
                  }
                  $$renderer2.push(`<!--]--></div>`);
                } else {
                  $$renderer2.push("<!--[-1-->");
                  $$renderer2.push(`<button type="button" class="btn btn-ghost btn-sm">`);
                  User_plus($$renderer2, { class: "size-4" });
                  $$renderer2.push(`<!----> ${escape_html(user_mgmt_add_member())}</button>`);
                }
                $$renderer2.push(`<!--]-->`);
              } else {
                $$renderer2.push("<!--[-1-->");
              }
              $$renderer2.push(`<!--]-->`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        }
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="px-4 py-8 text-center opacity-50 text-sm">${escape_html(user_mgmt_no_teams())}</div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex items-center justify-between"><span class="text-xs opacity-60">${escape_html(filteredTeams().length === 0 ? "No teams" : `${(teamsPage - 1) * PAGE_SIZE + 1}–${Math.min(teamsPage * PAGE_SIZE, filteredTeams().length)} of ${filteredTeams().length}`)}</span> `);
      Pagination($$renderer2, {
        count: filteredTeams().length,
        pageSize: PAGE_SIZE,
        page: teamsPage,
        onPageChange: (e) => teamsPage = e.page,
        siblingCount: 1
      });
      $$renderer2.push(`<!----></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
