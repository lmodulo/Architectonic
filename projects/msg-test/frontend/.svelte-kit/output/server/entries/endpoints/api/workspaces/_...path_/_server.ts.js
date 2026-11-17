import { error, json } from "@sveltejs/kit";
import { b as private_env } from "../../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
async function proxy(method, path, cookies, body) {
  const sessionCookie = cookies.get("session");
  const headers = {};
  if (sessionCookie) headers.cookie = `session=${sessionCookie}`;
  if (body !== void 0) headers["content-type"] = "application/json";
  let res;
  try {
    res = await fetch(`${API_URL}/workspaces/${path}`, {
      method,
      headers,
      body: body !== void 0 ? JSON.stringify(body) : void 0
    });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  if (res.status === 204) return new Response(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.message ?? "Request failed");
  return json(data, { status: res.status });
}
const GET = async ({ params, cookies }) => proxy("GET", params.path ?? "", cookies);
const POST = async ({ params, cookies, request }) => proxy("POST", params.path ?? "", cookies, await request.json().catch(() => void 0));
const PATCH = async ({ params, cookies, request }) => proxy("PATCH", params.path ?? "", cookies, await request.json());
const DELETE = async ({ params, cookies }) => proxy("DELETE", params.path ?? "", cookies);
export {
  DELETE,
  GET,
  PATCH,
  POST
};
