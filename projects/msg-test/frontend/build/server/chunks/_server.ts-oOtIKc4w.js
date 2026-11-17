import { e as error, j as json } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
function headers(cookies) {
  const session = cookies.get("session");
  return session ? { cookie: `session=${session}` } : {};
}
const GET = async ({ params, url, cookies }) => {
  const path = params.path ?? "";
  const query = url.search;
  let res;
  try {
    res = await fetch(`${API_URL}/notifications/${path}${query}`, { headers: headers(cookies) });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.message ?? "Failed");
  return json(data);
};
const PUT = async ({ params, request, cookies }) => {
  const path = params.path ?? "";
  const body = await request.json().catch(() => void 0);
  let res;
  try {
    res = await fetch(`${API_URL}/notifications/${path}`, {
      method: "PUT",
      headers: {
        ...body !== void 0 ? { "content-type": "application/json" } : {},
        ...headers(cookies)
      },
      ...body !== void 0 ? { body: JSON.stringify(body) } : {}
    });
  } catch {
    throw error(503, "Cannot reach the API server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw error(res.status, data.message ?? "Failed");
  return json(data);
};

export { GET, PUT };
//# sourceMappingURL=_server.ts-oOtIKc4w.js.map
