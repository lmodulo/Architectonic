import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const POST = async ({ cookies, request }) => {
  const sessionCookie = cookies.get("session");
  const res = await fetch(`${API_URL}/settings/logo`, {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "multipart/form-data",
      ...sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    },
    // @ts-ignore — duplex required for streaming body
    body: request.body,
    duplex: "half"
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
};

export { POST };
//# sourceMappingURL=_server.ts-DYpbbojL.js.map
