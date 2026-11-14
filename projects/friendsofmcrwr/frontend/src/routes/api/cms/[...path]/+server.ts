import { env } from '$env/dynamic/private';
import { RESERVED_SLUGS } from '$lib/server/cms/reserved';
import { toSlug } from '$lib/cms/links';
import type { CmsNode } from '$lib/cms/types';
import type { RequestHandler } from './$types';

const API_URL = env.API_URL ?? 'http://localhost:4000';

// Browser → API bridge for everything under /cms. Forwards the session cookie, the query string
// and the JSON body on every method, and passes the API's status and body through unchanged (a
// 409 keeps its `rev`, validation messages reach the UI as-is).
// It also refuses top-level slugs that this project's own routes use (see $lib/server/cms/reserved.ts);
// the API only knows a fixed baseline list.

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

  const refusal = await reservedSlugRefusal(request.method, path, body, headers);
  if (refusal) return refusal;

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

/**
 * A 400 when a write would leave a top-level item on a slug the project's routes use:
 * creating at the root, changing a root item's slug or type, or moving an item to the root.
 * Anything it can't parse is left for the API to reject.
 */
async function reservedSlugRefusal(method: string, path: string, body: string | undefined, headers: Record<string, string>): Promise<Response | null> {
  const create = method === 'POST' && path === 'nodes';
  const patch = method === 'PATCH' && /^nodes\/[a-f0-9]{24}$/.test(path);
  const move = method === 'POST' && /^nodes\/[a-f0-9]{24}\/move$/.test(path);
  if (!create && !patch && !move) return null;

  let b: Record<string, unknown>;
  try { b = body ? JSON.parse(body) : {}; } catch { return null; }
  if (typeof b !== 'object' || b === null) return null;

  let slug: string | null = null;
  if (create) {
    if (b.parentId || b.type === 'link') return null;
    slug = typeof b.slug === 'string' && b.slug.trim() ? b.slug.trim() : toSlug(String(b.title ?? ''));
  } else {
    if (patch && b.slug === undefined && b.type === undefined) return null;
    if (move && b.parentId !== null) return null;
    const node = await findNode(path.split('/')[1], headers);
    if (!node) return null;
    const type = typeof b.type === 'string' ? b.type : node.type;
    if (type === 'link' || (patch && node.parentId !== null)) return null;
    slug = typeof b.slug === 'string' && b.slug.trim() ? b.slug.trim()
      : node.slug ?? toSlug(String(b.title ?? node.title));
  }
  if (!slug || !RESERVED_SLUGS.has(slug)) return null;
  return json(400, { statusCode: 400, error: 'Bad Request', message: `"/${slug}" is used by the application. Choose another slug.` });
}

async function findNode(id: string, headers: Record<string, string>): Promise<CmsNode | undefined> {
  try {
    const res = await fetch(`${API_URL}/cms/nodes`, { headers: { cookie: headers.cookie ?? '' } });
    return res.ok ? ((await res.json()) as CmsNode[]).find(n => n.id === id) : undefined;
  } catch {
    return undefined;
  }
}

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
