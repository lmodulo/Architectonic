import { p as attr } from "../../../chunks/attributes.js";
import { A as APP_THEME } from "../../../chunks/theme.js";
function _layout($$renderer, $$props) {
  let { children } = $$props;
  $$renderer.push(`<div${attr("data-theme", APP_THEME)}>`);
  children($$renderer);
  $$renderer.push(`<!----></div>`);
}
export {
  _layout as default
};
