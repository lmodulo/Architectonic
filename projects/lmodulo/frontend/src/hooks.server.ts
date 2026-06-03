import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { Handle } from '@sveltejs/kit';
import type { Action } from '$lib/permissions';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Returns the client workspace slug from the subdomain, or null for the apex/www/localhost.
// e.g. techfusion.lmodulo.net → 'techfusion', www.lmodulo.net → null
function getWorkspaceSlug(hostname: string): string | null {
  const apex = env.PUBLIC_APEX_DOMAIN ?? 'lmodulo.net';
  if (hostname === apex || hostname === `www.${apex}` || hostname === 'localhost' || hostname === '127.0.0.1') return null;
  const dot = hostname.indexOf('.');
  if (dot !== -1 && hostname.slice(dot + 1) === apex) return hostname.slice(0, dot);
  return null;
}

// All paths accessible without authentication
const PUBLIC_PATHS = new Set([
  '/', '/login', '/register', '/forgot-password', '/reset-password',
  '/accept-invite', '/logout', '/upcoming-events', '/set-password'
]);

// Auth paths that authenticated users are bounced away from
const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

// Routes customers (role: 'customer') may visit when authenticated
const CUSTOMER_ALLOWED_PATHS = new Set([
  '/client-portal', '/client-portal/tickets',
  '/client-portal/projects',
  '/client-portal/invoices',
  '/client-portal/estimates',
  '/payments', '/profile', '/logout',
]);

// Routes that require a specific permission beyond authentication
const ROUTE_PERMISSIONS: Record<string, { resource: string; action: Action }> = {
  '/manage-users': { resource: 'users',            action: 'read' },
  '/roles':        { resource: 'roles',            action: 'read' },
  '/folio':        { resource: 'finance_invoices', action: 'read' },
  '/vault':        { resource: 'vault_documents',  action: 'read' }
};

export const handle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get('session');

  event.locals.user = null;
  event.locals.workspaceSlug = getWorkspaceSlug(event.url.hostname);

  if (sessionCookie) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          cookie: `session=${sessionCookie}`,
          ...(event.locals.workspaceSlug ? { 'x-workspace-slug': event.locals.workspaceSlug } : {})
        }
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
    redirect(303, event.locals.user.role === 'customer' ? '/client-portal' : '/dashboard');
  }

  // Redirect unauthenticated users to login
  if (!event.locals.user && !PUBLIC_PATHS.has(path) && !path.startsWith('/api/') && !path.startsWith('/uploads/') && !path.startsWith('/documentation/')) {
    redirect(303, '/login');
  }

  // Customers may only access their allowed paths
  if (
    event.locals.user?.role === 'customer' &&
    !CUSTOMER_ALLOWED_PATHS.has(path) &&
    !path.startsWith('/client-portal/invoices/') &&
    !path.startsWith('/invoice/') &&
    !path.startsWith('/api/') &&
    !path.startsWith('/messages/')
  ) {
    redirect(303, '/client-portal');
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
