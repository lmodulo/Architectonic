import { r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';
import { h as hasPermission } from './permissions-DOm5Hx0d.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  const canReadUsers = hasPermission(locals.user, "users", "read");
  const canReadRoles = hasPermission(locals.user, "roles", "read");
  const canReadTeams = hasPermission(locals.user, "teams", "read");
  if (!canReadUsers && !canReadRoles && !canReadTeams) redirect(303, "/403");
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  try {
    const canInvite = hasPermission(locals.user, "users", "create");
    const [usersRes, rolesRes, teamsRes] = await Promise.all([
      canReadUsers ? fetch(`${API_URL}/users`, { headers }) : Promise.resolve(null),
      canReadRoles || canInvite ? fetch(`${API_URL}/roles`, { headers }) : Promise.resolve(null),
      canReadTeams ? fetch(`${API_URL}/teams`, { headers }) : Promise.resolve(null)
    ]);
    return {
      users: usersRes?.ok ? await usersRes.json() : [],
      roles: rolesRes?.ok ? await rolesRes.json() : [],
      teams: teamsRes?.ok ? await teamsRes.json() : [],
      canReadUsers,
      canReadRoles,
      canReadTeams,
      canCreate: hasPermission(locals.user, "roles", "create"),
      canUpdate: hasPermission(locals.user, "roles", "update"),
      canDelete: hasPermission(locals.user, "roles", "delete"),
      canAssign: hasPermission(locals.user, "users", "update"),
      canCreateTeam: hasPermission(locals.user, "teams", "create"),
      canUpdateTeam: hasPermission(locals.user, "teams", "update"),
      canDeleteTeam: hasPermission(locals.user, "teams", "delete"),
      error: null
    };
  } catch {
    return {
      users: [],
      roles: [],
      teams: [],
      canReadUsers,
      canReadRoles,
      canReadTeams,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canAssign: false,
      canCreateTeam: false,
      canUpdateTeam: false,
      canDeleteTeam: false,
      error: "Cannot reach the API server"
    };
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 23;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-Drvh-p1c.js')).default;
const server_id = "src/routes/user-management/+page.server.ts";
const imports = ["_app/immutable/nodes/23.D13oDcgL.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CU8pdfgK.js","_app/immutable/chunks/BaOFUj-7.js","_app/immutable/chunks/B31pwaH6.js","_app/immutable/chunks/bDiJYQKL.js","_app/immutable/chunks/DrSFo_nn.js","_app/immutable/chunks/_GjRPHwD.js","_app/immutable/chunks/Cv_GIsbp.js","_app/immutable/chunks/BZXFFT53.js","_app/immutable/chunks/C9Mpp1xC.js","_app/immutable/chunks/CIw9gG4K.js","_app/immutable/chunks/BKzcV6EU.js","_app/immutable/chunks/C4KSK_7I.js","_app/immutable/chunks/CS3GTii4.js","_app/immutable/chunks/Cbd4l9nN.js","_app/immutable/chunks/yZ0fOdec.js","_app/immutable/chunks/_EuocV3h.js","_app/immutable/chunks/stvuJpC7.js","_app/immutable/chunks/CYllZ8dq.js","_app/immutable/chunks/TQBwJGr3.js","_app/immutable/chunks/PtRnALZD.js","_app/immutable/chunks/NXAs61vP.js","_app/immutable/chunks/B-1UexJ4.js","_app/immutable/chunks/BtrUzrsK.js","_app/immutable/chunks/DZ4-hrlI.js","_app/immutable/chunks/DPREQ_gD.js","_app/immutable/chunks/CvYtwPJb.js","_app/immutable/chunks/DsUn0r2r.js","_app/immutable/chunks/Dxr0fsLO.js","_app/immutable/chunks/LH0gGYzA.js","_app/immutable/chunks/xsEczMB8.js","_app/immutable/chunks/DOj1S9df.js","_app/immutable/chunks/CjXhTrTO.js","_app/immutable/chunks/D_4-SOBM.js","_app/immutable/chunks/DOIZYDPm.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=23-CC83_WEd.js.map
