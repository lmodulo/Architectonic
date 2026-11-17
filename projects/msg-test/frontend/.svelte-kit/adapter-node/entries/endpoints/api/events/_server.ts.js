import { error, json } from "@sveltejs/kit";
import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const GET = async ({ url, cookies }) => {
  const sessionCookie = cookies.get("session");
  const title = url.searchParams.get("title") ?? "";
  const qs = title ? `?title=${encodeURIComponent(title)}` : "";
  let res;
  try {
    res = await fetch(`${API_URL}/events${qs}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.message ?? "Failed");
  return json(data);
};
const POST = async ({ request, cookies }) => {
  const sessionCookie = cookies.get("session");
  const body = await request.json();
  let res;
  try {
    res = await fetch(`${API_URL}/events`, {
      method: "POST",
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
  if (!res.ok) throw error(res.status, data.message ?? "Create failed");
  return json(data, { status: 201 });
};
export {
  GET,
  POST
};
