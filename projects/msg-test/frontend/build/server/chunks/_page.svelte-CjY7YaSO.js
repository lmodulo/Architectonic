import { V as head, Y as attr_class, Z as ensure_array_like, N as derived, _ as stringify } from './index2-827svAZg.js';
import { k as escape_html, q as attr } from './attributes-CkcQfCjx.js';
import './root-D7p37-hI.js';
import './state.svelte-DnIKQJ0i.js';
import { P as PageHeader } from './PageHeader-B2BNqFeB.js';
import { A as Avatar } from './Avatar-xhEemzLF.js';
import { g as getLocale } from './runtime-D3odmjxS.js';
import { p as profile_members_count } from './profile_members_count-WztrIGdo.js';
import { c as common_username } from './common_username-Ctuo56GO.js';
import { c as common_email } from './common_email-BYg9T0w6.js';

const en_common_phone = (
  /** @type {(inputs: Common_PhoneInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Phone`
    );
  }
);
const common_phone = (
  /** @type {((inputs?: Common_PhoneInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_PhoneInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_phone();
  })
);
const en_common_first_name = (
  /** @type {(inputs: Common_First_NameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `First Name`
    );
  }
);
const common_first_name = (
  /** @type {((inputs?: Common_First_NameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_First_NameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_first_name();
  })
);
const en_common_last_name = (
  /** @type {(inputs: Common_Last_NameInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Last Name`
    );
  }
);
const common_last_name = (
  /** @type {((inputs?: Common_Last_NameInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Last_NameInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_last_name();
  })
);
const en_common_save_changes = (
  /** @type {(inputs: Common_Save_ChangesInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Save Changes`
    );
  }
);
const common_save_changes = (
  /** @type {((inputs?: Common_Save_ChangesInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Save_ChangesInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_common_save_changes();
  })
);
const en_profile_title = (
  /** @type {(inputs: Profile_TitleInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Profile`
    );
  }
);
const profile_title = (
  /** @type {((inputs?: Profile_TitleInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_TitleInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_title();
  })
);
const en_profile_avatar = (
  /** @type {(inputs: Profile_AvatarInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Avatar`
    );
  }
);
const profile_avatar = (
  /** @type {((inputs?: Profile_AvatarInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_AvatarInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_avatar();
  })
);
const en_profile_photo = (
  /** @type {(inputs: Profile_PhotoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Photo`
    );
  }
);
const profile_photo = (
  /** @type {((inputs?: Profile_PhotoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_PhotoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_photo();
  })
);
const en_profile_color = (
  /** @type {(inputs: Profile_ColorInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Color`
    );
  }
);
const profile_color = (
  /** @type {((inputs?: Profile_ColorInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_ColorInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_color();
  })
);
const en_profile_change_photo = (
  /** @type {(inputs: Profile_Change_PhotoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Change Photo`
    );
  }
);
const profile_change_photo = (
  /** @type {((inputs?: Profile_Change_PhotoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Change_PhotoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_change_photo();
  })
);
const en_profile_upload_photo = (
  /** @type {(inputs: Profile_Upload_PhotoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Upload Photo`
    );
  }
);
const profile_upload_photo = (
  /** @type {((inputs?: Profile_Upload_PhotoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Upload_PhotoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_upload_photo();
  })
);
const en_profile_remove_photo = (
  /** @type {(inputs: Profile_Remove_PhotoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Remove Photo`
    );
  }
);
const profile_remove_photo = (
  /** @type {((inputs?: Profile_Remove_PhotoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Remove_PhotoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_remove_photo();
  })
);
const en_profile_my_teams = (
  /** @type {(inputs: Profile_My_TeamsInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `My Teams`
    );
  }
);
const profile_my_teams = (
  /** @type {((inputs?: Profile_My_TeamsInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_My_TeamsInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_my_teams();
  })
);
const en_profile_account_info = (
  /** @type {(inputs: Profile_Account_InfoInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Account Information`
    );
  }
);
const profile_account_info = (
  /** @type {((inputs?: Profile_Account_InfoInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Account_InfoInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_account_info();
  })
);
const en_profile_updated = (
  /** @type {(inputs: Profile_UpdatedInputs) => LocalizedString} */
  () => {
    return (
      /** @type {LocalizedString} */
      `Profile updated successfully.`
    );
  }
);
const profile_updated = (
  /** @type {((inputs?: Profile_UpdatedInputs, options?: { locale?: "en" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_UpdatedInputs, { locale?: "en" }, {}>} */
  ((inputs = {}, options = {}) => {
    options.locale ?? getLocale();
    return en_profile_updated();
  })
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, form } = $$props;
    let firstName = data.user?.firstName ?? "";
    let lastName = data.user?.lastName ?? "";
    let username = data.user?.username ?? "";
    let email = data.user?.email ?? "";
    let phone = data.user?.phone ?? "";
    let localAvatarUrl = data.user?.avatarUrl ?? "";
    let localAvatarColor = data.user?.avatarColor || "#6b5fa5";
    let avatarUploading = false;
    const avatarUser = derived(() => ({
      firstName: data.user?.firstName ?? "",
      lastName: data.user?.lastName ?? "",
      username: data.user?.username ?? "",
      avatarUrl: localAvatarUrl,
      avatarColor: localAvatarColor
    }));
    head("maq4gq", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(profile_title())}</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-lg space-y-6">`);
    PageHeader($$renderer2, { title: profile_title() });
    $$renderer2.push(`<!----> <div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-5"><h2 class="text-lg font-semibold">${escape_html(profile_avatar())}</h2> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex justify-center">`);
    Avatar($$renderer2, { user: avatarUser(), size: "xl" });
    $$renderer2.push(`<!----></div> `);
    {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div role="tablist" class="tabs tabs-box"><button role="tab" type="button"${attr_class(`tab ${stringify("tab-active")}`)}>${escape_html(profile_photo())}</button> <button role="tab" type="button"${attr_class(`tab ${stringify("")}`)}>${escape_html(profile_color())}</button></div> `);
      {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="space-y-2"><input type="file" accept="image/*" class="hidden"/> <button type="button" class="btn btn-outline w-full"${attr("disabled", avatarUploading, true)}>${escape_html(localAvatarUrl ? profile_change_photo() : profile_upload_photo())}</button> `);
        if (localAvatarUrl) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button type="button" class="btn btn-ghost btn-sm text-error w-full"${attr("disabled", avatarUploading, true)}>${escape_html(profile_remove_photo())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.myTeams && data.myTeams.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-3"><h2 class="text-lg font-semibold">${escape_html(profile_my_teams())}</h2> <ul class="space-y-2"><!--[-->`);
      const each_array_1 = ensure_array_like(data.myTeams);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let team = each_array_1[$$index_1];
        $$renderer2.push(`<li class="flex items-center justify-between gap-3"><div><span class="font-medium">${escape_html(team.name)}</span> `);
        if (team.description) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="ml-2 text-sm opacity-50">${escape_html(team.description)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <span class="badge badge-ghost text-xs shrink-0">${escape_html(profile_members_count({ count: team.memberCount }))}</span></li>`);
      }
      $$renderer2.push(`<!--]--></ul></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="card bg-base-200 border border-base-300 rounded-box p-6 space-y-5"><h2 class="text-lg font-semibold">${escape_html(profile_account_info())}</h2> `);
    if (form?.success) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div role="alert" class="alert alert-success text-sm">${escape_html(profile_updated())}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (form?.error) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div role="alert" class="alert alert-error text-sm">${escape_html(form.error)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <form method="POST" class="space-y-4"><div class="grid grid-cols-2 gap-4"><label class="flex flex-col gap-1"><span class="text-sm font-medium">${escape_html(common_first_name())}</span> <input type="text" name="firstName" class="input"${attr("value", firstName)} maxlength="50" autocomplete="given-name" placeholder="Jane"/></label> <label class="flex flex-col gap-1"><span class="text-sm font-medium">${escape_html(common_last_name())}</span> <input type="text" name="lastName" class="input"${attr("value", lastName)} maxlength="50" autocomplete="family-name" placeholder="Doe"/></label></div> <label class="flex flex-col gap-1"><span class="text-sm font-medium">${escape_html(common_username())}</span> <input type="text" name="username" class="input"${attr("value", username)} minlength="2" maxlength="50" required=""/></label> <label class="flex flex-col gap-1"><span class="text-sm font-medium">${escape_html(common_email())}</span> <input type="email" name="email" class="input"${attr("value", email)} required=""/></label> <label class="flex flex-col gap-1"><span class="text-sm font-medium">${escape_html(common_phone())}</span> <input type="tel" name="phone" class="input"${attr("value", phone)} maxlength="30" placeholder="+1 555 000 0000" autocomplete="tel"/></label> <button type="submit" class="btn btn-primary w-full">${escape_html(common_save_changes())}</button></form></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CjY7YaSO.js.map
