import { redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
import { h as hasPermission } from "../../../../chunks/permissions.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, "/login");
  if (!hasPermission(user, "automation", "read")) redirect(302, "/dashboard");
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const [rulesRes, metaRes] = await Promise.all([
    fetch(`${API_URL}/automation`, { headers }),
    fetch(`${API_URL}/automation/meta`, { headers })
  ]);
  const rules = rulesRes.ok ? await rulesRes.json() : [];
  const meta = metaRes.ok ? await metaRes.json() : { triggerEvents: [], actionTypes: [] };
  return { rules, meta };
};
export {
  load
};
