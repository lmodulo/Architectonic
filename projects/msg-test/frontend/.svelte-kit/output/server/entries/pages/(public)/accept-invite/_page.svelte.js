import { N as head, P as attr_class, K as stringify, z as derived } from "../../../../chunks/index2.js";
import { k as escape_html, p as attr } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { A as AuthShell } from "../../../../chunks/AuthShell.js";
import { g as getLocale } from "../../../../chunks/runtime.js";
import { c as common_back_to_sign_in } from "../../../../chunks/common_back_to_sign_in.js";
import { c as common_username } from "../../../../chunks/common_username.js";
import { c as common_password } from "../../../../chunks/common_password.js";
import { a as auth_reset_confirm_password, b as auth_reset_mismatch } from "../../../../chunks/auth_reset_mismatch.js";
const en_auth_invite_title = (
  /** @type {(inputs: Auth_Invite_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Accept Invitation`
    );
  }
);
const auth_invite_title = (
  /** @type {((inputs?: Auth_Invite_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Invite_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_invite_title();
  })
);
const en_auth_invite_subtitle = (
  /** @type {(inputs: Auth_Invite_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Set your username and password to activate your account.`
    );
  }
);
const auth_invite_subtitle = (
  /** @type {((inputs?: Auth_Invite_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Invite_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_invite_subtitle();
  })
);
const en_auth_invite_button = (
  /** @type {(inputs: Auth_Invite_ButtonInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Activate Account`
    );
  }
);
const auth_invite_button = (
  /** @type {((inputs?: Auth_Invite_ButtonInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Invite_ButtonInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_invite_button();
  })
);
const en_auth_invite_invalid = (
  /** @type {(inputs: Auth_Invite_InvalidInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Invalid invitation link. Please contact your administrator.`
    );
  }
);
const auth_invite_invalid = (
  /** @type {((inputs?: Auth_Invite_InvalidInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Invite_InvalidInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_invite_invalid();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let password = "";
    let confirm = "";
    let mismatch = derived(() => confirm.length > 0 && password !== confirm);
    head("1vb4nyy", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(auth_invite_title())}</title>`);
      });
    });
    AuthShell($$renderer2, {
      title: auth_invite_title(),
      subtitle: auth_invite_subtitle(),
      brandName: data.brandName,
      brandLogo: data.brandLogo,
      children: ($$renderer3) => {
        if (!data.token) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(auth_invite_invalid())}</div> <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/login" class="link">${escape_html(common_back_to_sign_in())}</a></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          if (form?.error) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(form.error)}</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <form method="POST" class="space-y-4"><input type="hidden" name="token"${attr("value", data.token)}/> <label class="flex flex-col gap-1"><span>${escape_html(common_username())}</span> <input class="input" type="text" name="username" required="" minlength="2" maxlength="50" autocomplete="username" placeholder="johndoe"/></label> <label class="flex flex-col gap-1"><span>${escape_html(common_password())}</span> <input class="input" type="password" name="password"${attr("value", password)} required="" minlength="8" autocomplete="new-password" placeholder="••••••••"/></label> <label class="flex flex-col gap-1"><span>${escape_html(auth_reset_confirm_password())}</span> <input${attr_class(`input ${stringify(mismatch() ? "input-error" : "")}`)} type="password" name="confirm"${attr("value", confirm)} required="" autocomplete="new-password" placeholder="••••••••"/> `);
          if (mismatch()) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="text-xs text-error">${escape_html(auth_reset_mismatch())}</span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></label> <button type="submit" class="btn btn-primary"${attr("disabled", mismatch(), true)}>${escape_html(auth_invite_button())}</button></form> <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/login" class="link">${escape_html(common_back_to_sign_in())}</a></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
export {
  _page as default
};
