import { p as attr, k as escape_html } from "./attributes.js";
function Logo($$renderer, $$props) {
  let { brandName = "", brandLogo = "" } = $$props;
  if (brandLogo) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<img${attr("src", brandLogo)}${attr("alt", brandName || "Logo")} class="size-6 object-contain"/>`);
  } else if (brandName) {
    $$renderer.push("<!--[1-->");
    $$renderer.push(`<span class="text-xl font-semibold">${escape_html(brandName)}</span>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]-->`);
}
export {
  Logo as L
};
