// State and actions for the site tree admin (/cms), shared by SiteTree, SiteTreeNode, NodePanel and
// AddNodeForm through context. Every change goes to the API first; the tree then reloads the node
// list, so it always shows what the server stored (paths, visibility, order).
import { getContext, setContext, tick } from 'svelte';
import { buildTree, cmsApi, type ApiResult, type TreeItem } from '$lib/cms/admin';
import type { CmsNode } from '$lib/cms/types';

export type DropZone = 'before' | 'after' | 'inside';
export type MoveDir = 'up' | 'down' | 'in' | 'out';

export interface TreePermissions {
  create: boolean;
  update: boolean;
  delete: boolean;
  publish: boolean;
  /** cms_pages.read: the "Edit content" button */
  pages: boolean;
}

const KEY = Symbol('cms-tree');

export class TreeState {
  nodes = $state.raw<CmsNode[]>([]);
  collapsed = $state<Record<string, boolean>>({});
  /** the item whose detail panel is open */
  selectedId = $state<string | null>(null);
  /** where the inline "add item" form is open: a parent id, null for the top level, undefined for nowhere */
  addingUnder = $state<string | null | undefined>(undefined);
  /** the open panel has unsaved edits */
  panelDirty = $state(false);
  dragId = $state<string | null>(null);
  drop = $state<{ id: string; zone: DropZone } | null>(null);
  busy = $state(false);
  error = $state('');
  /** read by screen readers (aria-live) after moves */
  announcement = $state('');

  readonly tree = $derived(buildTree(this.nodes));

  constructor(
    nodes: CmsNode[],
    readonly reserved: readonly string[],
    readonly routeSlugs: readonly string[],
    readonly can: TreePermissions,
  ) {
    this.nodes = nodes;
  }

  item(id: string | null | undefined): TreeItem | undefined {
    return id ? this.tree.byId.get(id) : undefined;
  }

  siblings(parentId: string | null): TreeItem[] {
    return parentId ? (this.item(parentId)?.children ?? []) : this.tree.roots;
  }

  /** A top-level item whose slug an app route also uses: the route wins, so the page can't be reached. */
  isShadowed(n: CmsNode): boolean {
    return !n.parentId && n.type !== 'link' && !!n.slug && this.routeSlugs.includes(n.slug);
  }

  async refresh(): Promise<boolean> {
    const res = await cmsApi<CmsNode[]>('nodes');
    if (res.ok && res.data) { this.nodes = res.data; return true; }
    this.error = res.message;
    return false;
  }

  /** Runs one API write, then reloads the tree. The caller shows `message` if it failed. */
  async write<T>(call: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
    this.busy = true;
    try {
      const res = await call();
      if (res.ok) await this.refresh();
      return res;
    } finally {
      this.busy = false;
    }
  }

  /** Opens an item's panel, asking first if the open panel has unsaved edits. */
  select(id: string | null): boolean {
    if (id === this.selectedId) id = null;
    if (this.panelDirty && !confirm('Discard your unsaved changes to this item?')) return false;
    this.panelDirty = false;
    this.selectedId = id;
    return true;
  }

  toggle(id: string) {
    this.collapsed[id] = !this.collapsed[id];
  }

  expand(id: string | null) {
    if (id) this.collapsed[id] = false;
  }

  // ── Moving ──────────────────────────────────────────────────────────────────────────────

  /** Moves an item to `index` among `parentId`'s children (the list without the item itself). */
  async move(id: string, parentId: string | null, index: number, refocus = false): Promise<void> {
    const item = this.item(id);
    if (!item) return;
    const currentParent = item.parent?.node.id ?? null;
    const currentIndex = this.siblings(currentParent).findIndex(s => s.node.id === id);
    if (parentId === currentParent && index === currentIndex) return;

    this.error = '';
    const res = await this.write(() => cmsApi(`nodes/${id}/move`, { method: 'POST', body: { parentId, index } }));
    if (!res.ok) {
      this.error = res.message;
      this.announcement = `Couldn't move "${item.node.title}". ${res.message}`;
    } else {
      this.expand(parentId);
      const parent = this.item(parentId);
      const sibs = this.siblings(parentId);
      const pos = sibs.findIndex(s => s.node.id === id) + 1;
      this.announcement = `Moved "${item.node.title}" to position ${pos} of ${sibs.length}${parent ? ` under "${parent.node.title}"` : ' at the top level'}.`;
    }
    if (refocus) await this.focusRow(id);
  }

  /** The keyboard moves (also the panel's move buttons); returns the target or null when impossible. */
  target(id: string, dir: MoveDir): { parentId: string | null; index: number } | null {
    const item = this.item(id);
    if (!item) return null;
    const parentId = item.parent?.node.id ?? null;
    const sibs = this.siblings(parentId);
    const i = sibs.findIndex(s => s.node.id === id);
    if (dir === 'up') return i > 0 ? { parentId, index: i - 1 } : null;
    if (dir === 'down') return i < sibs.length - 1 ? { parentId, index: i + 1 } : null;
    if (dir === 'in') {
      const prev = sibs[i - 1];
      return prev && prev.node.type !== 'link' ? { parentId: prev.node.id, index: prev.children.length } : null;
    }
    // out: right after the parent, among the grandparent's children
    const parent = this.item(parentId);
    if (!parent) return null;
    const grand = parent.parent?.node.id ?? null;
    return { parentId: grand, index: this.siblings(grand).findIndex(s => s.node.id === parent.node.id) + 1 };
  }

  async moveBy(id: string, dir: MoveDir, refocus = true) {
    const t = this.target(id, dir);
    if (t) await this.move(id, t.parentId, t.index, refocus);
  }

  /** Can the dragged item land at `zone` of `targetId`? Not on itself or inside its own branch, not inside a link. */
  canDrop(targetId: string, zone: DropZone, dragId = this.dragId): boolean {
    const dragged = this.item(dragId);
    const target = this.item(targetId);
    if (!dragged || !target) return false;
    for (let a: TreeItem | null = target; a; a = a.parent) if (a.node.id === dragged.node.id) return false;
    return zone !== 'inside' || target.node.type !== 'link';
  }

  async dropOn(targetId: string, zone: DropZone) {
    const id = this.dragId;
    this.dragId = null;
    this.drop = null;
    if (!id || !this.canDrop(targetId, zone, id)) return;
    const target = this.item(targetId)!;
    if (zone === 'inside') {
      await this.move(id, target.node.id, target.children.filter(c => c.node.id !== id).length);
      return;
    }
    const parentId = target.parent ? target.parent.node.id : null;
    const sibs = this.siblings(parentId).filter(s => s.node.id !== id);
    const i = sibs.findIndex(s => s.node.id === targetId);
    await this.move(id, parentId, zone === 'before' ? i : i + 1);
  }

  /** Puts focus back on an item's row button after the tree re-renders (skipping a copy that is animating out). */
  async focusRow(id: string) {
    await tick();
    const buttons = document.querySelectorAll<HTMLElement>(`[data-node-button="${id}"]`);
    [...buttons].find(b => !b.closest('[inert]'))?.focus();
  }
}

export const setTreeState = (s: TreeState) => setContext(KEY, s);
export const getTreeState = () => getContext<TreeState>(KEY);
