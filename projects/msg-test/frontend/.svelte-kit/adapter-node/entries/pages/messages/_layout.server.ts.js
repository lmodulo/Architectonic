import { redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ locals, cookies }) => {
  if (!locals.user) redirect(303, "/login");
  const sessionCookie = cookies.get("session");
  let allUsers = [];
  try {
    const res = await fetch(`${API_URL}/users`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) {
      const raw = await res.json();
      allUsers = raw.filter((u) => u.id !== locals.user.id);
    }
  } catch {
  }
  let inbox = [];
  let inboxHasMore = false;
  try {
    const res = await fetch(`${API_URL}/messages?limit=25`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
    if (res.ok) {
      const d = await res.json();
      inbox = d.threads ?? [];
      inboxHasMore = d.hasMore ?? false;
    }
  } catch {
  }
  return { inbox, inboxHasMore, allUsers };
};
export {
  load
};
