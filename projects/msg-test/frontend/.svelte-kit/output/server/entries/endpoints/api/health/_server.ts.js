import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const GET = async ({ fetch }) => {
  const res = await fetch(`${API_URL}/health`);
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" }
  });
};
export {
  GET
};
