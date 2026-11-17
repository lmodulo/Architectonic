import { fail } from "@sveltejs/kit";
import { b as private_env } from "../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  let myTeams = [];
  try {
    const res = await fetch(`${API_URL}/teams/mine`, { headers });
    if (res.ok) myTeams = await res.json();
  } catch {
  }
  return { user: locals.user, myTeams };
};
const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = form.get("username")?.trim();
    const email = form.get("email")?.trim();
    const firstName = form.get("firstName")?.trim();
    const lastName = form.get("lastName")?.trim();
    const phone = form.get("phone")?.trim();
    if (!username && !email && firstName === void 0 && lastName === void 0 && phone === void 0) {
      return fail(400, { error: "Nothing to update" });
    }
    const sessionCookie = cookies.get("session");
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/profile`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
        },
        body: JSON.stringify({ username, email, firstName, lastName, phone })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server" });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Update failed"
      });
    }
    return { success: true };
  }
};
export {
  actions,
  load
};
