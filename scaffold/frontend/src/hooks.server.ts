import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Pages that unauthenticated users may visit (and authenticated users are redirected away from)
const AUTH_REDIRECT_PATHS = new Set(['/login', '/register']);

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
    redirect(303, '/dashboard');
  }

  // Redirect unauthenticated users to login (except login/register, root, logout, and internal API routes)
  if (!event.locals.user && !AUTH_REDIRECT_PATHS.has(path) && path !== '/' && path !== '/logout' && !path.startsWith('/api/')) {
    redirect(303, '/login');
  }

  return resolve(event);
};
