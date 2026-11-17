import { r as redirect } from './index-B2LGyy1l.js';
import { b as private_env } from './shared-server-DaWdgxVh.js';

const API_URL = private_env.API_URL ?? "http://localhost:4000";
const POST = async ({ cookies, fetch }) => {
  const sessionCookie = cookies.get("session");
  if (sessionCookie) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { cookie: `session=${sessionCookie}` }
      });
    } catch {
    }
  }
  cookies.delete("session", { path: "/" });
  redirect(303, "/");
};

export { POST };
//# sourceMappingURL=_server.ts-BJK09IEp.js.map
