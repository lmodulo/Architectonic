// Server-side sanitizer for CMS page content. Everything an editor saves passes through here, so the
// public renderer can trust the stored shape: only whitelisted block types, Tiptap nodes, marks and
// attributes survive, link hrefs are restricted to safe schemes, and sizes are capped.
// The shapes mirror frontend/src/lib/cms/types.ts (the two packages can't share code).
import { randomUUID } from 'crypto';

/** Safe link targets: http(s), mailto, tel, same-site paths (not `//host` or `/\host`) and #anchors. */
const SAFE_HREF = /^(https?:|mailto:|tel:|\/(?![/\\])|#)/i;
/** Image sources the editor preview may use: same-site paths or http(s). */
const SAFE_SRC = /^(\/(?![/\\])|https?:)/i;
const CONTROL_OR_SPACE = /[\u0000- \u007F]/;
const OBJECT_ID = /^[a-f0-9]{24}$/;
const BLOCK_ID = /^[A-Za-z0-9_-]{1,64}$/;
const COMPONENT_KEY = /^[a-z0-9][a-z0-9-]{0,63}$/;

const MAX_BLOCKS = 200;
const MAX_DEPTH = 20;
const MAX_DOC_NODES = 10_000;
const MAX_TEXT = 20_000;
const MAX_GALLERY = 100;
const MAX_BUTTONS = 10;

export type ImageRef = { vaultId: string; src: string; alt: string; w?: number; h?: number };
export type LinkRef = { nodeId: string } | { url: string };
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}
export interface Block { id: string; type: string; data: Record<string, unknown> }
export interface Seo { title?: string; description?: string; image?: ImageRef; noindex?: boolean }

export const BLOCK_TYPES = ['richText', 'hero', 'gallery', 'buttons', 'divider', 'component'] as const;

/** Counts what sanitizing removed, so the API can tell the editor something was dropped. */
class Report {
  removed = 0;
  drop(n = 1) { this.removed += n; }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

function oneOf<T extends string | number>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function dim(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 20_000 ? v : undefined;
}

export function safeHref(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s || s.length > 2048 || CONTROL_OR_SPACE.test(s)) return undefined;
  return SAFE_HREF.test(s) ? s : undefined;
}

function safeSrc(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  if (!s || s.length > 2048 || CONTROL_OR_SPACE.test(s)) return undefined;
  return SAFE_SRC.test(s) ? s : undefined;
}

export function sanitizeImageRef(v: unknown): ImageRef | undefined {
  if (!isObj(v) || typeof v.vaultId !== 'string' || !OBJECT_ID.test(v.vaultId)) return undefined;
  const src = safeSrc(v.src);
  if (!src) return undefined;
  const out: ImageRef = { vaultId: v.vaultId, src, alt: str(v.alt, 500) ?? '' };
  const w = dim(v.w), h = dim(v.h);
  if (w) out.w = w;
  if (h) out.h = h;
  return out;
}

export function sanitizeLinkRef(v: unknown): LinkRef | undefined {
  if (!isObj(v)) return undefined;
  if (typeof v.nodeId === 'string') return OBJECT_ID.test(v.nodeId) ? { nodeId: v.nodeId } : undefined;
  const url = safeHref(v.url);
  return url ? { url } : undefined;
}

/**
 * Component props: plain JSON only (strings, finite numbers, booleans, null, arrays, objects), with
 * capped depth, key names, string lengths and overall size. Anything else is dropped.
 */
export function sanitizeProps(v: unknown, report = new Report()): Record<string, unknown> {
  const walk = (x: unknown, depth: number): unknown => {
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'number') return Number.isFinite(x) ? x : undefined;
    if (typeof x === 'string') return x.slice(0, 2000);
    if (depth >= 4) return undefined;
    if (Array.isArray(x)) return x.slice(0, 100).map(i => walk(i, depth + 1)).filter(i => i !== undefined);
    if (isObj(x)) {
      const o: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(x).slice(0, 50)) {
        if (!/^[A-Za-z0-9_]{1,64}$/.test(k)) { report.drop(); continue; }
        const w = walk(val, depth + 1);
        if (w === undefined) report.drop(); else o[k] = w;
      }
      return o;
    }
    return undefined;
  };
  const out = isObj(v) ? (walk(v, 0) as Record<string, unknown>) : {};
  if (JSON.stringify(out).length > 16_384) { report.drop(); return {}; }
  return out;
}

export function sanitizeComponentRef(v: unknown, report = new Report()): { key: string; props: Record<string, unknown> } | undefined {
  if (!isObj(v) || typeof v.key !== 'string' || !COMPONENT_KEY.test(v.key)) return undefined;
  return { key: v.key, props: sanitizeProps(v.props, report) };
}

// ── Rich text (Tiptap JSON) ──────────────────────────────────────────────────────────────────

const INLINE = new Set(['text', 'hardBreak']);
const BLOCK = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule', 'cmsImage']);
const CHILDREN: Record<string, Set<string>> = {
  doc:         BLOCK,
  paragraph:   INLINE,
  heading:     INLINE,
  bulletList:  new Set(['listItem']),
  orderedList: new Set(['listItem']),
  listItem:    new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote']),
  blockquote:  new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'horizontalRule']),
};
const LEAVES = new Set(['text', 'hardBreak', 'horizontalRule', 'cmsImage']);
const MARKS = new Set(['bold', 'italic', 'underline', 'strike', 'link']);
/** Nodes that are invalid when empty (ProseMirror would reject or render them as junk). */
const NEEDS_CONTENT = new Set(['bulletList', 'orderedList', 'listItem', 'blockquote']);

const IMAGE_ALIGN = ['left', 'right', 'center', 'full'] as const;
const IMAGE_WIDTH = [25, 33, 50, 100] as const;

function sanitizeMarks(marks: unknown, report: Report): TiptapNode['marks'] {
  if (!Array.isArray(marks)) return undefined;
  const out: NonNullable<TiptapNode['marks']> = [];
  const seen = new Set<string>();
  for (const m of marks) {
    if (!isObj(m) || typeof m.type !== 'string' || !MARKS.has(m.type) || seen.has(m.type)) { report.drop(); continue; }
    if (m.type === 'link') {
      const attrs = isObj(m.attrs) ? m.attrs : {};
      const href = safeHref(attrs.href);
      if (!href) { report.drop(); continue; }
      // `nodeId`: a link to a site page. The public URL comes from the page's `links` map at read
      // time, so it follows the page when it moves; `href` is only the editor's copy of the path.
      const nodeId = typeof attrs.nodeId === 'string' && OBJECT_ID.test(attrs.nodeId) ? attrs.nodeId : null;
      out.push({ type: 'link', attrs: { href, target: attrs.target === '_blank' ? '_blank' : null, ...(nodeId ? { nodeId } : {}) } });
    } else {
      out.push({ type: m.type });
    }
    seen.add(m.type);
  }
  return out.length ? out : undefined;
}

function sanitizeAttrs(type: string, attrs: unknown): Record<string, unknown> | undefined | null {
  const a = isObj(attrs) ? attrs : {};
  switch (type) {
    case 'heading': {
      const level = typeof a.level === 'number' ? Math.min(4, Math.max(2, Math.round(a.level))) : 2;
      return { level };
    }
    case 'orderedList': {
      const start = typeof a.start === 'number' && Number.isInteger(a.start) && a.start >= 1 && a.start <= 100_000 ? a.start : 1;
      return { start };
    }
    case 'cmsImage': {
      // null = the image itself is invalid, drop the node
      const ref = sanitizeImageRef(a);
      if (!ref) return null;
      return {
        vaultId: ref.vaultId,
        src:     ref.src,
        alt:     ref.alt,
        caption: str(a.caption, 500) ?? null,
        align:   oneOf(a.align, IMAGE_ALIGN, 'center'),
        width:   oneOf(a.width, IMAGE_WIDTH, 50),
        w:       ref.w ?? null,
        h:       ref.h ?? null,
      };
    }
    default:
      return undefined;
  }
}

export function sanitizeDoc(input: unknown, report = new Report()): TiptapNode {
  let count = 0;

  const walk = (n: unknown, parent: string, depth: number): TiptapNode | undefined => {
    if (!isObj(n) || typeof n.type !== 'string') { report.drop(); return undefined; }
    const type = n.type;
    if (!CHILDREN[parent]?.has(type) || depth > MAX_DEPTH || ++count > MAX_DOC_NODES) { report.drop(); return undefined; }

    if (type === 'text') {
      if (typeof n.text !== 'string' || !n.text) { report.drop(); return undefined; }
      const out: TiptapNode = { type: 'text', text: n.text.slice(0, MAX_TEXT) };
      const marks = sanitizeMarks(n.marks, report);
      if (marks) out.marks = marks;
      return out;
    }

    const out: TiptapNode = { type };
    const attrs = sanitizeAttrs(type, n.attrs);
    if (attrs === null) { report.drop(); return undefined; }
    if (attrs) out.attrs = attrs;

    if (!LEAVES.has(type)) {
      const content: TiptapNode[] = [];
      if (Array.isArray(n.content)) {
        for (const c of n.content) {
          const s = walk(c, type, depth + 1);
          if (s) content.push(s);
        }
      }
      if (NEEDS_CONTENT.has(type) && content.length === 0) { report.drop(); return undefined; }
      // Tiptap's listItem is `paragraph block*`: it must start with a paragraph
      if (type === 'listItem' && content[0].type !== 'paragraph') content.unshift({ type: 'paragraph' });
      if (content.length) out.content = content;
    }
    return out;
  };

  const content: TiptapNode[] = [];
  if (isObj(input) && input.type === 'doc' && Array.isArray(input.content)) {
    for (const c of input.content) {
      const s = walk(c, 'doc', 1);
      if (s) content.push(s);
    }
  } else if (input !== undefined) {
    report.drop();
  }
  // A Tiptap doc needs at least one block
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

// ── Blocks ───────────────────────────────────────────────────────────────────────────────────

function sanitizeBlockData(type: string, d: Record<string, unknown>, report: Report): Record<string, unknown> | undefined {
  switch (type) {
    case 'richText':
      return { doc: sanitizeDoc(d.doc, report) };

    case 'hero': {
      const out: Record<string, unknown> = {
        title:  str(d.title, 200) ?? '',
        align:  oneOf(d.align, ['left', 'center'] as const, 'center'),
        height: oneOf(d.height, ['sm', 'md', 'lg'] as const, 'md'),
      };
      const subtitle = str(d.subtitle, 500);
      if (subtitle) out.subtitle = subtitle;
      if (d.image !== undefined && d.image !== null) {
        const image = sanitizeImageRef(d.image);
        if (image) out.image = image; else report.drop();
      }
      if (isObj(d.cta)) {
        const label = str(d.cta.label, 80);
        const link = sanitizeLinkRef(d.cta.link);
        if (label && link) out.cta = { label, link }; else report.drop();
      }
      return out;
    }

    case 'gallery': {
      const images: (ImageRef & { caption?: string })[] = [];
      for (const img of Array.isArray(d.images) ? d.images.slice(0, MAX_GALLERY) : []) {
        const ref = sanitizeImageRef(img);
        if (!ref) { report.drop(); continue; }
        const caption = isObj(img) ? str(img.caption, 500) : undefined;
        images.push(caption ? { ...ref, caption } : ref);
      }
      return {
        images,
        columns: oneOf(d.columns, [2, 3, 4, 5, 6] as const, 3),
        aspect:  oneOf(d.aspect, ['square', '4:3', 'natural'] as const, 'square'),
        gap:     oneOf(d.gap, ['sm', 'md', 'lg'] as const, 'md'),
      };
    }

    case 'buttons': {
      const items: { label: string; link: LinkRef; style: string }[] = [];
      for (const it of Array.isArray(d.items) ? d.items.slice(0, MAX_BUTTONS) : []) {
        const label = isObj(it) ? str(it.label, 80) : undefined;
        const link = isObj(it) ? sanitizeLinkRef(it.link) : undefined;
        if (!label || !link) { report.drop(); continue; }
        items.push({ label, link, style: oneOf((it as Record<string, unknown>).style, ['primary', 'outline'] as const, 'primary') });
      }
      return { items, align: oneOf(d.align, ['left', 'center', 'right'] as const, 'left') };
    }

    case 'divider':
      return {
        style: oneOf(d.style, ['line', 'space'] as const, 'line'),
        size:  oneOf(d.size, ['sm', 'md', 'lg'] as const, 'md'),
      };

    case 'component':
      return sanitizeComponentRef(d, report);

    default:
      return undefined;
  }
}

export function sanitizeBlocks(input: unknown, report = new Report()): Block[] {
  const out: Block[] = [];
  const ids = new Set<string>();
  if (!Array.isArray(input)) { if (input !== undefined) report.drop(); return out; }
  for (const b of input.slice(0, MAX_BLOCKS)) {
    if (!isObj(b) || typeof b.type !== 'string' || !(BLOCK_TYPES as readonly string[]).includes(b.type)) { report.drop(); continue; }
    const data = sanitizeBlockData(b.type, isObj(b.data) ? b.data : {}, report);
    if (!data) { report.drop(); continue; }
    let id = typeof b.id === 'string' && BLOCK_ID.test(b.id) ? b.id : randomUUID();
    if (ids.has(id)) id = randomUUID();
    ids.add(id);
    out.push({ id, type: b.type, data });
  }
  if (input.length > MAX_BLOCKS) report.drop(input.length - MAX_BLOCKS);
  return out;
}

export function sanitizeSeo(input: unknown, report = new Report()): Seo {
  const d = isObj(input) ? input : {};
  const out: Seo = {};
  const title = str(d.title, 200), description = str(d.description, 500);
  if (title) out.title = title;
  if (description) out.description = description;
  if (d.image !== undefined && d.image !== null) {
    const image = sanitizeImageRef(d.image);
    if (image) out.image = image; else report.drop();
  }
  if (d.noindex === true) out.noindex = true;
  return out;
}

/**
 * Sanitizes a whole page payload. `removed` counts dropped blocks, Tiptap nodes and marks, and invalid
 * images, links and buttons. Unknown attributes and fields are dropped silently and not counted.
 */
export function sanitizePage(input: { blocks?: unknown; seo?: unknown }): { blocks: Block[]; seo: Seo; removed: number } {
  const report = new Report();
  const blocks = sanitizeBlocks(input.blocks, report);
  const seo = sanitizeSeo(input.seo, report);
  return { blocks, seo, removed: report.removed };
}

/**
 * Every `{ nodeId }` link (buttons, hero buttons, and links inside text) and every Vault image id
 * referenced by a page, for read-time resolution.
 */
export function collectRefs(blocks: Block[]): { nodeIds: Set<string>; vaultIds: Set<string> } {
  const nodeIds = new Set<string>();
  const vaultIds = new Set<string>();
  const link = (l: unknown) => { if (isObj(l) && typeof l.nodeId === 'string') nodeIds.add(l.nodeId); };
  const img = (i: unknown) => { if (isObj(i) && typeof i.vaultId === 'string') vaultIds.add(i.vaultId); };
  const walkDoc = (n: TiptapNode) => {
    if (n.type === 'cmsImage') img(n.attrs);
    n.marks?.forEach(m => { if (m.type === 'link') link(m.attrs); });
    n.content?.forEach(walkDoc);
  };
  for (const b of blocks) {
    const d = b.data;
    if (b.type === 'richText' && isObj(d.doc)) walkDoc(d.doc as unknown as TiptapNode);
    if (b.type === 'hero') { img(d.image); if (isObj(d.cta)) link(d.cta.link); }
    if (b.type === 'gallery' && Array.isArray(d.images)) d.images.forEach(img);
    if (b.type === 'buttons' && Array.isArray(d.items)) d.items.forEach(i => isObj(i) && link(i.link));
  }
  return { nodeIds, vaultIds };
}
