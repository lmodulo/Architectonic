import { error, json } from "@sveltejs/kit";
import { b as private_env } from "../../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const GET = async ({ cookies }) => {
  const sessionCookie = cookies.get("session");
  let res;
  try {
    res = await fetch(`${API_URL}/messages/unread-count`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({ count: 0 }));
  if (!res.ok) throw error(res.status, data.message ?? "Failed");
  return json(data);
};
export {
  GET
};
