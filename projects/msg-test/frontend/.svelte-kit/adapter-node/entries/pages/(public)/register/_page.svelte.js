import { N as head } from "../../../../chunks/index2.js";
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
import { c as common_email } from "../../../../chunks/common_email.js";
import { c as common_password } from "../../../../chunks/common_password.js";
const en_auth_already_have_account = (
  /** @type {(inputs: Auth_Already_Have_AccountInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Already have an account?`
    );
  }
);
const auth_already_have_account = (
  /** @type {((inputs?: Auth_Already_Have_AccountInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Already_Have_AccountInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_already_have_account();
  })
);
const en_auth_sign_in_link = (
  /** @type {(inputs: Auth_Sign_In_LinkInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sign in`
    );
  }
);
const auth_sign_in_link = (
  /** @type {((inputs?: Auth_Sign_In_LinkInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sign_In_LinkInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_sign_in_link();
  })
);
const en_auth_register_title = (
  /** @type {(inputs: Auth_Register_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Create Account`
    );
  }
);
const auth_register_title = (
  /** @type {((inputs?: Auth_Register_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Register_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_register_title();
  })
);
const en_auth_register_subtitle = (
  /** @type {(inputs: Auth_Register_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Get started today.`
    );
  }
);
const auth_register_subtitle = (
  /** @type {((inputs?: Auth_Register_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Register_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_register_subtitle();
  })
);
const en_auth_register_button = (
  /** @type {(inputs: Auth_Register_ButtonInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Create Account`
    );
  }
);
const auth_register_button = (
  /** @type {((inputs?: Auth_Register_ButtonInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Register_ButtonInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_register_button();
  })
);
const en_auth_registration_closed = (
  /** @type {(inputs: Auth_Registration_ClosedInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Registration is currently closed.`
    );
  }
);
const auth_registration_closed = (
  /** @type {((inputs?: Auth_Registration_ClosedInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Registration_ClosedInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_registration_closed();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    head("1bduu6j", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(auth_register_title())}</title>`);
      });
    });
    AuthShell($$renderer2, {
      title: auth_register_title(),
      subtitle: auth_register_subtitle(),
      brandName: data.brandName,
      brandLogo: data.brandLogo,
      children: ($$renderer3) => {
        if (data.registrationOpen === false) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-warning text-sm">${escape_html(auth_registration_closed())}</div> <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/login" class="link">${escape_html(common_back_to_sign_in())}</a></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          if (form?.error) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(form.error)}</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <form method="POST" class="space-y-4"><label class="flex flex-col gap-1"><span>${escape_html(common_username())}</span> <input class="input" type="text" name="username"${attr("value", form?.username ?? "")} required="" minlength="2" maxlength="50" autocomplete="username" placeholder="johndoe"/></label> <label class="flex flex-col gap-1"><span>${escape_html(common_email())}</span> <input class="input" type="email" name="email"${attr("value", form?.email ?? "")} required="" autocomplete="email" placeholder="you@example.com"/></label> <label class="flex flex-col gap-1"><span>${escape_html(common_password())}</span> <input class="input" type="password" name="password" required="" minlength="8" autocomplete="new-password" placeholder="••••••••"/></label> <button type="submit" class="btn btn-primary">${escape_html(auth_register_button())}</button></form> <div class="flex items-center justify-center gap-1.5 text-[0.8125rem] text-[var(--color-primary-content)] pt-1">${escape_html(auth_already_have_account())} <a href="/login" class="link">${escape_html(auth_sign_in_link())}</a></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
export {
  _page as default
};
