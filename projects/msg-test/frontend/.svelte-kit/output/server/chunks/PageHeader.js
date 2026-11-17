import { k as escape_html } from "./attributes.js";
import "clsx";
function PageHeader($$renderer, $$props) {
  let { title, subtitle, children } = $$props;
  $$renderer.push(`<div><h1 class="text-2xl font-bold">${escape_html(title)}</h1> `);
  if (subtitle) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<p class="text-sm opacity-60 mt-0.5">${escape_html(subtitle)}</p>`);
  } else if (children) {
    $$renderer.push("<!--[1-->");
    $$renderer.push(`<p class="text-sm opacity-60 mt-0.5">`);
    children($$renderer);
    $$renderer.push(`<!----></p>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></div>`);
}
export {
  PageHeader as P
};
