import { e as error, j as json } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const GET = async ({ cookies, url }) => {
  const sessionCookie = cookies.get("session");
  const qs = new URLSearchParams();
  if (url.searchParams.get("limit")) qs.set("limit", url.searchParams.get("limit"));
  if (url.searchParams.get("before")) qs.set("before", url.searchParams.get("before"));
  const suffix = qs.toString() ? `?${qs}` : "";
  let res;
  try {
    res = await fetch(`${API_URL}/messages/archived${suffix}`, {
      headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.message ?? "Failed");
  return json(data);
};

export { GET };
//# sourceMappingURL=_server.ts-GIMTPoo3.js.map
