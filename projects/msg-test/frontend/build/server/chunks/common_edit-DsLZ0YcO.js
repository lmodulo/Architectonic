import { g as getLocale } from './runtime-D3odmjxS.js';

const en_common_edit = (
  /** @type {(inputs: Common_EditInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Edit`
    );
  }
);
const common_edit = (
  /** @type {((inputs?: Common_EditInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_EditInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_edit();
  })
);

export { common_edit as c };
//# sourceMappingURL=common_edit-DsLZ0YcO.js.map
