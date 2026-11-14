import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { callerCan, callerRole } from '../../lib/cmsRole.js';
import { PUBLIC_TIERS, imageVersionStages, isWebImage, vaultAvailable } from '../../lib/cmsMedia.js';
import { getSiteSettings } from '../../lib/cmsTree.js';

// The media picker's view of Vault: web images in the caller's workspace that may appear on the
// site (see lib/cmsMedia.ts). Reads Vault's collections by name; uploads go to Vault's own routes.
// Guard: cms_pages.update (the preHandler) and vault_documents.read (checked here).

type Session = { userId?: string; workspaceId?: string };
type Reply = { code(status: number): { send(body: unknown): unknown } };

const OID = '^[a-f0-9]{24}$';

interface ImageRow {
  _id: ObjectId;
  name: string;
  folderId: ObjectId | null;
  updatedAt: Date;
  version: { url: string; mimetype: string; size?: number; originalName?: string };
}

function itemJson(r: ImageRow) {
  return {
    id:       r._id.toString(),
    name:     r.name,
    url:      r.version.url,
    mimetype: r.version.mimetype,
    size:     r.version.size ?? null,
    folderId: r.folderId?.toString() ?? null,
    updatedAt: r.updatedAt,
  };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default async function mediaRoutes(app: FastifyInstance) {
  const db = () => app.mongo.db!;

  /** null when the caller may browse Vault images; otherwise the reply already sent. */
  async function denied(session: Session, reply: Reply) {
    if (await callerCan(db(), session, 'vault_documents', 'read')) return null;
    return reply.code(403).send({ statusCode: 403, error: 'Forbidden', message: 'You need access to Vault to add images.' });
  }

  const baseMatch = (session: Session) => ({
    workspaceId: new ObjectId(session.workspaceId!),
    visibility: { $in: [...PUBLIC_TIERS] },
  });

  // GET /cms/media — a page of images, newest first; filter by folder and/or name and tags
  app.get<{ Querystring: { folderId?: string; q?: string; skip?: number; limit?: number } }>('/', {
    preHandler: app.requirePermission('cms_pages', 'update'),
    schema: {
      summary: 'List Vault images that can be placed on the website',
      querystring: {
        type: 'object',
        properties: {
          folderId: { type: 'string', pattern: `${OID}|^root$` },
          q:        { type: 'string', maxLength: 200 },
          skip:     { type: 'integer', minimum: 0, default: 0 },
          limit:    { type: 'integer', minimum: 1, maximum: 60, default: 24 },
        },
      },
    },
  }, async (req, reply) => {
    if (!(await vaultAvailable(db()))) return { available: false, items: [], total: 0 };
    const no = await denied(req.session, reply);
    if (no) return no;

    const { folderId, q, skip = 0, limit = 24 } = req.query;
    const match: Record<string, unknown> = baseMatch(req.session);
    if (folderId) match.folderId = folderId === 'root' ? null : new ObjectId(folderId);
    if (q?.trim()) {
      const re = new RegExp(escapeRegex(q.trim()), 'i');
      match.$or = [{ name: re }, { tags: re }];
    }
    const [res] = await db().collection('vault_documents').aggregate<{ items: ImageRow[]; total: { n: number }[] }>([
      { $match: match },
      ...imageVersionStages,
      { $sort: { updatedAt: -1, _id: -1 } },
      { $facet: { items: [{ $skip: skip }, { $limit: limit }], total: [{ $count: 'n' }] } },
    ]).toArray();
    const items = (res?.items ?? []).filter(r => isWebImage(r.version.mimetype, r.version.url)).map(itemJson);
    return { available: true, items, total: res?.total[0]?.n ?? 0, skip, limit };
  });

  // GET /cms/media/folders — Vault folders for the picker's sidebar, plus the Website Media folder id
  app.get('/folders', {
    preHandler: app.requirePermission('cms_pages', 'update'),
    schema: { summary: 'List Vault folders for the media picker' },
  }, async (req, reply) => {
    if (!(await vaultAvailable(db()))) return { available: false, folders: [], mediaFolderId: null };
    const no = await denied(req.session, reply);
    if (no) return no;
    // Same folder visibility as Vault's own list
    const role = await callerRole(db(), req.session);
    const filter: Record<string, unknown> = { workspaceId: new ObjectId(req.session.workspaceId!) };
    if (role !== 'owner' && role !== 'admin') filter.visibility = { $in: [...PUBLIC_TIERS] };
    const [folders, settings] = await Promise.all([
      db().collection('vault_folders').find(filter, { projection: { name: 1, parentId: 1 } }).sort({ name: 1 }).toArray(),
      getSiteSettings(db()),
    ]);
    return {
      available: true,
      folders: folders.map(f => ({ id: f._id.toString(), name: f.name as string, parentId: (f.parentId as ObjectId | null)?.toString() ?? null })),
      mediaFolderId: settings.mediaFolderId?.toString() ?? null,
    };
  });

  // GET /cms/media/:id — one image (the picker fetches it after an upload; Vault returns only the id)
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('cms_pages', 'update'),
    schema: {
      summary: 'Get one Vault image that can be placed on the website',
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: OID } } },
    },
  }, async (req, reply) => {
    if (!(await vaultAvailable(db()))) return reply.notFound('Vault is not installed');
    const no = await denied(req.session, reply);
    if (no) return no;
    const [row] = await db().collection('vault_documents').aggregate<ImageRow>([
      { $match: { ...baseMatch(req.session), _id: new ObjectId(req.params.id) } },
      ...imageVersionStages,
    ]).toArray();
    if (!row || !isWebImage(row.version.mimetype, row.version.url)) {
      return reply.notFound('This file can\'t be used on the website. Use a PNG, JPEG, GIF, WebP or AVIF image that isn\'t admin-only.');
    }
    return itemJson(row);
  });
}
