// Server-only loaders for the public site, shared by the CMS catch-all route, the home-page
// override (lib/server/module-home/cms.ts) and the draft preview.
//
// They call API_URL directly. Going through event.fetch('/api/cms/...') would run hooks.server.ts
// again for every call, including its /auth/me request, and the dev API allows 200 requests a minute.
import { env } from '$env/dynamic/private';
import { componentFor } from '$lib/cms/components';
import type { PageView, ResolveResult, SiteMenu } from '$lib/cms/types';

const API_URL = env.API_URL ?? 'http://localhost:4000';
const COMPONENT_LOAD_TIMEOUT_MS = 5000;

export const EMPTY_MENU: SiteMenu = { items: [], footer: { text: '', links: [] } };

/** The published menu and footer. Never throws: on any failure the site renders with an empty menu. */
export async function loadMenu(): Promise<SiteMenu> {
  try {
    const res = await fetch(`${API_URL}/cms/site/menu`);
    if (!res.ok) return EMPTY_MENU;
    const menu = (await res.json()) as SiteMenu;
    return Array.isArray(menu?.items) ? menu : EMPTY_MENU;
  } catch {
    return EMPTY_MENU;
  }
}

export type LoadedPage =
  | { kind: 'page'; view: PageView; componentData: Record<string, unknown> }
  | { kind: 'redirect'; to: string }
  | { kind: 'notFound' }
  | { kind: 'unavailable' };

interface LoadEvent { fetch: typeof fetch; url: URL; cookies: { get(name: string): string | undefined } }

/** Resolves a public path to its published page, then runs its components' loads. */
export async function loadPage(event: LoadEvent, path: string): Promise<LoadedPage> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/cms/site/resolve?path=${encodeURIComponent(path)}`);
  } catch {
    return { kind: 'unavailable' };
  }
  if (res.status === 404) return { kind: 'notFound' };
  if (!res.ok) return { kind: 'unavailable' };
  const body = (await res.json()) as ResolveResult;
  if ('redirect' in body) return { kind: 'redirect', to: body.redirect };
  return withComponents(event, body);
}

/** The draft of one node, for staff previews (forwards the session cookie). */
export async function loadPreview(event: LoadEvent, nodeId: string): Promise<LoadedPage> {
  const session = event.cookies.get('session');
  let res: Response;
  try {
    res = await fetch(`${API_URL}/cms/pages/${encodeURIComponent(nodeId)}/preview`, {
      headers: session ? { cookie: `session=${session}` } : {},
    });
  } catch {
    return { kind: 'unavailable' };
  }
  if (res.status === 404 || res.status === 400) return { kind: 'notFound' };
  if (!res.ok) return { kind: 'unavailable' };
  return withComponents(event, (await res.json()) as PageView);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

/**
 * Runs every component `load` the page needs, in parallel, each with a timeout. Results are keyed
 * by block id, or 'page' for a component node. A failed load yields `{ unavailable: true }`.
 * Leftover path segments (`rest`) are a 404 unless the node's component accepts subpaths; a
 * component with `subpage` then says what's there (its title and breadcrumbs), or that nothing is.
 */
async function withComponents(event: LoadEvent, view: PageView): Promise<LoadedPage> {
  const jobs: { id: string; key: string; mode: 'page' | 'block'; props: Record<string, unknown>; rest: string | null; base: string | null }[] = [];

  const pageEntry = view.node.type === 'component' ? componentFor(view.node.component?.key, 'page') : undefined;
  if (view.node.type === 'component') {
    if (view.rest && !pageEntry?.subpaths) return { kind: 'notFound' };
    if (pageEntry) jobs.push({ id: 'page', key: pageEntry.key, mode: 'page', props: view.node.component?.props ?? {}, rest: view.rest ?? null, base: view.node.path });
  } else if (view.rest) {
    return { kind: 'notFound' };
  }
  for (const block of view.page?.blocks ?? []) {
    if (block.type === 'component' && componentFor(block.data.key, 'block')) {
      jobs.push({ id: block.id, key: block.data.key, mode: 'block', props: block.data.props ?? {}, rest: null, base: null });
    }
  }

  const componentData: Record<string, unknown> = {};
  const failed = new Set<string>();
  await Promise.all(jobs.map(async job => {
    const entry = componentFor(job.key, job.mode);
    if (!entry?.load) return;
    try {
      componentData[job.id] = await withTimeout(
        entry.load({ fetch: event.fetch, url: event.url, rest: job.rest, base: job.base, props: job.props }),
        COMPONENT_LOAD_TIMEOUT_MS,
      );
    } catch (err) {
      console.error(`[cms] component "${job.key}" load failed:`, err);
      componentData[job.id] = { unavailable: true };
      failed.add(job.id);
    }
  }));

  if (view.rest && pageEntry?.subpage && !failed.has('page')) {
    const sub = pageEntry.subpage(componentData.page, view.rest);
    if (!sub) return { kind: 'notFound' };
    view = {
      ...view,
      subpage: { title: sub.title, path: sub.path, ...(sub.description ? { description: sub.description } : {}) },
      breadcrumbs: [...view.breadcrumbs, ...sub.crumbs],
    };
  }
  return { kind: 'page', view, componentData };
}
