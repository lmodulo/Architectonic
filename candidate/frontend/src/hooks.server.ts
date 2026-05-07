import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { Handle } from '@sveltejs/kit';
import type { Action } from '$lib/permissions';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// All paths accessible without authentication
const PUBLIC_PATHS = new Set([
  '/', '/login', '/register', '/forgot-password', '/reset-password',
  '/logout', '/upcoming-events'
]);

// Auth paths that authenticated users are bounced away from
const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

// Routes customers (role: 'customer') may visit when authenticated
const CUSTOMER_ALLOWED_PATHS = new Set(['/', '/profile', '/logout', '/upcoming-events']);

// Routes that require a specific permission beyond authentication
const ROUTE_PERMISSIONS: Record<string, { resource: string; action: Action }> = {
  '/manage-users': { resource: 'users', action: 'read' },
  '/roles':        { resource: 'roles', action: 'read' }
};

export const handle: Handle = async ({ event, resolve }) => {
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

  // Redirect authenticated users away from auth pages
  if (event.locals.user && AUTH_PATHS.has(path)) {
    redirect(303, event.locals.user.role === 'customer' ? '/' : '/dashboard');
  }

  // Redirect unauthenticated users to login
  if (!event.locals.user && !PUBLIC_PATHS.has(path) && !path.startsWith('/api/') && !path.startsWith('/uploads/')) {
    redirect(303, '/login');
  }

  // Customers may only access their allowed paths
  if (event.locals.user?.role === 'customer' && !CUSTOMER_ALLOWED_PATHS.has(path) && !path.startsWith('/api/')) {
    redirect(303, '/');
  }

  // Permission-based route guards (staff only — customers already redirected above)
  if (event.locals.user) {
    const permEntry = Object.entries(ROUTE_PERMISSIONS).find(([prefix]) =>
      path.startsWith(prefix)
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
