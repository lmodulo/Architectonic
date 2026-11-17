import { k as escape_html } from './attributes-CkcQfCjx.js';
import { M as MarketingNav } from './MarketingNav-7tgkJVg6.js';
import { g as getLocale } from './runtime-D3odmjxS.js';

const en_auth_shell_application = (
  /** @type {(inputs: Auth_Shell_ApplicationInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Application`
    );
  }
);
const auth_shell_application = (
  /** @type {((inputs?: Auth_Shell_ApplicationInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Shell_ApplicationInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_shell_application();
  })
);
function AuthShell($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children, title, subtitle, brandName, brandLogo } = $$props;
    $$renderer2.push(`<div class="auth-page svelte-e3wec">`);
    MarketingNav($$renderer2, { brandName, brandLogo });
    $$renderer2.push(`<!----> <div class="grain svelte-e3wec" aria-hidden="true"></div> <div class="auth-glow svelte-e3wec" aria-hidden="true"></div> <div class="auth-center svelte-e3wec"><div class="auth-card svelte-e3wec"><div class="auth-head svelte-e3wec"><div class="auth-eyebrow svelte-e3wec"><span class="auth-dot svelte-e3wec"></span> ${escape_html(brandName ?? auth_shell_application())}</div> <h1 class="auth-title svelte-e3wec">${escape_html(title)}</h1> `);
    if (subtitle) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="auth-sub svelte-e3wec">${escape_html(subtitle)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="auth-body svelte-e3wec">`);
    children($$renderer2);
    $$renderer2.push(`<!----></div></div></div></div>`);
  });
}

export { AuthShell as A };
//# sourceMappingURL=AuthShell-8r0Ue48P.js.map
