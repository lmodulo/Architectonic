import { redirect } from "@sveltejs/kit";
import { b as private_env } from "../chunks/shared-server.js";
import { h as hasPermission } from "../chunks/permissions.js";
const API_URL = private_env.API_URL ?? "http://localhost:4000";
const PUBLIC_PATHS = /* @__PURE__ */ new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/accept-invite",
  "/logout",
  "/upcoming-events"
]);
const AUTH_PATHS = /* @__PURE__ */ new Set(["/login", "/register", "/forgot-password", "/reset-password"]);
const CUSTOMER_ALLOWED_PATHS = /* @__PURE__ */ new Set(["/", "/profile", "/logout", "/upcoming-events"]);
const ROUTE_PERMISSIONS = {
  "/manage-users": { resource: "users", action: "read" },
  "/roles": { resource: "roles", action: "read" }
};
const handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get("session");
  event.locals.user = null;
  if (sessionCookie) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { cookie: `session=${sessionCookie}` }
      });
      if (res.ok) {
        event.locals.user = await res.json();
      }
    } catch {
    }
  }
  const path = event.url.pathname;
  if (event.locals.user && AUTH_PATHS.has(path)) {
    redirect(303, event.locals.user.role === "customer" ? "/" : "/dashboard");
  }
  if (!event.locals.user && !PUBLIC_PATHS.has(path) && !path.startsWith("/api/") && !path.startsWith("/uploads/")) {
    redirect(303, "/login");
  }
  if (event.locals.user?.role === "customer" && !CUSTOMER_ALLOWED_PATHS.has(path) && !path.startsWith("/api/")) {
    redirect(303, "/");
  }
  if (event.locals.user) {
    const permEntry = Object.entries(ROUTE_PERMISSIONS).find(
      ([prefix]) => path.startsWith(prefix)
    );
    if (permEntry) {
      const [, { resource, action }] = permEntry;
      if (!hasPermission(event.locals.user, resource, action)) {
        redirect(303, "/403");
      }
    }
  }
  return resolve(event);
};
export {
  handle
};
