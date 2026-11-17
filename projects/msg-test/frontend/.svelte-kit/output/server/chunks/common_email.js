import { g as getLocale } from "./runtime.js";
const en_common_email = (
  /** @type {(inputs: Common_EmailInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Email`
    );
  }
);
const common_email = (
  /** @type {((inputs?: Common_EmailInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_EmailInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_email();
  })
);
export {
  common_email as c
};
