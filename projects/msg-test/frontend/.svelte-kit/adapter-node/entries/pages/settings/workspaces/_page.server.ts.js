import { redirect } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
import { h as hasPermission } from "../../../../chunks/permissions.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async ({ cookies, parent }) => {
  const { user } = await parent();
  if (!user) redirect(302, "/login");
  if (!hasPermission(user, "workspaces", "read")) redirect(302, "/dashboard");
  const sessionCookie = cookies.get("session");
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};
  const workspaceId = user.workspaceId;
  if (!workspaceId) redirect(302, "/dashboard");
  const [workspace, members] = await Promise.all([
    fetch(`${API_URL}/workspaces/${workspaceId}`, { headers }).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API_URL}/workspaces/${workspaceId}/members`, { headers }).then((r) => r.ok ? r.json() : []).catch(() => [])
  ]);
  return { workspace, members };
};
export {
  load
};
