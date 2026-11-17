import { fail, redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ url }) => {
  return { token: url.searchParams.get("token") ?? "" };
};
const actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const token = form.get("token");
    const password = form.get("password");
    const confirm = form.get("confirm");
    if (!token) return fail(400, { error: "Reset token is missing" });
    if (!password) return fail(400, { error: "Password is required" });
    if (password !== confirm) return fail(400, { error: "Passwords do not match" });
    if (password.length < 8) return fail(400, { error: "Password must be at least 8 characters" });
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server" });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Reset failed"
      });
    }
    redirect(303, "/login?reset=1");
  }
};
export {
  actions,
  load
};
