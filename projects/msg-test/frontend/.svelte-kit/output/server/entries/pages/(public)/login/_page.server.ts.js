import { fail, redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const email = form.get("email");
    const password = form.get("password");
    if (!email || !password) {
      return fail(400, { error: "Email and password are required", email });
    }
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server", email });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Login failed",
        email
      });
    }
    const setCookieHeader = apiRes.headers.get("set-cookie");
    if (setCookieHeader) {
      const match = setCookieHeader.match(/^session=([^;]+)/);
      if (match) {
        cookies.set("session", match[1], {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7
        });
      }
    }
    const user = await apiRes.json().catch(() => null);
    redirect(303, user?.role === "customer" ? "/" : "/dashboard");
  }
};
export {
  actions
};
