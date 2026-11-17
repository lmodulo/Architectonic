// Who is calling the API, for the rate limit (plugins/rateLimitPlugin.ts).
//
// Browsers never call the API directly. Every call comes through the web server (SvelteKit), from a page
// load, a form action or one of its /api/* proxies, so without help every visitor would share the web
// server's one address and one rate limit (and the 10-a-minute login limit would be shared by the whole
// site). The web server therefore sends the shared INTERNAL_API_SECRET with each call, plus the address of
// the visitor it is serving (frontend: $lib/server/api-identity.ts):
//
//   - secret + a visitor address -> limited per visitor
//   - secret, no visitor header  -> the web server's own call, made outside any page request: not limited
//   - anything else (no secret, a wrong one, the secret unset or too short, a malformed address)
//                                -> limited by the connection's address, as before
import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

export const SECRET_HEADER  = 'x-internal-secret';
export const VISITOR_HEADER = 'x-client-ip';
export const MIN_SECRET_LENGTH = 32;

export type Caller =
  | { kind: 'visitor'; address: string }
  | { kind: 'web' }
  | { kind: 'direct' };

// An IPv4 or IPv6 address, including the IPv4-mapped form (::ffff:203.0.113.7)
const ADDRESS = /^[0-9A-Fa-f:.]{2,45}$/;

// Hash both sides so the comparison is constant-time whatever the lengths
const digest = (s: string) => createHash('sha256').update(s).digest();

export function identifyCaller(headers: IncomingHttpHeaders, secret: string | undefined): Caller {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return { kind: 'direct' };

  const presented = headers[SECRET_HEADER];
  if (typeof presented !== 'string' || !timingSafeEqual(digest(presented), digest(secret))) {
    return { kind: 'direct' };
  }

  const address = headers[VISITOR_HEADER];
  if (address === undefined) return { kind: 'web' };
  return typeof address === 'string' && ADDRESS.test(address)
    ? { kind: 'visitor', address }
    : { kind: 'direct' };
}
