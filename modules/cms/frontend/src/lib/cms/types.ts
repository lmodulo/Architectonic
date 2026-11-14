// Shared CMS content types for the admin and the public renderer. They mirror what the API's
// sanitizer (api/src/lib/cmsSanitize.ts) stores; the two packages can't share code, so keep both in sync.

export type NodeType = 'page' | 'component' | 'link' | 'label';
export type NodeStatus = 'draft' | 'published';

/** A site tree item as GET /cms/nodes returns it. */
export interface CmsNode {
  id: string;
  parentId: string | null;
  order: number;
  type: NodeType;
  title: string;
  /** null for links */
  slug: string | null;
  showInMenu: boolean;
  status: NodeStatus;
  component: ComponentRef | null;
  /** link nodes only */
  url: string | null;
  newTab: boolean;
  /** slug path such as '/about/team'; null for links */
  path: string | null;
  /** public URL: '/' for the home page, the URL for links */
  href: string | null;
  /** the node and all its ancestors are published */
  visible: boolean;
  isHome: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface ComponentRef { key: string; props: Record<string, unknown> }

export type ImageRef = { vaultId: string; src: string; alt: string; w?: number; h?: number };
/** nodeId links are turned into paths at read time, so moving a page doesn't break links to it. */
export type LinkRef = { nodeId: string } | { url: string };

/** Tiptap JSON (only the nodes and marks the sanitizer allows survive a save). */
export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

/** Attributes of the `cmsImage` node inside rich text. */
export interface CmsImageAttrs {
  vaultId: string;
  src: string;
  alt: string;
  caption: string | null;
  align: 'left' | 'right' | 'center' | 'full';
  width: 25 | 33 | 50 | 100;
  w: number | null;
  h: number | null;
}

export interface RichTextData { doc: TiptapNode }
export interface HeroData {
  title: string;
  subtitle?: string;
  image?: ImageRef;
  align: 'left' | 'center';
  height: 'sm' | 'md' | 'lg';
  cta?: { label: string; link: LinkRef };
}
export interface GalleryData {
  images: (ImageRef & { caption?: string })[];
  columns: 2 | 3 | 4 | 5 | 6;
  aspect: 'square' | '4:3' | 'natural';
  gap: 'sm' | 'md' | 'lg';
}
export interface ButtonsData {
  items: { label: string; link: LinkRef; style: 'primary' | 'outline' }[];
  align: 'left' | 'center' | 'right';
}
export interface DividerData { style: 'line' | 'space'; size: 'sm' | 'md' | 'lg' }
export type ComponentData = ComponentRef;

export type Block =
  | { id: string; type: 'richText'; data: RichTextData }
  | { id: string; type: 'hero'; data: HeroData }
  | { id: string; type: 'gallery'; data: GalleryData }
  | { id: string; type: 'buttons'; data: ButtonsData }
  | { id: string; type: 'divider'; data: DividerData }
  | { id: string; type: 'component'; data: ComponentData };

export type BlockType = Block['type'];

export interface Seo { title?: string; description?: string; image?: ImageRef; noindex?: boolean }
export interface PageContent { blocks: Block[]; seo: Seo }

/** vaultId → current file, for images that may be shown (others are left out of the map). */
export type MediaMap = Record<string, { url: string }>;

/** GET /cms/media items: a Vault web image (PNG, JPEG, GIF, WebP, AVIF; never SVG or admin-only). */
export interface MediaItem {
  id: string;
  name: string;
  url: string;
  mimetype: string;
  size: number | null;
  folderId: string | null;
  updatedAt: string;
}

/** GET /cms/pages/:nodeId */
export interface PageDraft {
  nodeId: string;
  draft: PageContent;
  /** current URLs of the draft's images that can be shown; anything missing is flagged in the editor */
  media: MediaMap;
  rev: number;
  status: NodeStatus;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

/** GET /cms/site/resolve and GET /cms/pages/:nodeId/preview */
export interface PageView {
  node: { id: string; type: NodeType; title: string; path: string | null; component: ComponentRef | null };
  /** null for component nodes */
  page: PageContent | null;
  /** vaultId → current file; images not in it aren't shown */
  media: MediaMap;
  /** nodeId → public URL, for LinkRefs; links to unpublished pages are missing */
  links: Record<string, string>;
  breadcrumbs: { id: string; title: string; path: string | null }[];
  /** remaining path segments, for components that accept subpaths */
  rest?: string;
  preview?: true;
}

export type ResolveResult = PageView | { redirect: string };

export interface MenuItem {
  id: string;
  type: NodeType;
  title: string;
  href: string;
  newTab?: boolean;
  children: MenuItem[];
}

/** GET /cms/site/menu */
export interface SiteMenu {
  items: MenuItem[];
  footer: { text: string; links: { label: string; href: string; newTab?: boolean }[] };
}

export interface FooterLink { label: string; link: LinkRef; newTab?: boolean }

/** GET /cms/settings */
export interface CmsSettings {
  homeNodeId: string | null;
  footer: { text: string; links: FooterLink[] };
  mediaFolderId: string | null;
  updatedAt: string | null;
}

/** GET /cms/site/tree — every published page (links left out), for sitemaps */
export interface SiteTreeItem {
  id: string;
  type: NodeType;
  title: string;
  href: string;
  showInMenu: boolean;
  children: SiteTreeItem[];
}

// ── Custom component registry ($lib/config/cms-components/*.ts) ──────────────────────────────
// Entries default-export this shape. Another module may add one by shipping its own file there;
// it must match the shape structurally, without importing these types, so that module still
// builds when cms isn't installed.

/** An editable prop, shown by the admin's component editor. */
export interface PropSpec {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
  default?: unknown;
  help?: string;
}

export interface CmsComponentLoadContext {
  /** SvelteKit's fetch: call this app's /api/... proxies only (entries run on server and client). */
  fetch: typeof fetch;
  url: URL;
  /** leftover path segments, for entries with `subpaths: true` (page mode only) */
  rest: string | null;
  props: Record<string, unknown>;
}

/** Props every registry component receives. */
export interface CmsComponentProps {
  props: Record<string, unknown>;
  /** whatever `load` returned (undefined without a load; `{ unavailable: true }` if it failed) */
  data: unknown;
  mode: 'page' | 'block';
  rest: string | null;
}

export interface CmsComponentEntry {
  key: string;
  label: string;
  description: string;
  modes: ('page' | 'block')[];
  component: import('svelte').Component<CmsComponentProps>;
  props?: PropSpec[];
  /** page mode: `/events/<anything>` resolves to this node and passes the remainder as `rest` */
  subpaths?: boolean;
  load?: (ctx: CmsComponentLoadContext) => Promise<unknown>;
}
