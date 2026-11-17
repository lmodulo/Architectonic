import { Y as attr_class, N as derived, _ as stringify } from './index2-827svAZg.js';
import { k as escape_html, q as attr } from './attributes-CkcQfCjx.js';
import './root-D7p37-hI.js';
import './state.svelte-DnIKQJ0i.js';
import { h as hasPermission } from './permissions-DOm5Hx0d.js';
import { P as PageHeader } from './PageHeader-B2BNqFeB.js';
import { g as getLocale } from './runtime-D3odmjxS.js';
import { c as common_save } from './common_save-9ropZhmx.js';

const en_common_name = (
  /** @type {(inputs: Common_NameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Name`
    );
  }
);
const common_name = (
  /** @type {((inputs?: Common_NameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_NameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_name();
  })
);
const en_common_description = (
  /** @type {(inputs: Common_DescriptionInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Description`
    );
  }
);
const common_description = (
  /** @type {((inputs?: Common_DescriptionInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DescriptionInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_description();
  })
);
const en_workspace_settings_title = (
  /** @type {(inputs: Workspace_Settings_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Workspace Settings`
    );
  }
);
const workspace_settings_title = (
  /** @type {((inputs?: Workspace_Settings_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Workspace_Settings_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_workspace_settings_title();
  })
);
const en_workspace_settings_general = (
  /** @type {(inputs: Workspace_Settings_GeneralInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `General`
    );
  }
);
const workspace_settings_general = (
  /** @type {((inputs?: Workspace_Settings_GeneralInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Workspace_Settings_GeneralInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_workspace_settings_general();
  })
);
const en_workspace_settings_members = (
  /** @type {(inputs: Workspace_Settings_MembersInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Members`
    );
  }
);
const workspace_settings_members = (
  /** @type {((inputs?: Workspace_Settings_MembersInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Workspace_Settings_MembersInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_workspace_settings_members();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const canUpdate = derived(() => hasPermission(data.user, "workspaces", "update"));
    let editName = data.workspace?.name ?? "";
    let editDesc = data.workspace?.description ?? "";
    let saving = false;
    PageHeader($$renderer2, { title: workspace_settings_title() });
    $$renderer2.push(`<!----> <div class="tabs tabs-bordered mb-6"><button${attr_class(`tab ${stringify("tab-active")}`)}>${escape_html(workspace_settings_general())}</button> <button${attr_class(`tab ${stringify("")}`)}>${escape_html(workspace_settings_members())}</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="card bg-base-200 max-w-xl"><div class="card-body gap-4"><div class="form-control"><label class="label" for="ws-name"><span class="label-text">${escape_html(common_name())}</span></label> <input id="ws-name" type="text" class="input input-bordered"${attr("value", editName)}${attr("disabled", !canUpdate(), true)}/></div> <div class="form-control"><label class="label" for="ws-desc"><span class="label-text">${escape_html(common_description())}</span></label> <textarea id="ws-desc" class="textarea textarea-bordered" rows="3"${attr("disabled", !canUpdate(), true)}>`);
      const $$body = escape_html(editDesc);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (canUpdate()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="card-actions justify-end"><button class="btn btn-primary btn-sm"${attr("disabled", saving, true)}>${escape_html(common_save())}</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CBRB0IMT.js.map
