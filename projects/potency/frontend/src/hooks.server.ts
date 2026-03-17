import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { Handle } from '@sveltejs/kit';
import type { Action } from '$lib/permissions';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Pages that unauthenticated users may visit (and authenticated users are redirected away from)
const AUTH_REDIRECT_PATHS = new Set(['/login', '/register']);

// Public marketing pages — accessible to everyone
const PUBLIC_MARKETING_PATHS = new Set([
  '/about-me', '/affiliates', '/upcoming-events',
  '/privacy-policy', '/terms-and-conditions',
  '/certificate-of-analysis', '/shipping-return-policy'
]);

// Routes customers (role: 'customer') may visit when authenticated
const CUSTOMER_ALLOWED_PATHS = new Set(['/', '/profile', '/logout', ...PUBLIC_MARKETING_PATHS]);

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

  // Redirect authenticated users away from login/register
  if (event.locals.user && AUTH_REDIRECT_PATHS.has(path)) {
    redirect(303, event.locals.user.role === 'customer' ? '/' : '/dashboard');
  }

  // Redirect unauthenticated users to login
  if (!event.locals.user && !AUTH_REDIRECT_PATHS.has(path) && path !== '/' && path !== '/logout' && path !== '/forgot-password' && !path.startsWith('/reset-password') && !path.startsWith('/api/') && !path.startsWith('/shop') && !path.startsWith('/uploads/') && !PUBLIC_MARKETING_PATHS.has(path)) {
    redirect(303, '/login');
  }

  // Customers may only access their allowed paths
  if (event.locals.user?.role === 'customer' && !CUSTOMER_ALLOWED_PATHS.has(path) && !path.startsWith('/api/') && !path.startsWith('/shop')) {
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
