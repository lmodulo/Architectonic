import { N as head } from "../../../chunks/index2.js";
import { k as escape_html } from "../../../chunks/attributes.js";
import { g as getLocale } from "../../../chunks/runtime.js";
const en_error_403_title = (
  /** @type {(inputs: Error_403_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Access Denied`
    );
  }
);
const error_403_title = (
  /** @type {((inputs?: Error_403_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_403_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_error_403_title();
  })
);
const en_error_403_code = (
  /** @type {(inputs: Error_403_CodeInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `403`
    );
  }
);
const error_403_code = (
  /** @type {((inputs?: Error_403_CodeInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_403_CodeInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_error_403_code();
  })
);
const en_error_403_message = (
  /** @type {(inputs: Error_403_MessageInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `You don't have permission to view this page.`
    );
  }
);
const error_403_message = (
  /** @type {((inputs?: Error_403_MessageInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_403_MessageInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_error_403_message();
  })
);
const en_error_403_back = (
  /** @type {(inputs: Error_403_BackInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Back to Dashboard`
    );
  }
);
const error_403_back = (
  /** @type {((inputs?: Error_403_BackInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_403_BackInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_error_403_back();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("19d5e4y", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(error_403_title())}</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-[60vh] flex items-center justify-center"><div class="text-center space-y-4 max-w-sm"><p class="text-6xl font-bold text-error">${escape_html(error_403_code())}</p> <h1 class="text-2xl font-semibold">${escape_html(error_403_title())}</h1> <p class="opacity-60">${escape_html(error_403_message())}</p> <a href="/dashboard" class="btn btn-primary mt-4">${escape_html(error_403_back())}</a></div></div>`);
  });
}
export {
  _page as default
};
