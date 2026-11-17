import { k as escape_html } from "../../../chunks/attributes.js";
import "clsx";
import { M as Mail } from "../../../chunks/mail.js";
import { g as getLocale } from "../../../chunks/runtime.js";
const en_messages_empty = (
  /** @type {(inputs: Messages_EmptyInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Select a conversation or compose a new message`
    );
  }
);
const messages_empty = (
  /** @type {((inputs?: Messages_EmptyInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Messages_EmptyInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_messages_empty();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<div class="flex flex-col items-center justify-center h-full opacity-40 gap-3">`);
    Mail($$renderer2, { class: "size-12" });
    $$renderer2.push(`<!----> <p class="text-sm">${escape_html(messages_empty())}</p></div>`);
  });
}
export {
  _page as default
};
