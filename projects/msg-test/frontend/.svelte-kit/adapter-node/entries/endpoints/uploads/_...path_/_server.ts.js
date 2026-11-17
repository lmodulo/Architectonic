import { b as private_env } from "../../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const GET = async ({ params }) => {
  return fetch(`${API_URL}/uploads/${params.path}`);
};
export {
  GET
};
