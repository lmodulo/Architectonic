import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission } from '$lib/permissions';
import type { PageServerLoad } from './$types';

const API_URL  = env.API_URL ?? 'http://localhost:4000';
const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
  if (!hasPermission(locals.user, 'audit', 'read')) redirect(303, '/403');

  const page    = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const action  = url.searchParams.get('action') ?? '';
  const q       = url.searchParams.get('q') ?? '';
  const sort    = url.searchParams.get('sort')    ?? 'createdAt';
  const sortDir = url.searchParams.get('sortDir') ?? 'desc';

  const skip  = (page - 1) * PAGE_SIZE;
  const qs    = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip), sort, sortDir });
  if (action) qs.set('action', action);
  if (q)      qs.set('q', q);

  const sessionCookie = cookies.get('session');
  const headers = sessionCookie ? { cookie: `session=${sessionCookie}` } : {};

  try {
    const res = await fetch(`${API_URL}/audit?${qs}`, { headers });
    if (!res.ok) {
      return { entries: [], count: 0, page, action, q, error: 'Failed to load audit log' };
    }
    const json = await res.json();
    const entries = Array.isArray(json?.entries) ? json.entries : Array.isArray(json) ? json : [];
    const count   = typeof json?.count === 'number' ? json.count : Array.isArray(json) ? json.length : 0;
    return { entries, count, page, action, q, sort, sortDir, error: null };
  } catch {
    return { entries: [], count: 0, page, action, q, sort, sortDir, error: 'Cannot reach the API server' };
  }
};
