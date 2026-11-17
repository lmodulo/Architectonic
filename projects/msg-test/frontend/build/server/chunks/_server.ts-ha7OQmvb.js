import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const POST = async ({ cookies, request }) => {
  const sessionCookie = cookies.get("session");
  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "multipart/form-data",
      ...sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    },
    // @ts-ignore — duplex required for streaming body in Node fetch
    body: request.body,
    duplex: "half"
  });
  const data = res.ok ? await res.json() : await res.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
};
const DELETE = async ({ cookies }) => {
  const sessionCookie = cookies.get("session");
  const res = await fetch(`${API_URL}/auth/avatar`, {
    method: "DELETE",
    headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
  });
  return new Response(null, { status: res.status });
};

export { DELETE, POST };
//# sourceMappingURL=_server.ts-ha7OQmvb.js.map
