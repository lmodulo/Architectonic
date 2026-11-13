import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import type { AnyBulkWriteOperation } from 'mongodb';
import { logAudit } from '../../lib/audit.js';
import { toSlug } from '../../lib/slug.js';
import { CmsTree, NODE_TYPES, nodeJson, type CmsNodeDoc, type NodeType, type SiteSettingsDoc, type TreeNode } from '../../lib/cmsTree.js';
import { safeHref, sanitizeComponentRef } from '../../lib/cmsSanitize.js';

// Structural types: this repo's Fastify generics don't resolve standalone FastifyRequest/FastifyReply
type AuditReq = { session: { userId?: string; username?: string }; ip: string };
type Reply = { code(status: number): { send(body: unknown): unknown } };

const COL = 'cms_nodes';

/**
 * First URL segments a root node may not use: the scaffold's and the known modules' top-level
 * routes. The frontend proxy adds a second check against the project's real route list.
 */
export const RESERVED_SLUGS = new Set([
  'api', 'uploads', '_app', 'login', 'register', 'logout', 'forgot-password', 'reset-password',
  'accept-invite', 'dashboard', 'settings', 'profile', 'messages', 'notifications', 'audit-log',
  'user-management', 'manage-users', 'roles', '403', 'upcoming-events', 'documentation', 'cms',
  'shop', 'client-portal', 'vault', 'crm', 'agile', 'folio', 'contracts', 'calendar-events', 'commerce',
]);

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OID = '^[a-f0-9]{24}$';
const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: OID } } } as const;

interface NodeFields {
  type: NodeType;
  title: string;
  slug?: string | null;
  showInMenu?: boolean;
  component?: unknown;
  url?: string | null;
  newTab?: boolean;
}

type Checked =
  | { ok: true; set: Partial<CmsNodeDoc>; unset: string[] }
  | { ok: false; status: 400 | 404 | 409; message: string };

/**
 * Validates a node's fields as they will be after the write (create, or existing doc merged with
 * the patch) and returns the normalized fields to store.
 */
function checkNode(tree: CmsTree, f: NodeFields, parentId: string | null, selfId?: string): Checked {
  const title = typeof f.title === 'string' ? f.title.trim() : '';
  if (!title || title.length > 200) return { ok: false, status: 400, message: 'Title is required (up to 200 characters)' };

  if (parentId) {
    const parent = tree.get(parentId);
    if (!parent) return { ok: false, status: 404, message: 'Parent node not found' };
    if (parent.doc.type === 'link') return { ok: false, status: 400, message: 'Links cannot have child items' };
  }

  const set: Partial<CmsNodeDoc> = { type: f.type, title, showInMenu: f.showInMenu !== false };
  const unset: string[] = [];

  if (f.type === 'link') {
    const url = safeHref(f.url);
    if (!url) return { ok: false, status: 400, message: 'Links need a URL starting with https://, http://, mailto:, tel:, / or #' };
    if (selfId && (tree.get(selfId)?.children.length ?? 0) > 0) {
      return { ok: false, status: 409, message: 'Move or delete this item\'s children before turning it into a link' };
    }
    set.url = url;
    set.newTab = f.newTab === true;
    unset.push('slug', 'component');
    return { ok: true, set, unset };
  }

  const slug = typeof f.slug === 'string' && f.slug.trim() ? f.slug.trim() : toSlug(title);
  if (!slug) return { ok: false, status: 400, message: 'Add a slug (lowercase letters, numbers and dashes)' };
  if (slug.length > 80 || !SLUG.test(slug)) {
    return { ok: false, status: 400, message: 'Slugs use lowercase letters, numbers and single dashes (up to 80 characters)' };
  }
  if (!parentId && RESERVED_SLUGS.has(slug)) {
    return { ok: false, status: 400, message: `"/${slug}" is used by the application. Choose another slug.` };
  }
  const clash = tree.siblings(parentId).find(s => s.id !== selfId && s.doc.type !== 'link' && s.doc.slug === slug);
  if (clash) return { ok: false, status: 409, message: `"${clash.doc.title}" already uses the slug "${slug}" here` };
  set.slug = slug;
  unset.push('url', 'newTab');

  if (f.type === 'component') {
    const component = sanitizeComponentRef(f.component);
    if (!component) return { ok: false, status: 400, message: 'Component items need a component key' };
    set.component = component;
  } else {
    unset.push('component');
  }
  return { ok: true, set, unset };
}

function fail(reply: Reply, c: { status: number; message: string }) {
  return reply.code(c.status).send({ statusCode: c.status, error: c.status === 409 ? 'Conflict' : c.status === 404 ? 'Not Found' : 'Bad Request', message: c.message });
}

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

/** bulkWrite ops that renumber `ordered` 0..n-1, writing only nodes whose order or parent changes. */
function renumber(ordered: TreeNode[], parentId: ObjectId | null, now: Date, movedId?: string): AnyBulkWriteOperation<CmsNodeDoc>[] {
  const ops: AnyBulkWriteOperation<CmsNodeDoc>[] = [];
  ordered.forEach((n, order) => {
    const moved = n.id === movedId;
    if (n.doc.order === order && !moved) return;
    const $set: Partial<CmsNodeDoc> = { order };
    if (moved) { $set.parentId = parentId; $set.updatedAt = now; }
    ops.push({ updateOne: { filter: { _id: n.doc._id }, update: { $set } } });
  });
  return ops;
}

const nodeBodyProps = {
  type:       { type: 'string', enum: [...NODE_TYPES] },
  title:      { type: 'string', maxLength: 200 },
  slug:       { type: ['string', 'null'], maxLength: 80 },
  showInMenu: { type: 'boolean' },
  component:  { type: ['object', 'null'] },
  url:        { type: ['string', 'null'], maxLength: 2048 },
  newTab:     { type: 'boolean' },
} as const;

export default async function nodesRoutes(app: FastifyInstance) {
  const db = () => app.mongo.db!;
  const audit = (req: AuditReq, action: string, resourceId: string, meta?: Record<string, unknown>) =>
    logAudit(db(), { userId: req.session.userId!, username: req.session.username!, action, resourceId, meta, ip: req.ip });

  // GET /cms/nodes — every node, flat, in tree order, with its computed path and visibility
  app.get('/', {
    preHandler: app.requirePermission('cms_nodes', 'read'),
    schema: { summary: 'List site tree nodes' },
  }, async () => {
    const tree = await CmsTree.load(db());
    const out: ReturnType<typeof nodeJson>[] = [];
    const seen = new Set<string>();
    const walk = (nodes: TreeNode[]) => nodes.forEach(n => { seen.add(n.id); out.push(nodeJson(tree, n)); walk(n.children); });
    walk(tree.roots);
    // Nodes not reachable from a root (missing parent) are listed last so they can be moved back
    for (const n of tree.byId.values()) if (!seen.has(n.id)) out.push(nodeJson(tree, n));
    return out;
  });

  // POST /cms/nodes — create a node (appended to its siblings, or inserted at `index`)
  app.post<{ Body: NodeFields & { parentId?: string | null; index?: number } }>('/', {
    preHandler: app.requirePermission('cms_nodes', 'create'),
    schema: {
      summary: 'Create a site tree node',
      body: {
        type: 'object',
        required: ['type', 'title'],
        additionalProperties: false,
        properties: {
          ...nodeBodyProps,
          parentId: { type: ['string', 'null'], pattern: OID },
          index:    { type: 'integer', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const tree = await CmsTree.load(db());
    const parentId = req.body.parentId ?? null;
    const checked = checkNode(tree, req.body, parentId);
    if (!checked.ok) return fail(reply, checked);

    const now = new Date();
    const userId = new ObjectId(req.session.userId!);
    const siblings = tree.siblings(parentId);
    const index = Math.min(req.body.index ?? siblings.length, siblings.length);
    const _id = new ObjectId();
    const doc: CmsNodeDoc = {
      ...(checked.set as Omit<CmsNodeDoc, '_id'>),
      _id,
      parentId: parentId ? new ObjectId(parentId) : null,
      order: index,
      status: 'draft',
      createdAt: now, updatedAt: now, createdBy: userId, updatedBy: userId,
    };

    try {
      await db().collection<CmsNodeDoc>(COL).insertOne(doc);
    } catch (err) {
      if (isDuplicateKey(err)) return reply.conflict('Another item here already uses this slug');
      throw err;
    }
    // Renumber the siblings around the new node (it already has order = index, so it isn't rewritten)
    const placeholder = { id: _id.toString(), doc } as TreeNode;
    const ops = renumber([...siblings.slice(0, index), placeholder, ...siblings.slice(index)], doc.parentId, now);
    if (ops.length) await db().collection<CmsNodeDoc>(COL).bulkWrite(ops);

    if (doc.type === 'page') {
      await db().collection('cms_pages').updateOne(
        { nodeId: _id },
        { $setOnInsert: { nodeId: _id, draft: { blocks: [], seo: {} }, published: null, rev: 0, publishedAt: null, updatedAt: now, updatedBy: userId } },
        { upsert: true },
      );
    }

    audit(req, 'cms_node.create', _id.toString(), { type: doc.type, title: doc.title, slug: doc.slug ?? null });
    const fresh = await CmsTree.load(db());
    reply.code(201);
    return nodeJson(fresh, fresh.get(_id.toString())!);
  });

  // PATCH /cms/nodes/:id — edit fields (type changes are allowed; publishing is separate)
  app.patch<{ Params: { id: string }; Body: Partial<NodeFields> }>('/:id', {
    preHandler: app.requirePermission('cms_nodes', 'update'),
    schema: {
      summary: 'Update a site tree node',
      params: idParams,
      body: { type: 'object', additionalProperties: false, properties: nodeBodyProps },
    },
  }, async (req, reply) => {
    const tree = await CmsTree.load(db());
    const node = tree.get(req.params.id);
    if (!node) return reply.notFound('Item not found');

    const d = node.doc;
    const b = req.body;
    const merged: NodeFields = {
      type:       b.type ?? d.type,
      title:      b.title ?? d.title,
      // A new title doesn't change an existing slug; switching away from a link derives one
      slug:       b.slug !== undefined ? b.slug : d.slug ?? null,
      showInMenu: b.showInMenu ?? d.showInMenu,
      component:  b.component !== undefined ? b.component : d.component,
      url:        b.url !== undefined ? b.url : d.url ?? null,
      newTab:     b.newTab ?? d.newTab,
    };
    const parentId = d.parentId?.toString() ?? null;
    const checked = checkNode(tree, merged, parentId, node.id);
    if (!checked.ok) return fail(reply, checked);

    const now = new Date();
    const userId = new ObjectId(req.session.userId!);
    const update: Record<string, unknown> = { $set: { ...checked.set, updatedAt: now, updatedBy: userId } };
    const unset = checked.unset.filter(k => (d as unknown as Record<string, unknown>)[k] !== undefined);
    if (unset.length) update.$unset = Object.fromEntries(unset.map(k => [k, '']));

    try {
      await db().collection<CmsNodeDoc>(COL).updateOne({ _id: d._id }, update);
    } catch (err) {
      if (isDuplicateKey(err)) return reply.conflict('Another item here already uses this slug');
      throw err;
    }
    // A node that becomes a page gets its page document (content kept if it was a page before)
    if (checked.set.type === 'page') {
      await db().collection('cms_pages').updateOne(
        { nodeId: d._id },
        { $setOnInsert: { nodeId: d._id, draft: { blocks: [], seo: {} }, published: null, rev: 0, publishedAt: null, updatedAt: now, updatedBy: userId } },
        { upsert: true },
      );
    }

    audit(req, 'cms_node.update', node.id, { fields: Object.keys(b) });
    const fresh = await CmsTree.load(db());
    return nodeJson(fresh, fresh.get(node.id)!);
  });

  // DELETE /cms/nodes/:id — only childless nodes; removes the page content too
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('cms_nodes', 'delete'),
    schema: { summary: 'Delete a site tree node (must have no children)', params: idParams },
  }, async (req, reply) => {
    const tree = await CmsTree.load(db());
    const node = tree.get(req.params.id);
    if (!node) return reply.notFound('Item not found');
    if (node.children.length) return reply.conflict('Move or delete this item\'s children first');

    await db().collection(COL).deleteOne({ _id: node.doc._id });
    await db().collection('cms_pages').deleteOne({ nodeId: node.doc._id });
    if (tree.homeId === node.id) {
      await db().collection<SiteSettingsDoc>('cms_settings').updateOne({ _id: 'site' }, { $set: { homeNodeId: null, updatedAt: new Date() } });
    }
    const parentId = node.doc.parentId?.toString() ?? null;
    const ops = renumber(tree.siblings(parentId).filter(s => s.id !== node.id), node.doc.parentId, new Date());
    if (ops.length) await db().collection<CmsNodeDoc>(COL).bulkWrite(ops);

    audit(req, 'cms_node.delete', node.id, { title: node.doc.title, type: node.doc.type });
    return { deleted: true };
  });

  // POST /cms/nodes/:id/move — reparent and/or reorder. Safe to re-run with the same body.
  app.post<{ Params: { id: string }; Body: { parentId: string | null; index: number } }>('/:id/move', {
    preHandler: app.requirePermission('cms_nodes', 'update'),
    schema: {
      summary: 'Move a site tree node',
      params: idParams,
      body: {
        type: 'object',
        required: ['parentId', 'index'],
        additionalProperties: false,
        properties: {
          parentId: { type: ['string', 'null'], pattern: OID },
          index:    { type: 'integer', minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const tree = await CmsTree.load(db());
    const node = tree.get(req.params.id);
    if (!node) return reply.notFound('Item not found');

    const newParentId = req.body.parentId;
    if (newParentId) {
      const parent = tree.get(newParentId);
      if (!parent) return reply.notFound('Target parent not found');
      if (parent.doc.type === 'link') return reply.badRequest('Links cannot have child items');
      // Walk up from the new parent: reaching the node means it would move under itself
      if (tree.isSelfOrAncestor(node.id, newParentId)) return reply.badRequest('An item cannot move inside itself');
    }
    const oldParentId = node.doc.parentId?.toString() ?? null;
    if (node.doc.type !== 'link' && newParentId !== oldParentId) {
      const clash = tree.siblings(newParentId).find(s => s.doc.type !== 'link' && s.doc.slug === node.doc.slug);
      if (clash) return reply.conflict(`"${clash.doc.title}" already uses the slug "${node.doc.slug}" there`);
      if (!newParentId && node.doc.slug && RESERVED_SLUGS.has(node.doc.slug)) {
        return reply.badRequest(`"/${node.doc.slug}" is used by the application. Rename the item before moving it to the top level.`);
      }
    }

    const now = new Date();
    const parentOid = newParentId ? new ObjectId(newParentId) : null;
    const target = tree.siblings(newParentId).filter(s => s.id !== node.id);
    const index = Math.min(req.body.index, target.length);
    target.splice(index, 0, node);
    const ops = renumber(target, parentOid, now, node.id);
    if (newParentId !== oldParentId) {
      ops.push(...renumber(tree.siblings(oldParentId).filter(s => s.id !== node.id), node.doc.parentId, now));
    }
    try {
      if (ops.length) await db().collection<CmsNodeDoc>(COL).bulkWrite(ops);
    } catch (err) {
      if (isDuplicateKey(err)) return reply.conflict('Another item there already uses this slug');
      throw err;
    }

    audit(req, 'cms_node.move', node.id, { from: oldParentId, to: newParentId, index });
    const fresh = await CmsTree.load(db());
    return nodeJson(fresh, fresh.get(node.id)!);
  });
}
