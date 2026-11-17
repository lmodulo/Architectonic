import { b as private_env } from "../../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const PATCH = async ({ cookies, request }) => {
  const sessionCookie = cookies.get("session");
  const body = await request.json();
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    },
    body: JSON.stringify(body)
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
};
export {
  PATCH
};
