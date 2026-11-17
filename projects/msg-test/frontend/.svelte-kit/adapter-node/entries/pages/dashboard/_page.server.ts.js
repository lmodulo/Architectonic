import { redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, "/login");
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  let events = [];
  try {
    const res = await fetch(`${API_URL}/events`, { headers });
    if (res.ok) events = await res.json();
  } catch {
  }
  return { user: locals.user, events };
};
export {
  load
};
