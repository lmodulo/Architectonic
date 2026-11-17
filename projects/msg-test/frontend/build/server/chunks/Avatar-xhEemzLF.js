import { Y as attr_class, _ as stringify, X as attr_style, N as derived } from './index2-827svAZg.js';
import { q as attr, k as escape_html } from './attributes-CkcQfCjx.js';

function Avatar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { user, size = "md", class: cls = "" } = $$props;
    const sizes = {
      xs: "size-6 text-[9px]",
      sm: "size-7 text-[10px]",
      md: "size-8 text-xs",
      lg: "size-10 text-sm",
      xl: "size-20 text-xl"
    };
    function getInitials(u) {
      if (u.firstName) return (u.firstName[0] + (u.lastName?.[0] ?? "")).toUpperCase();
      if (u.username) return u.username.slice(0, 2).toUpperCase();
      return "?";
    }
    const initials = derived(() => getInitials(user));
    const bg = derived(() => user.avatarColor || "#6b5fa5");
    $$renderer2.push(`<div${attr_class(`rounded-full overflow-hidden shrink-0 select-none ${stringify(sizes[size])} ${stringify(cls)}`)}>`);
    if (user.avatarUrl) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<img${attr("src", user.avatarUrl)} alt="" class="w-full h-full object-cover"/>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="w-full h-full flex items-center justify-center font-bold leading-none"${attr_style(`background:${stringify(bg())}; color:#fff;`)}>${escape_html(initials())}</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { Avatar as A };
//# sourceMappingURL=Avatar-xhEemzLF.js.map
