// Vault images on the public site. cms never imports Vault's code: it reads Vault's collections by
// name (vault_documents, vault_document_versions, vault_folders), and uploads go through Vault's own
// HTTP routes so Vault keeps its validation, audit log and permissions.
//
// Rules for an image to be used or shown:
//   - its document exists and its visibility is staff or customer. Never admin_only, not even for
//     admins: placed images end up public.
//   - its *current* version is a raster web image (PNG, JPEG, GIF, WebP, AVIF) by MIME type and by
//     file extension. Never SVG: a same-origin SVG can run script.
// Pages store only the Vault id; the URL is looked up when a page is read, so a new Vault version
// shows up by itself and a deleted or hidden image disappears.
import { ObjectId, type Db } from 'mongodb';
import { collectRefs, type Block, type Seo, type TiptapNode } from './cmsSanitize.js';

export const WEB_IMAGE_MIME = /^image\/(png|jpe?g|gif|webp|avif)$/i;
export const WEB_IMAGE_URL = /\.(png|jpe?g|gif|webp|avif)$/i;
/** Where Vault's storage puts files: local `/uploads/...`, or an S3 URL. */
const FILE_URL = /^(\/uploads\/(?![/\\])|https?:\/\/)/i;
const UNSAFE_URL_CHARS = /[\s\u0000-\u001f"'<>\\`]/;
const OID = /^[a-f0-9]{24}$/;

/** Visibility tiers that may appear on the public site. */
export const PUBLIC_TIERS = ['staff', 'customer'] as const;

export function isWebImage(mimetype: unknown, url: unknown): boolean {
  if (typeof mimetype !== 'string' || typeof url !== 'string') return false;
  if (!WEB_IMAGE_MIME.test(mimetype)) return false;
  if (url.length > 2048 || !FILE_URL.test(url) || UNSAFE_URL_CHARS.test(url)) return false;
  return WEB_IMAGE_URL.test(url.split(/[?#]/)[0]);
}

let vaultSeen = false;
/** Whether Vault is installed (its collection exists). Once seen, it stays installed. */
export async function vaultAvailable(db: Db): Promise<boolean> {
  if (vaultSeen) return true;
  vaultSeen = (await db.listCollections({ name: 'vault_documents' }, { nameOnly: true }).toArray()).length > 0;
  return vaultSeen;
}

/** Aggregation stages: join each document's current version and keep web images only. */
export const imageVersionStages = [
  { $lookup: { from: 'vault_document_versions', localField: 'currentVersionId', foreignField: '_id', as: 'version' } },
  { $unwind: '$version' },
  { $match: { 'version.mimetype': WEB_IMAGE_MIME, 'version.url': WEB_IMAGE_URL } },
];

/** vaultId → current URL for every id that may be shown (see the rules above), in one query. */
export async function resolveMedia(db: Db, ids: Iterable<string>): Promise<Record<string, { url: string }>> {
  const oids = [...new Set(ids)].filter(id => OID.test(id)).map(id => new ObjectId(id));
  if (!oids.length || !(await vaultAvailable(db))) return {};
  const rows = await db.collection('vault_documents').aggregate<{ _id: ObjectId; url: string; mimetype: string }>([
    { $match: { _id: { $in: oids }, visibility: { $in: [...PUBLIC_TIERS] } } },
    ...imageVersionStages,
    { $project: { url: '$version.url', mimetype: '$version.mimetype' } },
  ]).toArray();
  const out: Record<string, { url: string }> = {};
  for (const r of rows) if (isWebImage(r.mimetype, r.url)) out[r._id.toString()] = { url: r.url };
  return out;
}

/** Every Vault id a page uses: rich-text images, hero images, galleries and the SEO image. */
export function pageImageIds(content: { blocks: Block[]; seo?: Seo } | null | undefined): Set<string> {
  const ids = collectRefs(content?.blocks ?? []).vaultIds;
  if (content?.seo?.image?.vaultId) ids.add(content.seo.image.vaultId);
  return ids;
}

/**
 * Ids among `ids` that belong to a Vault document in another workspace. An editor only ever picks
 * from their own workspace; this stops a hand-made request from publishing another workspace's file.
 */
export async function foreignImageIds(db: Db, ids: Iterable<string>, workspaceId: string | undefined): Promise<Set<string>> {
  const oids = [...new Set(ids)].filter(id => OID.test(id)).map(id => new ObjectId(id));
  if (!oids.length || !(await vaultAvailable(db))) return new Set();
  const own = workspaceId && OID.test(workspaceId) ? new ObjectId(workspaceId) : null;
  const rows = await db.collection('vault_documents')
    .find({ _id: { $in: oids }, ...(own ? { workspaceId: { $ne: own } } : {}) }, { projection: { _id: 1 } })
    .toArray();
  return new Set(rows.map(r => r._id.toString()));
}

/** Removes every image whose Vault id is in `drop`. Returns the new content and how many were removed. */
export function stripImages<T extends { blocks: Block[]; seo: Seo }>(content: T, drop: Set<string>): { content: T; removed: number } {
  if (!drop.size) return { content, removed: 0 };
  let removed = 0;
  const hit = (v: unknown) => {
    const id = (v as { vaultId?: unknown } | undefined)?.vaultId;
    return typeof id === 'string' && drop.has(id);
  };
  const walk = (n: TiptapNode): TiptapNode => {
    if (!n.content) return n;
    const content: TiptapNode[] = [];
    for (const c of n.content) {
      if (c.type === 'cmsImage' && hit(c.attrs)) { removed++; continue; }
      content.push(walk(c));
    }
    return { ...n, content };
  };
  const blocks = content.blocks.map(b => {
    const d = b.data;
    if (b.type === 'richText' && d.doc) return { ...b, data: { ...d, doc: walk(d.doc as TiptapNode) } };
    if (b.type === 'hero' && hit(d.image)) { removed++; const { image: _, ...rest } = d; return { ...b, data: rest }; }
    if (b.type === 'gallery' && Array.isArray(d.images)) {
      const images = d.images.filter(i => { const h = hit(i); if (h) removed++; return !h; });
      return { ...b, data: { ...d, images } };
    }
    return b;
  });
  let seo = content.seo;
  if (hit(seo?.image)) { removed++; const { image: _, ...rest } = seo; seo = rest; }
  return { content: { ...content, blocks, seo }, removed };
}

/** How many images a page uses that can't be shown (deleted, admin-only, or no longer an image). */
export function missingCount(ids: Set<string>, media: Record<string, unknown>): number {
  let n = 0;
  for (const id of ids) if (!media[id]) n++;
  return n;
}
