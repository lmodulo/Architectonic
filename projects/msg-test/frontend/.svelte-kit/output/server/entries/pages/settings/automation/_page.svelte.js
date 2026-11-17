import { Q as ensure_array_like, z as derived } from "../../../../chunks/index2.js";
import { k as escape_html, p as attr } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { h as hasPermission } from "../../../../chunks/permissions.js";
import { P as PageHeader } from "../../../../chunks/PageHeader.js";
import { g as getLocale } from "../../../../chunks/runtime.js";
import { c as common_edit } from "../../../../chunks/common_edit.js";
const en_common_delete = (
  /** @type {(inputs: Common_DeleteInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Delete`
    );
  }
);
const common_delete = (
  /** @type {((inputs?: Common_DeleteInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DeleteInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_delete();
  })
);
const en_automation_title = (
  /** @type {(inputs: Automation_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Automation`
    );
  }
);
const automation_title = (
  /** @type {((inputs?: Automation_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_title();
  })
);
const en_automation_subtitle = (
  /** @type {(inputs: Automation_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Event-driven rules that connect modules and trigger actions.`
    );
  }
);
const automation_subtitle = (
  /** @type {((inputs?: Automation_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_subtitle();
  })
);
const en_automation_new_rule = (
  /** @type {(inputs: Automation_New_RuleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `New Rule`
    );
  }
);
const automation_new_rule = (
  /** @type {((inputs?: Automation_New_RuleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_New_RuleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_new_rule();
  })
);
const en_automation_no_rules = (
  /** @type {(inputs: Automation_No_RulesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No automation rules yet.`
    );
  }
);
const automation_no_rules = (
  /** @type {((inputs?: Automation_No_RulesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_No_RulesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_no_rules();
  })
);
const en_automation_col_name = (
  /** @type {(inputs: Automation_Col_NameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Name`
    );
  }
);
const automation_col_name = (
  /** @type {((inputs?: Automation_Col_NameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_Col_NameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_col_name();
  })
);
const en_automation_col_trigger = (
  /** @type {(inputs: Automation_Col_TriggerInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Trigger`
    );
  }
);
const automation_col_trigger = (
  /** @type {((inputs?: Automation_Col_TriggerInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_Col_TriggerInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_col_trigger();
  })
);
const en_automation_col_actions = (
  /** @type {(inputs: Automation_Col_ActionsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Actions`
    );
  }
);
const automation_col_actions = (
  /** @type {((inputs?: Automation_Col_ActionsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_Col_ActionsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_col_actions();
  })
);
const en_automation_col_status = (
  /** @type {(inputs: Automation_Col_StatusInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Status`
    );
  }
);
const automation_col_status = (
  /** @type {((inputs?: Automation_Col_StatusInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_Col_StatusInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_col_status();
  })
);
const en_automation_col_logs = (
  /** @type {(inputs: Automation_Col_LogsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Logs`
    );
  }
);
const automation_col_logs = (
  /** @type {((inputs?: Automation_Col_LogsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Automation_Col_LogsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_automation_col_logs();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const TRIGGER_LABELS = {
      "auth.user.registered": "User registered",
      "auth.user.invited": "User invited",
      "auth.user.invite.accepted": "User accepted invite",
      "calendar.event.created": "Calendar event created"
    };
    const canEdit = derived(() => hasPermission(data.user, "automation", "update"));
    const canCreate = derived(() => hasPermission(data.user, "automation", "create"));
    const canDelete = derived(() => hasPermission(data.user, "automation", "delete"));
    $$renderer2.push(`<div class="space-y-6"><div class="flex items-center justify-between">`);
    PageHeader($$renderer2, {
      title: automation_title(),
      subtitle: automation_subtitle()
    });
    $$renderer2.push(`<!----> `);
    if (canCreate()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button type="button" class="btn btn-primary btn-sm">${escape_html(automation_new_rule())}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="card bg-base-100 border border-base-200 overflow-hidden">`);
    if (data.rules.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="px-5 py-10 text-sm opacity-50 text-center">${escape_html(automation_no_rules())}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<table class="table table-sm w-full"><thead><tr class="text-xs opacity-50"><th>${escape_html(automation_col_name())}</th><th>${escape_html(automation_col_trigger())}</th><th class="text-center">${escape_html(automation_col_actions())}</th><th class="text-center">${escape_html(automation_col_status())}</th><th></th></tr></thead><tbody><!--[-->`);
      const each_array = ensure_array_like(data.rules);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let rule = each_array[$$index];
        $$renderer2.push(`<tr class="odd:bg-transparent even:bg-black/[.025] dark:even:bg-white/[.035] hover:bg-black/[.05] dark:hover:bg-white/[.06] transition-colors"><td class="font-medium text-sm">${escape_html(rule.name)}</td><td class="text-sm"><span class="badge badge-ghost badge-sm font-mono">${escape_html(TRIGGER_LABELS[rule.trigger.event] ?? rule.trigger.event)}</span></td><td class="text-center text-sm">${escape_html(rule.actions.length)}</td><td class="text-center"><input type="checkbox" class="toggle toggle-success toggle-sm"${attr("checked", rule.enabled, true)}${attr("disabled", !canEdit(), true)}/></td><td class="text-right"><div class="flex items-center justify-end gap-1"><button type="button" class="btn btn-ghost btn-xs">${escape_html(automation_col_logs())}</button> `);
        if (canEdit()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button type="button" class="btn btn-ghost btn-xs">${escape_html(common_edit())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (canDelete()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button type="button" class="btn btn-ghost btn-xs text-error">${escape_html(common_delete())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
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
