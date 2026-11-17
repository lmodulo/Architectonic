import { g as getLocale } from './runtime-D3odmjxS.js';

const en_common_username = (
  /** @type {(inputs: Common_UsernameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Username`
    );
  }
);
const common_username = (
  /** @type {((inputs?: Common_UsernameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_UsernameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_username();
  })
);

export { common_username as c };
//# sourceMappingURL=common_username-Ctuo56GO.js.map
