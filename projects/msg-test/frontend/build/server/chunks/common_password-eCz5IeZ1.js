import { g as getLocale } from './runtime-D3odmjxS.js';

const en_common_password = (
  /** @type {(inputs: Common_PasswordInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Password`
    );
  }
);
const common_password = (
  /** @type {((inputs?: Common_PasswordInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_PasswordInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_password();
  })
);

export { common_password as c };
//# sourceMappingURL=common_password-eCz5IeZ1.js.map
