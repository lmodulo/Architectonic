import { b as private_env } from "../../../../chunks/shared-server.js";
import { fail } from "@sveltejs/kit";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  if (!locals.user) return { prefs: null };
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const res = await fetch(`${API_URL}/notifications/preferences`, { headers });
  const prefs = res.ok ? await res.json() : null;
  return { prefs };
};
const actions = {
  default: async ({ request, cookies }) => {
    const sessionCookie = cookies.get("session");
    const headers = { "content-type": "application/json" };
    if (sessionCookie) headers.cookie = `session=${sessionCookie}`;
    const form = await request.formData();
    const body = {
      channels: {
        email: form.get("email_channel") === "on"
      },
      muted: form.getAll("muted").map(String),
      quiet: {
        enabled: form.get("quiet_enabled") === "on",
        start: form.get("quiet_start"),
        end: form.get("quiet_end"),
        timezone: form.get("quiet_timezone")
      }
    };
    const res = await fetch(`${API_URL}/notifications/preferences`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) return fail(res.status, { error: "Failed to save preferences" });
    return { success: true };
  }
};
export {
  actions,
  load
};
