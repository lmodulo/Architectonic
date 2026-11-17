import { error } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ params, cookies, locals }) => {
  if (!locals.user) return { messages: [] };
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const res = await fetch(`${API_URL}/messages/${params.threadId}`, { headers });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw error(res.status, d.message ?? "Failed to load thread");
  }
  const messages = await res.json();
  return { messages };
};
export {
  load
};
