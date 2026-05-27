import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'contract_templates';

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function mapTemplate(doc: Record<string, unknown>) {
  return {
    ...doc,
    id:        (doc._id as ObjectId).toString(),
    _id:       undefined,
    createdBy: doc.createdBy ? (doc.createdBy as ObjectId).toString() : null,
  };
}

export default async function contractTemplateRoutes(app: FastifyInstance) {

  // GET /contracts/templates
  app.get('/', { preHandler: app.requirePermission('contract_templates', 'read') }, async () => {
    const db   = app.mongo.db!;
    const docs = await db.collection(COL).find({}).sort({ isDefault: -1, name: 1 }).toArray();
    return docs.map(d => mapTemplate(d as Record<string, unknown>));
  });

  // POST /contracts/templates
  app.post('/', { preHandler: app.requirePermission('contract_templates', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const { name, type = 'custom', description = '', content = '', variables = [] } = req.body as Record<string, unknown>;
    if (!name) throw app.httpErrors.badRequest('name is required');

    const doc = {
      name, type, description, content,
      variables: variables as string[],
      isDefault: false,
      createdBy: new ObjectId(req.session.userId!),
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection(COL).insertOne(doc);
    await logAudit(app, req, 'contract_templates.create', result.insertedId, { name });

    reply.code(201);
    return mapTemplate({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /contracts/templates/:id
  app.get('/:id', { preHandler: app.requirePermission('contract_templates', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Template not found');
    return mapTemplate(doc as Record<string, unknown>);
  });

  // PATCH /contracts/templates/:id
  app.patch('/:id', { preHandler: app.requirePermission('contract_templates', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Template not found');

    const { name, type, description, content, variables } = req.body as Record<string, unknown>;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (name        != null) update.name        = name;
    if (type        != null) update.type        = type;
    if (description != null) update.description = description;
    if (content     != null) update.content     = content;
    if (variables   != null) update.variables   = variables;

    await db.collection(COL).updateOne({ _id: oid }, { $set: update });
    await logAudit(app, req, 'contract_templates.update', oid, update);

    const updated = await db.collection(COL).findOne({ _id: oid });
    return mapTemplate(updated as Record<string, unknown>);
  });

  // DELETE /contracts/templates/:id
  app.delete('/:id', { preHandler: app.requirePermission('contract_templates', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Template not found');
    if (doc.isDefault) throw app.httpErrors.badRequest('Cannot delete built-in templates');

    await db.collection(COL).deleteOne({ _id: oid });
    await logAudit(app, req, 'contract_templates.delete', oid, { name: doc.name });

    reply.code(204).send();
  });
}
