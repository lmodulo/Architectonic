import { fail } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const email = form.get("email");
    if (!email) return fail(400, { error: "Email is required" });
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
    } catch {
      return fail(503, { error: "Cannot reach the API server" });
    }
    return { sent: true };
  }
};
export {
  actions
};
