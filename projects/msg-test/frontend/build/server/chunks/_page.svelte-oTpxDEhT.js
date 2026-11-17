import { V as head, Y as attr_class, _ as stringify, N as derived } from './index2-827svAZg.js';
import { k as escape_html, q as attr } from './attributes-CkcQfCjx.js';
import './root-D7p37-hI.js';
import './state.svelte-DnIKQJ0i.js';
import { A as AuthShell } from './AuthShell-8r0Ue48P.js';
import { g as getLocale } from './runtime-D3odmjxS.js';
import { a as auth_reset_confirm_password, b as auth_reset_mismatch } from './auth_reset_mismatch-Cvslg4Y4.js';
import { c as common_back_to_sign_in } from './common_back_to_sign_in-CsC8Welt.js';
import './MarketingNav-7tgkJVg6.js';
import './Logo-BhJW--c5.js';

const en_auth_reset_title = (
  /** @type {(inputs: Auth_Reset_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Reset Password`
    );
  }
);
const auth_reset_title = (
  /** @type {((inputs?: Auth_Reset_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_title();
  })
);
const en_auth_reset_subtitle = (
  /** @type {(inputs: Auth_Reset_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Enter a new password for your account.`
    );
  }
);
const auth_reset_subtitle = (
  /** @type {((inputs?: Auth_Reset_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_subtitle();
  })
);
const en_auth_reset_new_password = (
  /** @type {(inputs: Auth_Reset_New_PasswordInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `New Password`
    );
  }
);
const auth_reset_new_password = (
  /** @type {((inputs?: Auth_Reset_New_PasswordInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_New_PasswordInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_new_password();
  })
);
const en_auth_reset_button = (
  /** @type {(inputs: Auth_Reset_ButtonInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Set New Password`
    );
  }
);
const auth_reset_button = (
  /** @type {((inputs?: Auth_Reset_ButtonInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_ButtonInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_button();
  })
);
const en_auth_reset_invalid_link = (
  /** @type {(inputs: Auth_Reset_Invalid_LinkInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Invalid reset link. Please request a new one.`
    );
  }
);
const auth_reset_invalid_link = (
  /** @type {((inputs?: Auth_Reset_Invalid_LinkInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_Invalid_LinkInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_invalid_link();
  })
);
const en_auth_reset_request_link = (
  /** @type {(inputs: Auth_Reset_Request_LinkInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Request new link`
    );
  }
);
const auth_reset_request_link = (
  /** @type {((inputs?: Auth_Reset_Request_LinkInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_Request_LinkInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_request_link();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let password = "";
    let confirm = "";
    let mismatch = derived(() => confirm.length > 0 && password !== confirm);
    head("hkjvfd", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(auth_reset_title())}</title>`);
      });
    });
    AuthShell($$renderer2, {
      title: auth_reset_title(),
      subtitle: auth_reset_subtitle(),
      brandName: data.brandName,
      brandLogo: data.brandLogo,
      children: ($$renderer3) => {
        if (!data.token) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(auth_reset_invalid_link())}</div> <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/forgot-password" class="link">${escape_html(auth_reset_request_link())}</a></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          if (form?.error) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(form.error)}</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <form method="POST" class="space-y-4"><input type="hidden" name="token"${attr("value", data.token)}/> <label class="flex flex-col gap-1"><span>${escape_html(auth_reset_new_password())}</span> <input class="input" type="password" name="password"${attr("value", password)} required="" minlength="8" autocomplete="new-password" placeholder="••••••••"/></label> <label class="flex flex-col gap-1"><span>${escape_html(auth_reset_confirm_password())}</span> <input${attr_class(`input ${stringify(mismatch() ? "input-error" : "")}`)} type="password" name="confirm"${attr("value", confirm)} required="" autocomplete="new-password" placeholder="••••••••"/> `);
          if (mismatch()) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="text-xs text-error">${escape_html(auth_reset_mismatch())}</span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></label> <button type="submit" class="btn btn-primary"${attr("disabled", mismatch(), true)}>${escape_html(auth_reset_button())}</button></form> <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/login" class="link">${escape_html(common_back_to_sign_in())}</a></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-oTpxDEhT.js.map
