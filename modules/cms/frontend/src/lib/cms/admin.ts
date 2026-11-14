// Client-side helpers for the Content admin: the site tree, the page builder and settings.
// Browser calls go through the /api/cms proxy (routes/api/cms/[...path]), which forwards the
// session cookie and passes the API's status and message through.
import { safeHref } from './links';
import { CMS_COMPONENTS, componentFor } from './components';
import type { Block, BlockType, CmsNode, LinkRef, PropSpec, Seo } from './types';

// ── API ─────────────────────────────────────────────────────────────────────────────────────

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** the API's message on failure, else a plain-language fallback */
  message: string;
  /** the raw response body (a 409 carries the current `rev`) */
  body: Record<string, unknown> | null;
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Your session has ended. Sign in again.';
  if (status === 403) return 'You don\'t have permission to do that.';
  if (status === 404) return 'That item no longer exists. Reload the page.';
  if (status === 429) return 'Too many requests. Wait a minute and try again.';
  if (status >= 500) return 'The server had a problem. Try again in a moment.';
  return `Something went wrong (status ${status}).`;
}

export async function cmsApi<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api/cms/${path}`, {
      method: init.method ?? 'GET',
      headers: init.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const message = res.ok ? '' : (typeof body?.message === 'string' && body.message) || fallbackMessage(res.status);
    return { ok: res.ok, status: res.status, data: res.ok ? (body as T) : null, message, body };
  } catch {
    return { ok: false, status: 0, data: null, message: 'Cannot reach the server. Check your connection and try again.', body: null };
  }
}

// ── Site tree ───────────────────────────────────────────────────────────────────────────────

export interface TreeItem {
  node: CmsNode;
  children: TreeItem[];
  parent: TreeItem | null;
  depth: number;
}

/** Nests the flat GET /cms/nodes list. Items whose parent is missing are treated as top level. */
export function buildTree(nodes: CmsNode[]): { roots: TreeItem[]; byId: Map<string, TreeItem> } {
  const byId = new Map<string, TreeItem>();
  for (const node of nodes) byId.set(node.id, { node, children: [], parent: null, depth: 0 });
  const roots: TreeItem[] = [];
  for (const node of nodes) {
    const item = byId.get(node.id)!;
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) { item.parent = parent; parent.children.push(item); } else roots.push(item);
  }
  const finish = (list: TreeItem[], depth: number) => {
    list.sort((a, b) => a.node.order - b.node.order);
    for (const item of list) { item.depth = depth; finish(item.children, depth + 1); }
  };
  finish(roots, 0);
  return { roots, byId };
}

/** Same rule as the API: lowercase letters, numbers and single dashes. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The inline error for a slug, or null. Mirrors the API's and the proxy's checks. */
export function slugProblem(slug: string, o: { parentId: string | null; selfId?: string; nodes: CmsNode[]; reserved: readonly string[] }): string | null {
  if (!slug) return 'Add a slug.';
  if (slug.length > 80 || !SLUG_RE.test(slug)) return 'Use lowercase letters, numbers and single dashes.';
  if (!o.parentId && o.reserved.includes(slug)) return `"/${slug}" is used by the application. Choose another slug.`;
  const clash = o.nodes.find(n => n.parentId === o.parentId && n.id !== o.selfId && n.type !== 'link' && n.slug === slug);
  if (clash) return `"${clash.title}" already uses this slug here.`;
  return null;
}

/** The URL an item would have with `slug` under `parentId` (for the live URL preview). */
export function pathFor(parentId: string | null, slug: string, nodes: CmsNode[]): string {
  const parent = parentId ? nodes.find(n => n.id === parentId) : undefined;
  return `${parent?.path ?? ''}/${slug}`;
}

// ── Links ───────────────────────────────────────────────────────────────────────────────────

/** Items a link can point at (anything with a URL of its own), indented by depth, in tree order. */
export function linkTargets(nodes: CmsNode[]): { id: string; label: string; path: string; visible: boolean }[] {
  const { roots } = buildTree(nodes);
  const out: { id: string; label: string; path: string; visible: boolean }[] = [];
  const walk = (list: TreeItem[]) => {
    for (const item of list) {
      if (item.node.type !== 'link') {
        out.push({ id: item.node.id, label: `${'— '.repeat(item.depth)}${item.node.title}`, path: item.node.href ?? '', visible: item.node.visible });
        walk(item.children);
      }
    }
  };
  walk(roots);
  return out;
}

/** nodeId → URL for every item, published or not: the editor canvas shows links to drafts too. */
export function editorLinkMap(nodes: CmsNode[]): Record<string, string> {
  return Object.fromEntries(nodes.filter(n => n.type !== 'link' && n.href).map(n => [n.id, n.href!]));
}

export function linkProblem(link: LinkRef | undefined, nodes: CmsNode[]): string | null {
  if (!link) return 'Choose a page or enter a URL.';
  if ('nodeId' in link) {
    const target = nodes.find(n => n.id === link.nodeId);
    if (!target || target.type === 'link') return 'The linked page no longer exists. Choose another.';
    return null;
  }
  return safeHref(link.url) ? null : 'Enter a URL starting with https://, http://, mailto:, tel:, / or #.';
}

// ── Blocks ──────────────────────────────────────────────────────────────────────────────────

/** A block id the API accepts (/^[A-Za-z0-9_-]{1,64}$/). crypto.randomUUID needs a secure context. */
export function blockId(): string {
  if (typeof crypto.randomUUID === 'function' && globalThis.isSecureContext) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Registry entries that can be placed as a block, and as a whole page. */
export const blockComponents = () => Object.values(CMS_COMPONENTS).filter(e => e.modes.includes('block'));
export const pageComponents = () => Object.values(CMS_COMPONENTS).filter(e => e.modes.includes('page'));

export function defaultProps(specs: PropSpec[] | undefined): Record<string, unknown> {
  return Object.fromEntries((specs ?? []).filter(s => s.default !== undefined).map(s => [s.name, s.default]));
}

export function newBlock(type: BlockType): Block {
  const id = blockId();
  switch (type) {
    case 'richText': return { id, type, data: { doc: { type: 'doc', content: [{ type: 'paragraph' }] } } };
    case 'hero':     return { id, type, data: { title: 'A heading for this page', subtitle: '', align: 'center', height: 'md' } };
    case 'buttons':  return { id, type, data: { items: [{ label: 'Learn more', link: { url: '/' }, style: 'primary' }], align: 'left' } };
    case 'divider':  return { id, type, data: { style: 'line', size: 'md' } };
    case 'gallery':  return { id, type, data: { images: [], columns: 3, aspect: 'square', gap: 'md' } };
    case 'component': {
      const entry = blockComponents()[0];
      return { id, type, data: { key: entry?.key ?? '', props: defaultProps(entry?.props) } };
    }
  }
}

/**
 * Fills optional fields the editors bind to. Svelte's `bind:` writes an input's value back when the
 * bound field is undefined, which would make a page look edited the moment it opens.
 */
export function editable(content: { blocks: Block[]; seo: Seo }): { blocks: Block[]; seo: Seo } {
  const blocks = plain(content.blocks).map(b => (b.type === 'hero' ? { ...b, data: { ...b.data, subtitle: b.data.subtitle ?? '' } } : b));
  const seo = { ...plain(content.seo ?? {}), title: content.seo?.title ?? '', description: content.seo?.description ?? '', noindex: content.seo?.noindex === true };
  return { blocks, seo };
}

/** A plain deep copy (blocks are JSON, and structuredClone can't clone a $state proxy). */
export const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** A deep copy with a fresh id. */
export const duplicateBlock = (b: Block): Block => ({ ...plain(b), id: blockId() });

/**
 * Problems in a block. `errors` are parts the API would drop on save (an empty button label, a bad
 * URL); `warnings` save fine but need attention (an unknown component, an empty hero heading).
 */
export function blockProblems(b: Block, nodes: CmsNode[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (b.type === 'hero') {
    if (!b.data.title.trim()) warnings.push('The heading is empty.');
    if (b.data.cta) {
      if (!b.data.cta.label.trim()) errors.push('The button needs a label.');
      const p = linkProblem(b.data.cta.link, nodes);
      if (p) errors.push(`Button link: ${p}`);
    }
  } else if (b.type === 'buttons') {
    if (!b.data.items.length) warnings.push('Add at least one button.');
    b.data.items.forEach((item, i) => {
      if (!item.label.trim()) errors.push(`Button ${i + 1} needs a label.`);
      const p = linkProblem(item.link, nodes);
      if (p) errors.push(`Button ${i + 1}: ${p}`);
    });
  } else if (b.type === 'component') {
    if (!b.data.key) warnings.push('Choose a component.');
    else if (!CMS_COMPONENTS[b.data.key]) warnings.push(`No component called "${b.data.key}" is installed, so this block shows nothing on the site.`);
    else if (!componentFor(b.data.key, 'block')) warnings.push(`"${CMS_COMPONENTS[b.data.key].label}" can only be used as a whole page.`);
  }
  return { errors, warnings };
}

export type BlockAction = 'up' | 'down' | 'duplicate' | 'remove';

export const BLOCK_LABELS: Record<BlockType, string> = {
  richText: 'Text',
  hero: 'Hero',
  gallery: 'Gallery',
  buttons: 'Buttons',
  divider: 'Divider',
  component: 'Component',
};
