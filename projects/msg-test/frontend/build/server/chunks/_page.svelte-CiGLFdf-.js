import { V as head } from './index2-827svAZg.js';
import { k as escape_html } from './attributes-CkcQfCjx.js';
import './root-D7p37-hI.js';
import './state.svelte-DnIKQJ0i.js';
import { A as AuthShell } from './AuthShell-8r0Ue48P.js';
import { g as getLocale } from './runtime-D3odmjxS.js';
import { c as common_email } from './common_email-BYg9T0w6.js';
import { c as common_back_to_sign_in } from './common_back_to_sign_in-CsC8Welt.js';
import './MarketingNav-7tgkJVg6.js';
import './Logo-BhJW--c5.js';

const en_auth_forgot_title = (
  /** @type {(inputs: Auth_Forgot_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Forgot Password`
    );
  }
);
const auth_forgot_title = (
  /** @type {((inputs?: Auth_Forgot_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Forgot_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_forgot_title();
  })
);
const en_auth_forgot_subtitle = (
  /** @type {(inputs: Auth_Forgot_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `We'll send a reset link to your email.`
    );
  }
);
const auth_forgot_subtitle = (
  /** @type {((inputs?: Auth_Forgot_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Forgot_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_forgot_subtitle();
  })
);
const en_auth_forgot_send = (
  /** @type {(inputs: Auth_Forgot_SendInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Send Reset Link`
    );
  }
);
const auth_forgot_send = (
  /** @type {((inputs?: Auth_Forgot_SendInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Forgot_SendInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_forgot_send();
  })
);
const en_auth_forgot_sent = (
  /** @type {(inputs: Auth_Forgot_SentInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `If that email is registered, a reset link has been sent. Check your inbox.`
    );
  }
);
const auth_forgot_sent = (
  /** @type {((inputs?: Auth_Forgot_SentInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Forgot_SentInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_forgot_sent();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    head("1fy8rgp", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(auth_forgot_title())}</title>`);
      });
    });
    AuthShell($$renderer2, {
      title: auth_forgot_title(),
      subtitle: auth_forgot_subtitle(),
      brandName: data.brandName,
      brandLogo: data.brandLogo,
      children: ($$renderer3) => {
        if (form?.sent) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div role="alert" class="alert alert-success text-sm">${escape_html(auth_forgot_sent())}</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          if (form?.error) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(form.error)}</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <form method="POST" class="space-y-4"><label class="flex flex-col gap-1"><span>${escape_html(common_email())}</span> <input class="input" type="email" name="email" required="" autocomplete="email" placeholder="you@example.com"/></label> <button type="submit" class="btn btn-primary">${escape_html(auth_forgot_send())}</button></form>`);
        }
        $$renderer3.push(`<!--]--> <div class="flex items-center justify-center text-[0.8125rem] text-[var(--color-primary-content)] pt-1"><a href="/login" class="link">${escape_html(common_back_to_sign_in())}</a></div>`);
      }
    });
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CiGLFdf-.js.map
