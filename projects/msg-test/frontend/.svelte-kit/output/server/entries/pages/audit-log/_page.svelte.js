import { N as head, Q as ensure_array_like, P as attr_class, K as stringify, z as derived } from "../../../chunks/index2.js";
import { g as goto } from "../../../chunks/client.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { P as Pagination } from "../../../chunks/Pagination.js";
import { A as Avatar } from "../../../chunks/Avatar.js";
import { S as Search } from "../../../chunks/search.js";
import { C as Chevron_down } from "../../../chunks/chevron-down.js";
import { g as getLocale } from "../../../chunks/runtime.js";
import { k as escape_html, p as attr } from "../../../chunks/attributes.js";
const en_common_apply = (
  /** @type {(inputs: Common_ApplyInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Apply`
    );
  }
);
const common_apply = (
  /** @type {((inputs?: Common_ApplyInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ApplyInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_apply();
  })
);
const en_audit_title = (
  /** @type {(inputs: Audit_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Audit Log`
    );
  }
);
const audit_title = (
  /** @type {((inputs?: Audit_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_title();
  })
);
const en_audit_subtitle = (
  /** @type {(inputs: Audit_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Track actions taken by workspace members`
    );
  }
);
const audit_subtitle = (
  /** @type {((inputs?: Audit_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_subtitle();
  })
);
const en_audit_search = (
  /** @type {(inputs: Audit_SearchInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Search by username…`
    );
  }
);
const audit_search = (
  /** @type {((inputs?: Audit_SearchInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_SearchInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_search();
  })
);
const en_audit_col_timestamp = (
  /** @type {(inputs: Audit_Col_TimestampInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Timestamp`
    );
  }
);
const audit_col_timestamp = (
  /** @type {((inputs?: Audit_Col_TimestampInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Col_TimestampInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_col_timestamp();
  })
);
const en_audit_col_actor = (
  /** @type {(inputs: Audit_Col_ActorInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Actor`
    );
  }
);
const audit_col_actor = (
  /** @type {((inputs?: Audit_Col_ActorInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Col_ActorInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_col_actor();
  })
);
const en_audit_col_action = (
  /** @type {(inputs: Audit_Col_ActionInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Action`
    );
  }
);
const audit_col_action = (
  /** @type {((inputs?: Audit_Col_ActionInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Col_ActionInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_col_action();
  })
);
const en_audit_col_resource = (
  /** @type {(inputs: Audit_Col_ResourceInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Resource`
    );
  }
);
const audit_col_resource = (
  /** @type {((inputs?: Audit_Col_ResourceInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Col_ResourceInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_col_resource();
  })
);
const en_audit_col_ip = (
  /** @type {(inputs: Audit_Col_IpInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `IP`
    );
  }
);
const audit_col_ip = (
  /** @type {((inputs?: Audit_Col_IpInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Col_IpInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_col_ip();
  })
);
const en_audit_no_entries = (
  /** @type {(inputs: Audit_No_EntriesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No audit entries found.`
    );
  }
);
const audit_no_entries = (
  /** @type {((inputs?: Audit_No_EntriesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_No_EntriesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_no_entries();
  })
);
const en_audit_collapse = (
  /** @type {(inputs: Audit_CollapseInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Collapse`
    );
  }
);
const audit_collapse = (
  /** @type {((inputs?: Audit_CollapseInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_CollapseInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_collapse();
  })
);
const en_audit_expand = (
  /** @type {(inputs: Audit_ExpandInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Expand`
    );
  }
);
const audit_expand = (
  /** @type {((inputs?: Audit_ExpandInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_ExpandInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_expand();
  })
);
const en_audit_cat_all = (
  /** @type {(inputs: Audit_Cat_AllInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `All Actions`
    );
  }
);
const audit_cat_all = (
  /** @type {((inputs?: Audit_Cat_AllInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_AllInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_all();
  })
);
const en_audit_cat_auth = (
  /** @type {(inputs: Audit_Cat_AuthInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Auth`
    );
  }
);
const audit_cat_auth = (
  /** @type {((inputs?: Audit_Cat_AuthInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_AuthInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_auth();
  })
);
const en_audit_cat_users = (
  /** @type {(inputs: Audit_Cat_UsersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Users`
    );
  }
);
const audit_cat_users = (
  /** @type {((inputs?: Audit_Cat_UsersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_UsersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_users();
  })
);
const en_audit_cat_roles = (
  /** @type {(inputs: Audit_Cat_RolesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Roles`
    );
  }
);
const audit_cat_roles = (
  /** @type {((inputs?: Audit_Cat_RolesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_RolesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_roles();
  })
);
const en_audit_cat_teams = (
  /** @type {(inputs: Audit_Cat_TeamsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Teams`
    );
  }
);
const audit_cat_teams = (
  /** @type {((inputs?: Audit_Cat_TeamsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_TeamsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_teams();
  })
);
const en_audit_cat_workspace = (
  /** @type {(inputs: Audit_Cat_WorkspaceInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Workspace`
    );
  }
);
const audit_cat_workspace = (
  /** @type {((inputs?: Audit_Cat_WorkspaceInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_WorkspaceInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_workspace();
  })
);
const en_audit_cat_messages = (
  /** @type {(inputs: Audit_Cat_MessagesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Messages`
    );
  }
);
const audit_cat_messages = (
  /** @type {((inputs?: Audit_Cat_MessagesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_MessagesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_messages();
  })
);
const en_audit_cat_automation = (
  /** @type {(inputs: Audit_Cat_AutomationInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Automation`
    );
  }
);
const audit_cat_automation = (
  /** @type {((inputs?: Audit_Cat_AutomationInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_AutomationInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_automation();
  })
);
const en_audit_cat_events = (
  /** @type {(inputs: Audit_Cat_EventsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Events`
    );
  }
);
const audit_cat_events = (
  /** @type {((inputs?: Audit_Cat_EventsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_EventsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_events();
  })
);
const en_audit_cat_settings = (
  /** @type {(inputs: Audit_Cat_SettingsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Settings`
    );
  }
);
const audit_cat_settings = (
  /** @type {((inputs?: Audit_Cat_SettingsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Audit_Cat_SettingsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_audit_cat_settings();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const PAGE_SIZE = 20;
    const ACTION_CATEGORIES = derived(() => [
      { value: "", label: audit_cat_all() },
      { value: "auth", label: audit_cat_auth() },
      { value: "user", label: audit_cat_users() },
      { value: "role", label: audit_cat_roles() },
      { value: "team", label: audit_cat_teams() },
      { value: "workspace", label: audit_cat_workspace() },
      { value: "message", label: audit_cat_messages() },
      { value: "automation", label: audit_cat_automation() },
      { value: "event", label: audit_cat_events() },
      { value: "settings", label: audit_cat_settings() }
    ]);
    const CATEGORY_BADGE = {
      auth: "badge-primary",
      user: "badge-secondary",
      role: "badge-accent",
      team: "badge-info",
      workspace: "badge-warning",
      message: "badge-success",
      automation: "badge-neutral",
      event: "badge-ghost",
      settings: "badge-error"
    };
    let q = data.q;
    let action = data.action;
    let expanded = /* @__PURE__ */ new Set();
    function navigate(page, overrideQ = q, overrideAction = action) {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (overrideQ.trim()) params.set("q", overrideQ.trim());
      if (overrideAction) params.set("action", overrideAction);
      goto();
    }
    function applyFilters() {
      navigate(1);
    }
    function handlePageChange(e) {
      navigate(e.page);
    }
    function parseAction(raw) {
      const dot = raw.indexOf(".");
      return dot === -1 ? { category: raw, verb: "" } : {
        category: raw.slice(0, dot),
        verb: raw.slice(dot + 1).replace(/_/g, " ")
      };
    }
    function relativeTime(date) {
      const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1e3);
      if (secs < 60) return `${secs}s ago`;
      if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
      if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
      return `${Math.floor(secs / 86400)}d ago`;
    }
    head("1rurxev", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(audit_title())}</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-6">`);
    PageHeader($$renderer2, { title: audit_title(), subtitle: audit_subtitle() });
    $$renderer2.push(`<!----> `);
    if (data.error) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(data.error)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex items-center gap-3"><label class="input input-bordered flex items-center gap-2 flex-1">`);
    Search($$renderer2, { class: "size-4 opacity-50" });
    $$renderer2.push(`<!----> <input type="search"${attr("placeholder", audit_search())} class="grow"${attr("value", q)}/></label> `);
    $$renderer2.select(
      {
        class: "select select-bordered w-48",
        value: action,
        onchange: applyFilters
      },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(ACTION_CATEGORIES());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let cat = each_array[$$index];
          $$renderer3.option({ value: cat.value }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(cat.label)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(` <button type="button" class="btn btn-primary">${escape_html(common_apply())}</button></div> <div class="card bg-base-100 border border-base-200 overflow-hidden"><table class="table table-sm"><thead><tr><th>${escape_html(audit_col_timestamp())}</th><th>${escape_html(audit_col_actor())}</th><th>${escape_html(audit_col_action())}</th><th>${escape_html(audit_col_resource())}</th><th>${escape_html(audit_col_ip())}</th><th></th></tr></thead><tbody>`);
    const each_array_1 = ensure_array_like(data.entries ?? []);
    if (each_array_1.length !== 0) {
      $$renderer2.push("<!--[-->");
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let entry = each_array_1[$$index_1];
        const { category, verb } = parseAction(entry.action);
        $$renderer2.push(`<tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors"><td><span${attr("title", new Date(entry.createdAt).toLocaleString())} class="text-xs opacity-70 whitespace-nowrap">${escape_html(relativeTime(entry.createdAt))}</span></td><td><div class="flex items-center gap-2">`);
        Avatar($$renderer2, { user: { username: entry.username }, size: "xs" });
        $$renderer2.push(`<!----> <span class="text-sm font-medium">${escape_html(entry.username)}</span></div></td><td><div class="flex items-center gap-1.5 flex-wrap"><span${attr_class(`badge badge-sm ${stringify(CATEGORY_BADGE[category] ?? "badge-ghost")}`)}>${escape_html(category)}</span> `);
        if (verb) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="text-xs opacity-70">${escape_html(verb)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></td><td class="font-mono text-xs opacity-60">`);
        if (entry.resourceId) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span${attr("title", entry.resourceId)} class="truncate max-w-[8rem] inline-block align-bottom">${escape_html(entry.resourceId.length > 12 ? entry.resourceId.slice(-8) : entry.resourceId)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<span class="opacity-40">—</span>`);
        }
        $$renderer2.push(`<!--]--></td><td class="font-mono text-xs opacity-60">${escape_html(entry.ip ?? "—")}</td><td class="w-8">`);
        if (Object.keys(entry.meta).length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button type="button" class="btn btn-ghost btn-square btn-xs"${attr("aria-label", `${stringify(expanded.has(entry.id) ? audit_collapse() : audit_expand())} details`)}>`);
          Chevron_down($$renderer2, {
            class: `size-3.5 transition-transform duration-150 ${stringify(expanded.has(entry.id) ? "rotate-180" : "")}`
          });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></td></tr> `);
        if (expanded.has(entry.id) && Object.keys(entry.meta).length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<tr class="bg-base-200/40"><td colspan="6" class="px-4 py-3"><pre class="text-xs font-mono whitespace-pre-wrap break-all opacity-80">${escape_html(JSON.stringify(entry.meta, null, 2))}</pre></td></tr>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<tr><td colspan="6" class="text-center opacity-50 py-8 text-sm">${escape_html(audit_no_entries())}</td></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table> <div class="flex items-center justify-between px-4 py-2 border-t border-base-200"><span class="text-xs opacity-60">${escape_html(data.count === 0 ? "No entries" : `${(data.page - 1) * PAGE_SIZE + 1}–${Math.min(data.page * PAGE_SIZE, data.count)} of ${data.count}`)}</span> `);
    Pagination($$renderer2, {
      count: data.count,
      pageSize: PAGE_SIZE,
      page: data.page,
      onPageChange: handlePageChange,
      siblingCount: 1
    });
    $$renderer2.push(`<!----></div></div></div>`);
  });
}
export {
  _page as default
};
