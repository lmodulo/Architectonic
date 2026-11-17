import { error, json } from "@sveltejs/kit";
import { b as private_env } from "../../../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const PATCH = async ({ params, request, cookies }) => {
  const sessionCookie = cookies.get("session");
  const body = await request.json();
  let res;
  try {
    res = await fetch(`${API_URL}/messages/${params.threadId}/state`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.message ?? "Failed");
  return json(data);
};
export {
  PATCH
};
