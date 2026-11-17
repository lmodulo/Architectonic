import { g as getLocale } from "./runtime.js";
const en_profile_members_count = (
  /** @type {((inputs: Profile_Members_CountInputs) => LocalizedString) & { parts: (inputs: Profile_Members_CountInputs) => import('../runtime.js').MessagePart[] }} */
  /* @__PURE__ */ Object.assign(
    /** @type {(inputs: Profile_Members_CountInputs) => LocalizedString} */
    ((i) => {
      return (
        /** @type {LocalizedString} */
        `${i?.["count, plural, one {# member"]} other }`
      );
    }),
    {
      parts: (
        /** @type {(inputs: Profile_Members_CountInputs) => import('../runtime.js').MessagePart[]} */
        ((i) => {
          return (
            /** @type {import('../runtime.js').MessagePart[]} */
            [{ type: "text", value: String(i?.["count, plural, one {# member"]) }, { type: "text", value: " other " }, { type: "markup-start", name: "members", options: {}, attributes: {} }, { type: "text", value: "}" }]
          );
        })
      )
    }
  )
);
const profile_members_count = (
  /** @type {((inputs: Profile_Members_CountInputs, options?: { locale?: "en" }) => LocalizedString) & { parts: (inputs: Profile_Members_CountInputs, options?: { locale?: "en" }) => import('../runtime.js').MessagePart[] } & import('../runtime.js').MessageMetadata<Profile_Members_CountInputs, { locale?: "en" }, { members: { options: {}; attributes: {}; children: true } }>} */
  /* @__PURE__ */ Object.assign(
    /** @type {(inputs: Profile_Members_CountInputs, options?: { locale?: "en" }) => LocalizedString} */
    ((inputs, options = {}) => {
      options.locale ?? getLocale();
      return en_profile_members_count(inputs);
    }),
    {
      parts: (
        /** @type {(inputs: Profile_Members_CountInputs, options?: { locale?: "en" }) => import('../runtime.js').MessagePart[]} */
        ((inputs, options = {}) => {
          options.locale ?? getLocale();
          return typeof en_profile_members_count.parts === "function" ? en_profile_members_count.parts(inputs) : [{ type: "text", value: en_profile_members_count(inputs) }];
        })
      )
    }
  )
);
export {
  profile_members_count as p
};
