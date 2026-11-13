import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { CmsTree, pageView, type CmsNodeDoc, type PageContent, type TreeNode } from '../../lib/cmsTree.js';
import { collectRefs, sanitizePage } from '../../lib/cmsSanitize.js';

// Structural types: this repo's Fastify generics don't resolve standalone FastifyRequest/FastifyReply
type AuditReq = { session: { userId?: string; username?: string }; ip: string };

// Draft and published content live on one document, so publishing is a single-document update
// (compose runs a standalone mongo with no transactions). `rev` is the optimistic lock for drafts.
interface PageDoc {
  _id: ObjectId;
  nodeId: ObjectId;
  draft: PageContent;
  published: PageContent | null;
  rev: number;
  publishedAt: Date | null;
  updatedAt: Date;
  updatedBy: ObjectId | null;
}

const OID = '^[a-f0-9]{24}$';
const nodeParams = { type: 'object', required: ['nodeId'], properties: { nodeId: { type: 'string', pattern: OID } } } as const;
const MAX_PAGE_BYTES = 900_000;
/** Autosave writes often; audit a draft save only when another user saved last, or after a pause. */
const AUDIT_COALESCE_MS = 10 * 60_000;

export default async function pagesRoutes(app: FastifyInstance) {
  const db = () => app.mongo.db!;
  const pages = () => db().collection<PageDoc>('cms_pages');
  const audit = (req: AuditReq, action: string, resourceId: string, meta?: Record<string, unknown>) =>
    logAudit(db(), { userId: req.session.userId!, username: req.session.username!, action, resourceId, meta, ip: req.ip });

  /** The page document for a page node, created empty if it's missing. */
  async function ensurePage(nodeId: ObjectId): Promise<PageDoc> {
    return (await pages().findOneAndUpdate(
      { nodeId },
      { $setOnInsert: { nodeId, draft: { blocks: [], seo: {} }, published: null, rev: 0, publishedAt: null, updatedAt: new Date(), updatedBy: null } },
      { upsert: true, returnDocument: 'after' },
    ))!;
  }

  async function loadNode(nodeId: string): Promise<{ tree: CmsTree; node: TreeNode } | null> {
    const tree = await CmsTree.load(db());
    const node = tree.get(nodeId);
    return node ? { tree, node } : null;
  }

  // GET /cms/pages/:nodeId — the draft, its rev, and publish metadata
  app.get<{ Params: { nodeId: string } }>('/:nodeId', {
    preHandler: app.requirePermission('cms_pages', 'read'),
    schema: { summary: 'Get a page draft', params: nodeParams },
  }, async (req, reply) => {
    const found = await loadNode(req.params.nodeId);
    if (!found || found.node.doc.type !== 'page') return reply.notFound('Page not found');
    const page = await ensurePage(found.node.doc._id);
    return {
      nodeId:      found.node.id,
      draft:       page.draft,
      rev:         page.rev,
      status:      found.node.doc.status,
      publishedAt: page.publishedAt,
      hasUnpublishedChanges: page.published === null || JSON.stringify(page.draft) !== JSON.stringify(page.published),
      updatedAt:   page.updatedAt,
      updatedBy:   page.updatedBy?.toString() ?? null,
    };
  });

  // PUT /cms/pages/:nodeId/draft — save the draft (sanitized). A stale rev returns 409.
  app.put<{ Params: { nodeId: string }; Body: { blocks: unknown[]; seo?: unknown; rev: number } }>('/:nodeId/draft', {
    preHandler: app.requirePermission('cms_pages', 'update'),
    schema: {
      summary: 'Save a page draft',
      params: nodeParams,
      body: {
        type: 'object',
        required: ['blocks', 'rev'],
        additionalProperties: false,
        properties: {
          blocks: { type: 'array', maxItems: 500 },
          seo:    { type: 'object' },
          rev:    { type: 'integer', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const found = await loadNode(req.params.nodeId);
    if (!found || found.node.doc.type !== 'page') return reply.notFound('Page not found');
    const nodeId = found.node.doc._id;

    const { blocks, seo, removed } = sanitizePage(req.body);
    const draft: PageContent = { blocks, seo };
    if (JSON.stringify(draft).length > MAX_PAGE_BYTES) return reply.badRequest('This page is too large to save. Split it into several pages.');

    await ensurePage(nodeId);
    const now = new Date();
    const userId = new ObjectId(req.session.userId!);
    const before = await pages().findOneAndUpdate(
      { nodeId, rev: req.body.rev },
      { $set: { draft, updatedAt: now, updatedBy: userId }, $inc: { rev: 1 } },
      { returnDocument: 'before' },
    );
    if (!before) {
      const current = await pages().findOne({ nodeId }, { projection: { rev: 1 } });
      return reply.code(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: 'This page was changed elsewhere. Reload to get the latest version.',
        rev: current?.rev ?? null,
      });
    }

    const sameEditor = before.updatedBy?.toString() === req.session.userId;
    if (!sameEditor || now.getTime() - before.updatedAt.getTime() > AUDIT_COALESCE_MS) {
      audit(req, 'cms_page.update', found.node.id, { title: found.node.doc.title });
    }
    return { rev: before.rev + 1, draft, removed };
  });

  // POST /cms/pages/:nodeId/publish — pages: copy the draft to published. Every node type: set
  // status 'published'. Optional `rev` refuses to publish a draft other than the one shown.
  app.post<{ Params: { nodeId: string }; Body: { rev?: number } | undefined }>('/:nodeId/publish', {
    preHandler: app.requirePermission('cms_publish', 'update'),
    schema: {
      summary: 'Publish a page or site tree item',
      params: nodeParams,
      body: { type: ['object', 'null'], additionalProperties: false, properties: { rev: { type: 'integer', minimum: 0 } } },
    },
  }, async (req, reply) => {
    const found = await loadNode(req.params.nodeId);
    if (!found) return reply.notFound('Item not found');
    const { node } = found;
    const now = new Date();
    const userId = new ObjectId(req.session.userId!);
    let publishedAt: Date | null = null;

    if (node.doc.type === 'page') {
      const page = await ensurePage(node.doc._id);
      const rev = req.body?.rev;
      if (rev !== undefined && rev !== page.rev) {
        return reply.code(409).send({ statusCode: 409, error: 'Conflict', message: 'The draft changed since you last saw it. Reload before publishing.', rev: page.rev });
      }
      // Pipeline update: copies the stored draft as-is, in one atomic write
      const res = await pages().updateOne(
        { nodeId: node.doc._id, ...(rev !== undefined ? { rev } : {}) },
        [{ $set: { published: '$draft', publishedAt: now, updatedAt: now, updatedBy: userId } }],
      );
      if (res.matchedCount === 0) {
        return reply.code(409).send({ statusCode: 409, error: 'Conflict', message: 'The draft changed since you last saw it. Reload before publishing.' });
      }
      publishedAt = now;
    }
    await db().collection<CmsNodeDoc>('cms_nodes').updateOne(
      { _id: node.doc._id },
      { $set: { status: 'published', updatedAt: now, updatedBy: userId } },
    );

    // Warnings: hidden by an unpublished ancestor, and internal links that lead nowhere public
    const tree = await CmsTree.load(db());
    const fresh = tree.get(node.id)!;
    const warnings: string[] = [];
    if (!fresh.visible) {
      let a = fresh.parent;
      while (a && a.doc.status === 'published') a = a.parent;
      if (a) warnings.push(`Published, but not public until "${a.doc.title}" is published.`);
    }
    if (node.doc.type === 'page') {
      const page = await pages().findOne({ nodeId: node.doc._id });
      const ids = [...collectRefs(page?.published?.blocks ?? []).nodeIds];
      const broken = ids.filter(id => !tree.linkMap([id])[id]).length;
      if (broken) warnings.push(`${broken} link${broken === 1 ? '' : 's'} on this page lead${broken === 1 ? 's' : ''} to an item that isn't published or no longer exists.`);
    }

    audit(req, 'cms_node.publish', node.id, { title: node.doc.title, type: node.doc.type });
    return { status: 'published', publishedAt, visible: fresh.visible, warnings };
  });

  // POST /cms/pages/:nodeId/unpublish — back to draft; a page's published copy is removed
  app.post<{ Params: { nodeId: string } }>('/:nodeId/unpublish', {
    preHandler: app.requirePermission('cms_publish', 'update'),
    schema: { summary: 'Unpublish a page or site tree item', params: nodeParams },
  }, async (req, reply) => {
    const found = await loadNode(req.params.nodeId);
    if (!found) return reply.notFound('Item not found');
    const { node } = found;
    const now = new Date();
    const userId = new ObjectId(req.session.userId!);

    if (node.doc.type === 'page') {
      await pages().updateOne({ nodeId: node.doc._id }, { $set: { published: null, publishedAt: null, updatedAt: now, updatedBy: userId } });
    }
    await db().collection<CmsNodeDoc>('cms_nodes').updateOne(
      { _id: node.doc._id },
      { $set: { status: 'draft', updatedAt: now, updatedBy: userId } },
    );

    const descendants = (n: TreeNode): number => n.children.reduce((sum, c) => sum + 1 + descendants(c), 0);
    const hidden = descendants(node);
    audit(req, 'cms_node.unpublish', node.id, { title: node.doc.title, type: node.doc.type });
    return { status: 'draft', warnings: hidden ? [`${hidden} item${hidden === 1 ? '' : 's'} under it ${hidden === 1 ? 'is' : 'are'} hidden too.`] : [] };
  });

  // GET /cms/pages/:nodeId/preview — the resolve shape, built from the draft, ignoring status
  app.get<{ Params: { nodeId: string } }>('/:nodeId/preview', {
    preHandler: app.requirePermission('cms_pages', 'read'),
    schema: { summary: 'Preview a draft as the public site would render it', params: nodeParams },
  }, async (req, reply) => {
    const found = await loadNode(req.params.nodeId);
    if (!found || found.node.doc.type === 'link') return reply.notFound('Item not found');
    const { tree, node } = found;
    const content = node.doc.type === 'page' ? (await ensurePage(node.doc._id)).draft : null;
    return pageView(tree, node, content, { preview: true });
  });
}
