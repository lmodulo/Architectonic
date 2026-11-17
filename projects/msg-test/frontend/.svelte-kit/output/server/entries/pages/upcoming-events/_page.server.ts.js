import { b as private_env } from "../../../chunks/shared-server.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const load = async () => {
  let events = [];
  try {
    const res = await fetch(`${API_URL}/events/public`);
    if (res.ok) events = await res.json();
  } catch {
  }
  return { events };
};
export {
  load
};
