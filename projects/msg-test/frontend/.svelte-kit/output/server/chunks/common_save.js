import { g as getLocale } from "./runtime.js";
const en_common_save = (
  /** @type {(inputs: Common_SaveInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Save`
    );
  }
);
const common_save = (
  /** @type {((inputs?: Common_SaveInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SaveInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_save();
  })
);
export {
  common_save as c
};
