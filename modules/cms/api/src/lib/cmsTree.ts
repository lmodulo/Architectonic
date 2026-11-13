// The site tree, built in memory from every cms_nodes document. Trees are small, so nothing stores
// a materialized path: moves never rewrite descendants, and paths, visibility, the menu and URL
// resolution are all derived here per request.
import type { Db, ObjectId } from 'mongodb';
import { collectRefs, type Block, type Seo } from './cmsSanitize.js';

export const NODE_TYPES = ['page', 'component', 'link', 'label'] as const;
export type NodeType = typeof NODE_TYPES[number];

export interface CmsNodeDoc {
  _id: ObjectId;
  parentId: ObjectId | null;
  order: number;
  type: NodeType;
  title: string;
  slug?: string;
  showInMenu: boolean;
  status: 'draft' | 'published';
  component?: { key: string; props: Record<string, unknown> };
  url?: string;
  newTab?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
}

export interface TreeNode {
  id: string;
  doc: CmsNodeDoc;
  parent: TreeNode | null;
  children: TreeNode[];
  /** Slug path such as '/about/team'. null for links and for nodes not reachable from a root. */
  path: string | null;
  /** The node and every ancestor are published. */
  visible: boolean;
}

export interface MenuItem {
  id: string;
  type: NodeType;
  title: string;
  href: string;
  newTab?: boolean;
  children: MenuItem[];
}

export interface SiteTreeItem {
  id: string;
  type: NodeType;
  title: string;
  href: string;
  showInMenu: boolean;
  children: SiteTreeItem[];
}

export type Resolution =
  | { kind: 'notFound' }
  | { kind: 'redirect'; to: string }
  | { kind: 'node'; node: TreeNode; rest?: string };

const SEGMENT = /^[a-z0-9-]+$/;

export class CmsTree {
  readonly byId = new Map<string, TreeNode>();
  readonly roots: TreeNode[] = [];

  constructor(docs: CmsNodeDoc[], readonly homeId: string | null) {
    for (const doc of docs) {
      this.byId.set(doc._id.toString(), { id: doc._id.toString(), doc, parent: null, children: [], path: null, visible: false });
    }
    for (const node of this.byId.values()) {
      const pid = node.doc.parentId?.toString();
      if (!pid) { this.roots.push(node); continue; }
      const parent = this.byId.get(pid);
      if (parent) { node.parent = parent; parent.children.push(node); }
      // A node whose parent no longer exists stays unreachable (no path, not visible)
    }
    const byOrder = (a: TreeNode, b: TreeNode) =>
      a.doc.order - b.doc.order || a.doc.createdAt.getTime() - b.doc.createdAt.getTime();
    this.roots.sort(byOrder);
    for (const n of this.byId.values()) n.children.sort(byOrder);

    // Depth-first from the roots. `seen` guards against a corrupted parent cycle.
    const seen = new Set<string>();
    const visit = (n: TreeNode, parentPath: string, parentVisible: boolean) => {
      if (seen.has(n.id)) return;
      seen.add(n.id);
      n.path = n.doc.type === 'link' || !n.doc.slug ? null : `${parentPath}/${n.doc.slug}`;
      n.visible = parentVisible && n.doc.status === 'published';
      for (const c of n.children) visit(c, n.path ?? parentPath, n.visible);
    };
    for (const r of this.roots) visit(r, '', true);
  }

  static async load(db: Db): Promise<CmsTree> {
    const [docs, settings] = await Promise.all([
      db.collection<CmsNodeDoc>('cms_nodes').find().toArray(),
      db.collection<{ _id: string; homeNodeId?: ObjectId | null }>('cms_settings').findOne({ _id: 'site' }),
    ]);
    return new CmsTree(docs, settings?.homeNodeId?.toString() ?? null);
  }

  get(id: string | null | undefined): TreeNode | undefined {
    return id ? this.byId.get(id) : undefined;
  }

  /** The public URL of a node: '/' for the home page, the slug path otherwise, the URL for links. */
  urlOf(n: TreeNode): string | null {
    if (n.doc.type === 'link') return n.doc.url ?? null;
    if (n.id === this.homeId) return '/';
    return n.path;
  }

  /** True when `ancestorId` is `nodeId` itself or one of its ancestors. */
  isSelfOrAncestor(ancestorId: string, nodeId: string): boolean {
    const seen = new Set<string>();
    for (let n = this.get(nodeId); n && !seen.has(n.id); n = n.parent ?? undefined) {
      if (n.id === ancestorId) return true;
      seen.add(n.id);
    }
    return false;
  }

  siblings(parentId: string | null): TreeNode[] {
    return parentId ? this.get(parentId)?.children ?? [] : this.roots;
  }

  breadcrumbs(n: TreeNode): { id: string; title: string; path: string | null }[] {
    const chain: TreeNode[] = [];
    const seen = new Set<string>();
    for (let c: TreeNode | null = n; c && !seen.has(c.id); c = c.parent) { chain.unshift(c); seen.add(c.id); }
    return chain.map(c => ({ id: c.id, title: c.doc.title, path: this.urlOf(c) }));
  }

  /** First visible page or component under a label, in menu order (labels are descended). */
  firstVisibleTarget(n: TreeNode, depth = 0): TreeNode | undefined {
    if (depth > 50) return undefined;
    for (const c of n.children) {
      if (!c.visible) continue;
      if (c.doc.type === 'page' || c.doc.type === 'component') return c;
      if (c.doc.type === 'label') {
        const t = this.firstVisibleTarget(c, depth + 1);
        if (t) return t;
      }
    }
    return undefined;
  }

  /**
   * Resolves a public URL path. Segments are matched against slugs from the roots down; when the
   * deepest match is a component node, any remaining segments are handed to it as `rest` (the
   * frontend decides whether that component accepts subpaths).
   */
  resolve(rawPath: string): Resolution {
    const notFound = { kind: 'notFound' } as const;
    if (!rawPath.startsWith('/') || rawPath.length > 1024) return notFound;
    const segments = rawPath.split('/').filter(Boolean);
    if (!segments.every(s => SEGMENT.test(s))) return notFound;

    if (segments.length === 0) {
      const home = this.get(this.homeId);
      return home && home.visible && home.doc.type === 'page' ? { kind: 'node', node: home } : notFound;
    }

    let level = this.roots;
    let current: TreeNode | undefined;
    let i = 0;
    for (; i < segments.length; i++) {
      const next = level.find(c => c.doc.type !== 'link' && c.doc.slug === segments[i]);
      if (!next) break;
      current = next;
      level = next.children;
    }
    if (!current || !current.visible || current.path === null) return notFound;

    let rest: string | undefined;
    if (i < segments.length) {
      if (current.doc.type !== 'component') return notFound;
      rest = segments.slice(i).join('/');
    }

    if (current.doc.type === 'label') {
      const target = this.firstVisibleTarget(current);
      const to = target && this.urlOf(target);
      return to ? { kind: 'redirect', to } : notFound;
    }
    if (current.id === this.homeId && !rest) return { kind: 'redirect', to: '/' };
    return { kind: 'node', node: current, rest };
  }

  /** Published nodes with showInMenu, as a nested menu. A hidden node hides its whole subtree. */
  menu(): MenuItem[] {
    const build = (nodes: TreeNode[], depth: number): MenuItem[] => {
      if (depth > 50) return [];
      const items: MenuItem[] = [];
      for (const n of nodes) {
        if (!n.visible || !n.doc.showInMenu) continue;
        const href = this.urlOf(n);
        if (!href) continue;
        const item: MenuItem = { id: n.id, type: n.doc.type, title: n.doc.title, href, children: build(n.children, depth + 1) };
        if (n.doc.type === 'link' && n.doc.newTab) item.newTab = true;
        items.push(item);
      }
      return items;
    };
    return build(this.roots, 0);
  }

  /**
   * Every visible node (menu-hidden ones included, flagged), nested, for the sitemap. Links are left
   * out: a sitemap lists the site's own pages.
   */
  publicTree(): SiteTreeItem[] {
    const build = (nodes: TreeNode[], depth: number): SiteTreeItem[] => {
      if (depth > 50) return [];
      return nodes.flatMap(n => {
        const href = n.visible && n.doc.type !== 'link' ? this.urlOf(n) : null;
        return href ? [{ id: n.id, type: n.doc.type, title: n.doc.title, href, showInMenu: n.doc.showInMenu, children: build(n.children, depth + 1) }] : [];
      });
    };
    return build(this.roots, 0);
  }

  /**
   * nodeId → public URL for the nodes among `ids`. Links to hidden or missing nodes are left out,
   * unless `includeHidden` (draft previews, where editors follow links to unpublished pages).
   */
  linkMap(ids: Iterable<string>, includeHidden = false): Record<string, string> {
    const out: Record<string, string> = {};
    for (const id of ids) {
      const n = this.get(id);
      const url = n && (n.visible || includeHidden) ? this.urlOf(n) : null;
      if (url) out[id] = url;
    }
    return out;
  }
}

// ── Site settings (one document) ─────────────────────────────────────────────────────────────

export interface FooterLink { label: string; link: { nodeId: string } | { url: string }; newTab?: boolean }
export interface SiteSettingsDoc {
  _id: 'site';
  homeNodeId: ObjectId | null;
  footer: { text: string; links: FooterLink[] };
  mediaFolderId: ObjectId | null;
  updatedAt?: Date;
  updatedBy?: ObjectId;
}

export async function getSiteSettings(db: Db): Promise<SiteSettingsDoc> {
  const doc = await db.collection<SiteSettingsDoc>('cms_settings').findOne({ _id: 'site' });
  return {
    _id: 'site',
    homeNodeId: doc?.homeNodeId ?? null,
    footer: { text: doc?.footer?.text ?? '', links: doc?.footer?.links ?? [] },
    mediaFolderId: doc?.mediaFolderId ?? null,
    updatedAt: doc?.updatedAt,
    updatedBy: doc?.updatedBy,
  };
}

/** API shape of a node: `_id` → `id`, ObjectIds as strings, plus the computed path and visibility. */
export function nodeJson(tree: CmsTree, n: TreeNode) {
  const d = n.doc;
  return {
    id:         n.id,
    parentId:   d.parentId?.toString() ?? null,
    order:      d.order,
    type:       d.type,
    title:      d.title,
    slug:       d.slug ?? null,
    showInMenu: d.showInMenu,
    status:     d.status,
    component:  d.component ?? null,
    url:        d.url ?? null,
    newTab:     d.newTab === true,
    path:       n.path,
    href:       tree.urlOf(n),
    visible:    n.visible,
    isHome:     n.id === tree.homeId,
    createdAt:  d.createdAt,
    updatedAt:  d.updatedAt,
    createdBy:  d.createdBy?.toString() ?? null,
    updatedBy:  d.updatedBy?.toString() ?? null,
  };
}

export interface PageContent { blocks: Block[]; seo: Seo }

/**
 * What the public renderer needs for one node: the node, its content (null for components and
 * labels), the Vault media its blocks use, nodeId → URL for its internal links, and breadcrumbs.
 * Used by /cms/site/resolve (published content) and /cms/pages/:nodeId/preview (the draft).
 */
export function pageView(tree: CmsTree, n: TreeNode, content: PageContent | null, opts: { rest?: string; preview?: boolean } = {}) {
  const refs = collectRefs(content?.blocks ?? []);
  return {
    node: {
      id:        n.id,
      type:      n.doc.type,
      title:     n.doc.title,
      path:      tree.urlOf(n),
      component: n.doc.type === 'component' ? n.doc.component ?? null : null,
    },
    page:        content,
    media:       {} as Record<string, { url: string; w?: number; h?: number }>, // filled from Vault in Session 5
    links:       tree.linkMap(refs.nodeIds, opts.preview === true),
    breadcrumbs: tree.breadcrumbs(n),
    ...(opts.rest ? { rest: opts.rest } : {}),
    ...(opts.preview ? { preview: true } : {}),
  };
}
