import { g as getLocale } from "./runtime.js";
const en_common_cancel = (
  /** @type {(inputs: Common_CancelInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Cancel`
    );
  }
);
const common_cancel = (
  /** @type {((inputs?: Common_CancelInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_CancelInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_cancel();
  })
);
export {
  common_cancel as c
};
