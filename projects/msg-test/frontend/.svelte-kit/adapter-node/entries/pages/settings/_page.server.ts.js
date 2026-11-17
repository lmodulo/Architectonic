import { redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../chunks/shared-server.js";
import { h as hasPermission } from "../../../chunks/permissions.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, "/login");
  if (!hasPermission(user, "settings", "read")) redirect(302, "/dashboard");
  const sessionCookie = cookies.get("session");
  const res = await fetch(`${API_URL}/settings`, {
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  const settings = res.ok ? await res.json() : [];
  return { settings };
};
export {
  load
};
