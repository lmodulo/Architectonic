import { N as head, z as derived } from "../../../../chunks/index2.js";
import { k as escape_html, p as attr } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { A as AuthShell } from "../../../../chunks/AuthShell.js";
import { p as page } from "../../../../chunks/index3.js";
import { g as getLocale } from "../../../../chunks/runtime.js";
import { c as common_email } from "../../../../chunks/common_email.js";
import { c as common_password } from "../../../../chunks/common_password.js";
const en_auth_sign_in_title = (
  /** @type {(inputs: Auth_Sign_In_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sign In`
    );
  }
);
const auth_sign_in_title = (
  /** @type {((inputs?: Auth_Sign_In_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sign_In_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_sign_in_title();
  })
);
const en_auth_sign_in_subtitle = (
  /** @type {(inputs: Auth_Sign_In_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Welcome back.`
    );
  }
);
const auth_sign_in_subtitle = (
  /** @type {((inputs?: Auth_Sign_In_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sign_In_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_sign_in_subtitle();
  })
);
const en_auth_sign_in_button = (
  /** @type {(inputs: Auth_Sign_In_ButtonInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sign In`
    );
  }
);
const auth_sign_in_button = (
  /** @type {((inputs?: Auth_Sign_In_ButtonInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sign_In_ButtonInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_sign_in_button();
  })
);
const en_auth_forgot_password = (
  /** @type {(inputs: Auth_Forgot_PasswordInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Forgot password?`
    );
  }
);
const auth_forgot_password = (
  /** @type {((inputs?: Auth_Forgot_PasswordInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Forgot_PasswordInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_forgot_password();
  })
);
const en_auth_create_account = (
  /** @type {(inputs: Auth_Create_AccountInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Create account`
    );
  }
);
const auth_create_account = (
  /** @type {((inputs?: Auth_Create_AccountInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Create_AccountInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_create_account();
  })
);
const en_auth_password_reset_success = (
  /** @type {(inputs: Auth_Password_Reset_SuccessInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Password reset successfully. Sign in with your new password.`
    );
  }
);
const auth_password_reset_success = (
  /** @type {((inputs?: Auth_Password_Reset_SuccessInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Password_Reset_SuccessInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_password_reset_success();
  })
);
const en_auth_account_activated = (
  /** @type {(inputs: Auth_Account_ActivatedInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Account activated! Sign in with your new credentials.`
    );
  }
);
const auth_account_activated = (
  /** @type {((inputs?: Auth_Account_ActivatedInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Account_ActivatedInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_account_activated();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let resetSuccess = derived(() => page.url.searchParams.get("reset") === "1");
    let inviteSuccess = derived(() => page.url.searchParams.get("invited") === "1");
    head("iv8lg3", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(auth_sign_in_title())}</title>`);
      });
    });
    AuthShell($$renderer2, {
      title: auth_sign_in_title(),
      subtitle: auth_sign_in_subtitle(),
      brandName: data.brandName,
      brandLogo: data.brandLogo,
      children: ($$renderer3) => {
        if (resetSuccess()) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-success text-sm">${escape_html(auth_password_reset_success())}</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (inviteSuccess()) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-success text-sm">${escape_html(auth_account_activated())}</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (form?.error) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(form.error)}</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <form method="POST" class="space-y-4"><label class="flex flex-col gap-1"><span>${escape_html(common_email())}</span> <input class="input" type="email" name="email"${attr("value", form?.email ?? "")} required="" autocomplete="email" placeholder="you@example.com"/></label> <label class="flex flex-col gap-1"><span>${escape_html(common_password())}</span> <input class="input" type="password" name="password" required="" autocomplete="current-password" placeholder="••••••••"/></label> <button type="submit" class="btn btn-primary">${escape_html(auth_sign_in_button())}</button></form> <div class="flex items-center justify-center gap-2.5 text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/forgot-password" class="link">${escape_html(auth_forgot_password())}</a> <span>·</span> <a href="/register" class="link">${escape_html(auth_create_account())}</a></div>`);
      }
    });
  });
}
export {
  _page as default
};
