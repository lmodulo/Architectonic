import { g as getLocale } from './runtime-D3odmjxS.js';

const en_auth_reset_confirm_password = (
  /** @type {(inputs: Auth_Reset_Confirm_PasswordInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Confirm Password`
    );
  }
);
const auth_reset_confirm_password = (
  /** @type {((inputs?: Auth_Reset_Confirm_PasswordInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_Confirm_PasswordInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_confirm_password();
  })
);
const en_auth_reset_mismatch = (
  /** @type {(inputs: Auth_Reset_MismatchInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Passwords do not match`
    );
  }
);
const auth_reset_mismatch = (
  /** @type {((inputs?: Auth_Reset_MismatchInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Reset_MismatchInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_auth_reset_mismatch();
  })
);

export { auth_reset_confirm_password as a, auth_reset_mismatch as b };
//# sourceMappingURL=auth_reset_mismatch-Cvslg4Y4.js.map
