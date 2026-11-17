import { P as attr_class, Q as ensure_array_like, K as stringify, z as derived } from "../../../chunks/index2.js";
import { m as clsx, k as escape_html, p as attr } from "../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { h as hasPermission } from "../../../chunks/permissions.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { g as getLocale } from "../../../chunks/runtime.js";
import { c as common_edit } from "../../../chunks/common_edit.js";
import { c as common_save } from "../../../chunks/common_save.js";
import { c as common_cancel } from "../../../chunks/common_cancel.js";
const en_common_upload = (
  /** @type {(inputs: Common_UploadInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Upload`
    );
  }
);
const common_upload = (
  /** @type {((inputs?: Common_UploadInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_UploadInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_upload();
  })
);
const en_common_remove = (
  /** @type {(inputs: Common_RemoveInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Remove`
    );
  }
);
const common_remove = (
  /** @type {((inputs?: Common_RemoveInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_RemoveInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_remove();
  })
);
const en_common_clear = (
  /** @type {(inputs: Common_ClearInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Clear`
    );
  }
);
const common_clear = (
  /** @type {((inputs?: Common_ClearInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ClearInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_clear();
  })
);
const en_common_enabled = (
  /** @type {(inputs: Common_EnabledInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Enabled`
    );
  }
);
const common_enabled = (
  /** @type {((inputs?: Common_EnabledInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_EnabledInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_enabled();
  })
);
const en_common_disabled = (
  /** @type {(inputs: Common_DisabledInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Disabled`
    );
  }
);
const common_disabled = (
  /** @type {((inputs?: Common_DisabledInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DisabledInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_disabled();
  })
);
const en_settings_title = (
  /** @type {(inputs: Settings_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Settings`
    );
  }
);
const settings_title = (
  /** @type {((inputs?: Settings_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_title();
  })
);
const en_settings_subtitle = (
  /** @type {(inputs: Settings_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Application-wide configuration. Changes take effect immediately.`
    );
  }
);
const settings_subtitle = (
  /** @type {((inputs?: Settings_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_subtitle();
  })
);
const en_settings_brand = (
  /** @type {(inputs: Settings_BrandInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Brand`
    );
  }
);
const settings_brand = (
  /** @type {((inputs?: Settings_BrandInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_BrandInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_brand();
  })
);
const en_settings_brand_name = (
  /** @type {(inputs: Settings_Brand_NameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Brand Name`
    );
  }
);
const settings_brand_name = (
  /** @type {((inputs?: Settings_Brand_NameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Brand_NameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_brand_name();
  })
);
const en_settings_logo = (
  /** @type {(inputs: Settings_LogoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Logo`
    );
  }
);
const settings_logo = (
  /** @type {((inputs?: Settings_LogoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_LogoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_logo();
  })
);
const en_settings_logo_hint = (
  /** @type {(inputs: Settings_Logo_HintInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Square PNG or SVG recommended, at least 64×64px.`
    );
  }
);
const settings_logo_hint = (
  /** @type {((inputs?: Settings_Logo_HintInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Logo_HintInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_logo_hint();
  })
);
const en_settings_brand_hint = (
  /** @type {(inputs: Settings_Brand_HintInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Choose one: Brand Name (text) or Logo (image). Setting one clears the other.`
    );
  }
);
const settings_brand_hint = (
  /** @type {((inputs?: Settings_Brand_HintInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Brand_HintInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_brand_hint();
  })
);
const en_settings_no_settings = (
  /** @type {(inputs: Settings_No_SettingsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No settings found.`
    );
  }
);
const settings_no_settings = (
  /** @type {((inputs?: Settings_No_SettingsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_No_SettingsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_settings_no_settings();
  })
);
function LogoIcon($$renderer, $$props) {
  let { class: cls = "" } = $$props;
  $$renderer.push(`<svg${attr_class(clsx(cls))} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 6l10-4 10 4v12l-10 4L2 18V6zm2 1.5v9l8 3.2 8-3.2v-9l-8-3.2-8 3.2zM12 4.8L5.6 7.3 12 9.8l6.4-2.5L12 4.8zM6 9.2v7.2l5.5 2.2V11.4L6 9.2zm7.5 9.4 5.5-2.2V9.2l-5.5 2.2v7.2z"></path></svg>`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let editingKey = null;
    let editValue = null;
    let saving = false;
    const canEdit = derived(() => hasPermission(data.user, "settings", "update"));
    const currentLogo = derived(() => data.settings.find((s) => s.key === "brand.logo")?.value ?? "");
    const currentBrandName = derived(() => data.settings.find((s) => s.key === "brand.name")?.value ?? "");
    let uploading = false;
    let savingBrandName = false;
    const genericSettings = derived(() => data.settings.filter((s) => s.key !== "brand.name" && s.key !== "brand.logo"));
    $$renderer2.push(`<div class="space-y-6">`);
    PageHeader($$renderer2, { title: settings_title(), subtitle: settings_subtitle() });
    $$renderer2.push(`<!----> <div class="card bg-base-100 border border-base-200 p-5 space-y-4"><div><h2 class="font-semibold text-sm">${escape_html(settings_brand())}</h2> <p class="text-xs opacity-50 mt-0.5">${escape_html(settings_brand_hint())}</p></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="space-y-1"><p class="text-xs font-medium opacity-70">${escape_html(settings_brand_name())}</p> `);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="flex items-center gap-2"><span class="text-sm font-mono opacity-80 flex-1">${escape_html(currentBrandName() || "—")}</span> `);
      if (canEdit()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button" class="btn btn-ghost btn-sm shrink-0">${escape_html(common_edit())}</button> `);
        if (currentBrandName()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button type="button" class="btn btn-outline btn-error btn-sm shrink-0"${attr("disabled", savingBrandName, true)}>${escape_html(common_clear())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="space-y-1"><p class="text-xs font-medium opacity-70">${escape_html(settings_logo())}</p> <div class="flex items-center gap-4"><div class="size-12 shrink-0 flex items-center justify-center rounded-lg border border-base-300 overflow-hidden bg-base-200">`);
    if (currentLogo()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<img${attr("src", currentLogo())} alt="Brand logo" class="size-full object-contain p-1"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      LogoIcon($$renderer2, { class: "size-6 opacity-40" });
    }
    $$renderer2.push(`<!--]--></div> <div class="flex-1 space-y-2">`);
    if (canEdit()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="flex items-center gap-2 flex-wrap"><input type="file" class="file-input file-input-bordered file-input-sm flex-1 min-w-0" accept="image/*"/> <button type="button" class="btn btn-primary btn-sm shrink-0"${attr("disabled", true, true)}>${escape_html(common_upload())}</button> `);
      if (currentLogo()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button type="button" class="btn btn-outline btn-error btn-sm shrink-0"${attr("disabled", uploading, true)}>${escape_html(common_remove())}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <p class="text-xs opacity-50">${escape_html(settings_logo_hint())}</p></div></div></div></div> <div class="card bg-base-100 border border-base-200 divide-y divide-base-200"><!--[-->`);
    const each_array = ensure_array_like(genericSettings());
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let setting = each_array[$$index_1];
      $$renderer2.push(`<div class="flex items-start gap-4 px-5 py-4"><div class="flex-1 min-w-0"><p class="text-sm font-medium">${escape_html(setting.label)}</p> <p class="text-xs opacity-50 mt-0.5">${escape_html(setting.description)}</p> <p class="text-xs opacity-30 mt-1 font-mono">${escape_html(setting.key)}</p></div> <div class="flex items-center gap-2 shrink-0">`);
      if (editingKey === setting.key) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="flex items-center gap-2">`);
        if (setting.type === "boolean") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="checkbox"${attr("checked", editValue, true)}/> <span class="text-sm">${escape_html(editValue ? common_enabled() : common_disabled())}</span></label>`);
        } else if (setting.type === "select" && setting.options) {
          $$renderer2.push("<!--[1-->");
          $$renderer2.select(
            {
              class: "select select-bordered select-sm",
              value: editValue,
              onchange: (e) => editValue = e.target.value
            },
            ($$renderer3) => {
              $$renderer3.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(setting.options);
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                let opt = each_array_1[$$index];
                $$renderer3.option({ value: opt }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(opt)}`);
                });
              }
              $$renderer3.push(`<!--]-->`);
            }
          );
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<input${attr("type", setting.type === "number" ? "number" : "text")} class="input input-bordered input-sm w-48"${attr("value", editValue)}/>`);
        }
        $$renderer2.push(`<!--]--> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <button type="button" class="btn btn-primary btn-sm"${attr("disabled", saving, true)}>${escape_html(common_save())}</button> <button type="button" class="btn btn-ghost btn-sm"${attr("disabled", saving, true)}>${escape_html(common_cancel())}</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<span class="text-sm font-mono opacity-80">`);
        if (setting.type === "boolean") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span${attr_class(`badge ${stringify(setting.value ? "badge-success" : "badge-ghost")} text-xs`)}>${escape_html(setting.value ? common_enabled() : common_disabled())}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`${escape_html(setting.value)}`);
        }
        $$renderer2.push(`<!--]--></span> `);
        if (canEdit()) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button type="button" class="btn btn-ghost btn-sm">${escape_html(common_edit())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (!genericSettings().length) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="px-5 py-8 text-sm opacity-50 text-center">${escape_html(settings_no_settings())}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
