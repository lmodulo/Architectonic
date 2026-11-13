import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Browser → API bridge for everything under /cms. Forwards the session cookie, the query string
// and the JSON body on every method, and passes the API's status and body through unchanged (a
// 409 keeps its `rev`, validation messages reach the UI as-is).
// Session 3 adds the project-specific reserved-slug check for node POST and PATCH here.

/** Plain path segments only: no `..`, no encoded slashes, so the proxy can't reach other API routes. */
const SAFE_PATH = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

const proxy: RequestHandler = async ({ params, url, request, cookies }) => {
  const path = params.path ?? '';
  if (!SAFE_PATH.test(path)) return json(404, { statusCode: 404, error: 'Not Found', message: 'Not found' });

  const headers: Record<string, string> = {};
  const session = cookies.get('session');
  if (session) headers.cookie = `session=${session}`;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
    if (body) headers['content-type'] = 'application/json';
    else body = undefined;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/cms/${path}${url.search}`, { method: request.method, headers, body });
  } catch {
    return json(503, { statusCode: 503, error: 'Service Unavailable', message: 'Cannot reach the API server' });
  }
  if (res.status === 204) return new Response(null, { status: 204 });
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
};

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
