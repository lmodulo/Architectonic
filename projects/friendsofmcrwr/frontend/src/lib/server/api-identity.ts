// Tells the API which visitor each server-side call is for, so its rate limit counts visitors separately
// instead of lumping everyone under the web server's one address. The API half is api/src/lib/callerKey.ts.
//
// Pages, form actions and the /api/* proxies call the API with the global fetch() (hundreds of call sites
// across the scaffold and the modules). Rather than change each one, installApiIdentity() wraps the global
// fetch once: a call to API_URL gets the shared INTERNAL_API_SECRET plus the visitor's address, which
// hooks.server.ts records for each request with withVisitor(). Calls to any other host are passed through
// untouched, so the secret is only ever sent to the API. Without INTERNAL_API_SECRET nothing is wrapped.
import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from '$env/dynamic/private';

const SECRET_HEADER  = 'x-internal-secret';
const VISITOR_HEADER = 'x-client-ip';

const visitor = new AsyncLocalStorage<{ address: string }>();

// The unwrapped fetch, kept on globalThis so a dev reload of this module doesn't wrap it twice
const ORIGINAL = Symbol.for('architectonic.unwrappedFetch');
type WithOriginal = typeof globalThis & { [ORIGINAL]?: typeof fetch };

/**
 * Runs `fn` (the handling of one request) with the visitor's address available to the API calls made
 * inside it. An internal request (event.fetch to one of our own routes) keeps the outer visitor when it
 * has no address of its own. An unknown address is sent as 'unknown', which the API doesn't trust: those
 * calls fall back to the web server's shared limit rather than escaping it.
 */
export function withVisitor<T>(address: string | null, fn: () => T): T {
  return visitor.run({ address: address || visitor.getStore()?.address || 'unknown' }, fn);
}

export function installApiIdentity(): void {
  const g = globalThis as WithOriginal;
  const original = (g[ORIGINAL] ??= globalThis.fetch);
  const secret = env.INTERNAL_API_SECRET;
  if (!secret) {
    globalThis.fetch = original;
    return;
  }

  const apiOrigin = new URL(env.API_URL ?? 'http://localhost:4000').origin;

  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      return original(input, init);
    }
    if (origin !== apiOrigin) return original(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set(SECRET_HEADER, secret);
    const current = visitor.getStore();
    if (current) headers.set(VISITOR_HEADER, current.address);
    else headers.delete(VISITOR_HEADER); // the web server's own call, outside any request
    return original(input, { ...init, headers });
  };
}
