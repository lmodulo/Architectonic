import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import { resolveTheme } from '$lib/config/theme';
import { isPublicRoute, isCustomerRoute } from '$lib/config/route-rules';
import { customerHome } from '$lib/customer-home';
import { paraglideMiddleware } from '$lib/paraglide/server.js';
import type { Handle } from '@sveltejs/kit';
import type { Action } from '$lib/permissions';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// All paths accessible without authentication. Modules add their own public routes via
// src/lib/config/module-routes/ (see $lib/config/route-rules.ts); those are customer-accessible too.
const PUBLIC_PATHS = new Set([
  '/', '/login', '/register', '/forgot-password', '/reset-password',
  '/accept-invite', '/logout', '/upcoming-events'
]);

// Auth paths that authenticated users are bounced away from
const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

// Routes customers (role: 'customer') may visit when authenticated. Modules add customer pages
// (e.g. the client portal) with `customer: true` route rules in src/lib/config/module-routes/.
const CUSTOMER_ALLOWED_PATHS = new Set(['/', '/profile', '/logout', '/upcoming-events']);

// Routes that require a specific permission beyond authentication
const ROUTE_PERMISSIONS: Record<string, { resource: string; action: Action }> = {
  '/manage-users': { resource: 'users', action: 'read' },
  '/roles':        { resource: 'roles', action: 'read' }
};

const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, () => resolve(event));

const authHandle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('session');

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
      // API unreachable — degrade gracefully, treat as unauthenticated
    }
  }

  const path = event.url.pathname;
  // Route id of the matched route (set before handle runs; null when nothing matches), for routeId rules
  const routeId = event.route.id;

  // Redirect authenticated users away from auth pages
  if (event.locals.user && AUTH_PATHS.has(path)) {
    redirect(303, event.locals.user.role === 'customer' ? customerHome(event.locals.user) : '/dashboard');
  }

  // Redirect unauthenticated users to login
  if (!event.locals.user && !PUBLIC_PATHS.has(path) && !isPublicRoute(path, routeId) && !path.startsWith('/api/') && !path.startsWith('/uploads/')) {
    redirect(303, '/login');
  }

  // Customers may only access their allowed paths, plus module routes marked customer or public
  if (event.locals.user?.role === 'customer' && !CUSTOMER_ALLOWED_PATHS.has(path) && !isCustomerRoute(path, routeId) && !path.startsWith('/api/')) {
    redirect(303, customerHome(event.locals.user));
  }

  // Permission-based route guards (staff only — customers already redirected above).
  // Matched on segment boundaries, so '/roles' doesn't catch a page such as '/roles-of-the-board'.
  if (event.locals.user) {
    const permEntry = Object.entries(ROUTE_PERMISSIONS).find(([prefix]) =>
      path === prefix || path.startsWith(prefix + '/')
    );
    if (permEntry) {
      const [, { resource, action }] = permEntry;
      if (!hasPermission(event.locals.user, resource, action)) {
        redirect(303, '/403');
      }
    }
  }

  return resolve(event);
};

// Writes the active theme into <html data-theme="%app.theme%"> so every page, public ones
// included, renders server-side in the right theme. The value is set on locals by the root
// +layout.server.ts load, which has finished by the time HTML is rendered.
const themeHandle: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%app.theme%', resolveTheme(event.locals.theme))
  });

export const handle = sequence(paraglideHandle, authHandle, themeHandle);
