import { p as attr, k as escape_html } from "./attributes.js";
import { L as Logo } from "./Logo.js";
import { g as getLocale } from "./runtime.js";
const en_marketing_nav_home = (
  /** @type {(inputs: Marketing_Nav_HomeInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Home`
    );
  }
);
const marketing_nav_home = (
  /** @type {((inputs?: Marketing_Nav_HomeInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Marketing_Nav_HomeInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_marketing_nav_home();
  })
);
const en_marketing_nav_sign_in = (
  /** @type {(inputs: Marketing_Nav_Sign_InInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Sign In`
    );
  }
);
const marketing_nav_sign_in = (
  /** @type {((inputs?: Marketing_Nav_Sign_InInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Marketing_Nav_Sign_InInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_marketing_nav_sign_in();
  })
);
function MarketingNav($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { brandName = "", brandLogo = "" } = $$props;
    $$renderer2.push(`<nav class="marketing-nav svelte-xpv1hr"><a href="/" class="nav-brand svelte-xpv1hr"${attr("aria-label", marketing_nav_home())}>`);
    Logo($$renderer2, { brandName: brandName ?? "", brandLogo: brandLogo ?? "" });
    $$renderer2.push(`<!----></a> <a href="/login" class="btn btn-primary btn-sm">${escape_html(marketing_nav_sign_in())}</a></nav>`);
  });
}
export {
  MarketingNav as M,
  marketing_nav_sign_in as m
};
