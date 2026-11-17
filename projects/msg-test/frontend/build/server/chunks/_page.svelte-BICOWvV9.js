import { V as head, Z as ensure_array_like } from './index2-827svAZg.js';
import { k as escape_html } from './attributes-CkcQfCjx.js';
import { g as getLocale } from './runtime-D3odmjxS.js';
import { h as html } from './html-FW6Ia4bL.js';

const en_events_title = (
  /** @type {(inputs: Events_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Upcoming Events`
    );
  }
);
const events_title = (
  /** @type {((inputs?: Events_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Events_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_events_title();
  })
);
const en_events_subtitle = (
  /** @type {(inputs: Events_SubtitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Events scheduled over the next 12 months.`
    );
  }
);
const events_subtitle = (
  /** @type {((inputs?: Events_SubtitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Events_SubtitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_events_subtitle();
  })
);
const en_events_none = (
  /** @type {(inputs: Events_NoneInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `No upcoming events scheduled.`
    );
  }
);
const events_none = (
  /** @type {((inputs?: Events_NoneInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Events_NoneInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_events_none();
  })
);
const en_events_check_back = (
  /** @type {(inputs: Events_Check_BackInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Check back soon.`
    );
  }
);
const events_check_back = (
  /** @type {((inputs?: Events_Check_BackInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Events_Check_BackInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_events_check_back();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const events = data.events ?? [];
    function fmtDate(iso) {
      return new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      });
    }
    function fmtRange(ev) {
      const start = new Date(ev.startDate);
      if (ev.singleDay) return fmtDate(ev.startDate);
      const end = new Date(ev.endDate);
      if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} – ${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
      }
      return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    }
    function monthLabel(iso) {
      return new Date(iso).toLocaleString("en-US", { month: "long", year: "numeric" });
    }
    const groups = events.reduce(
      (acc, ev) => {
        const month = monthLabel(ev.startDate);
        const existing = acc.find((g) => g.month === month);
        if (existing) existing.items.push(ev);
        else acc.push({ month, items: [ev] });
        return acc;
      },
      []
    );
    head("7oiqjr", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(events_title())}</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-3xl mx-auto px-4 py-10 space-y-10"><div><h1 class="text-3xl font-bold">${escape_html(events_title())}</h1> <p class="text-sm opacity-60 mt-1">${escape_html(events_subtitle())}</p></div> `);
    if (groups.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="card bg-base-100 border border-base-200 p-10 text-center space-y-2"><p class="text-lg font-semibold opacity-50">${escape_html(events_none())}</p> <p class="text-sm opacity-40">${escape_html(events_check_back())}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(groups);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let group = each_array[$$index_1];
        $$renderer2.push(`<section class="space-y-4"><h2 class="text-xs font-semibold uppercase tracking-widest opacity-50 border-b border-base-200 pb-2">${escape_html(group.month)}</h2> <!--[-->`);
        const each_array_1 = ensure_array_like(group.items);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let ev = each_array_1[$$index];
          $$renderer2.push(`<article class="card bg-base-100 border border-base-200 overflow-hidden"><div class="px-6 py-5 border-b border-base-200 flex items-start gap-4"><div class="shrink-0 flex flex-col items-center justify-center rounded-lg bg-warning/10 text-warning w-14 h-14"><span class="text-xs font-semibold uppercase opacity-70 leading-none">${escape_html(new Date(ev.startDate).toLocaleString("en-US", { month: "short" }))}</span> <span class="text-2xl font-bold leading-none">${escape_html(new Date(ev.startDate).getDate())}</span></div> <div class="flex-1 min-w-0"><h3 class="text-lg font-semibold leading-tight">${escape_html(ev.title)}</h3> <p class="text-sm opacity-60 mt-0.5">${escape_html(fmtRange(ev))}</p></div></div> `);
          if (ev.content && ev.content !== "<p></p>") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="px-6 py-5 prose prose-sm dark:prose-invert max-w-none">${html(ev.content)}</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></article>`);
        }
        $$renderer2.push(`<!--]--></section>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BICOWvV9.js.map
