import { error, json } from "@sveltejs/kit";
import { b as private_env } from "../../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const GET = async () => {
  let res;
  try {
    res = await fetch(`${API_URL}/events/public`);
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, "Failed to load events");
  return json(data);
};
export {
  GET
};
