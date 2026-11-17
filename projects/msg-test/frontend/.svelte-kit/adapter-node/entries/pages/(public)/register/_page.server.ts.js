import { fail, redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async () => {
  try {
    const res = await fetch(`${API_URL}/auth/config`);
    if (res.ok) {
      const data = await res.json();
      return { registrationOpen: data.registrationOpen };
    }
  } catch {
  }
  return { registrationOpen: true };
};
const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = form.get("username");
    const email = form.get("email");
    const password = form.get("password");
    if (!username || !email || !password) {
      return fail(400, { error: "All fields are required", username, email });
    }
    if (password.length < 8) {
      return fail(400, { error: "Password must be at least 8 characters", username, email });
    }
    let apiRes;
    try {
      apiRes = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server", username, email });
    }
    if (!apiRes.ok) {
      const body = await apiRes.json().catch(() => ({}));
      return fail(apiRes.status, {
        error: body.message ?? "Registration failed",
        username,
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
    redirect(303, "/");
  }
};
export {
  actions,
  load
};
