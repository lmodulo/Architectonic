import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { toSlug } from '../../lib/slug.js';

const COL = 'categories';

export default async function categoriesRoutes(app: FastifyInstance) {

  // GET /commerce/categories — list all, sorted by order
  app.get('/', {
    preHandler: app.requirePermission('commerce_categories', 'read'),
    schema: { summary: 'List all categories' }
  }, async () => {
    const docs = await app.mongo.db!.collection(COL)
      .find({})
      .sort({ order: 1, name: 1 })
      .toArray();
    return docs.map(d => ({ ...d, id: d._id.toString(), _id: undefined }));
  });

  // POST /commerce/categories — create
  app.post<{ Body: { name: string; description?: string; parentId?: string; order?: number } }>('/', {
    preHandler: app.requirePermission('commerce_categories', 'create'),
    schema: {
      summary: 'Create a category',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          parentId:    { type: 'string' },
          order:       { type: 'integer', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const { name, description = '', parentId, order = 0 } = req.body;
    const db  = app.mongo.db!;
    const now = new Date();

    const doc = {
      name,
      slug:        toSlug(name),
      description,
      parentId:    parentId ? new ObjectId(parentId) : null,
      order,
      createdAt:   now,
      updatedAt:   now
    };

    try {
      const result = await db.collection(COL).insertOne(doc);
      logAudit(db, {
        userId:     req.session.userId!,
        username:   req.session.username!,
        action:     'category.create',
        resourceId: result.insertedId.toString(),
        meta:       { name },
        ip:         req.ip
      });
      reply.code(201);
      return { id: result.insertedId.toString(), slug: doc.slug };
    } catch (err: any) {
      if (err?.code === 11000) return reply.conflict('A category with this name already exists');
      throw err;
    }
  });

  // PATCH /commerce/categories/:id — update
  app.patch<{ Params: { id: string }; Body: { name?: string; description?: string; parentId?: string | null; order?: number } }>('/:id', {
    preHandler: app.requirePermission('commerce_categories', 'update'),
    schema: {
      summary: 'Update a category',
      body: {
        type: 'object',
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          parentId:    { type: ['string', 'null'] },
          order:       { type: 'integer', minimum: 0 }
        }
      }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const { name, description, parentId, order } = req.body;

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined)        { $set.name = name; $set.slug = toSlug(name); }
    if (description !== undefined)  $set.description = description;
    if (parentId !== undefined)     $set.parentId = parentId ? new ObjectId(parentId) : null;
    if (order !== undefined)        $set.order = order;

    try {
      const result = await db.collection(COL).updateOne({ _id }, { $set });
      if (result.matchedCount === 0) return reply.notFound('Category not found');
      logAudit(db, {
        userId:     req.session.userId!,
        username:   req.session.username!,
        action:     'category.update',
        resourceId: req.params.id,
        meta:       { fields: Object.keys($set) },
        ip:         req.ip
      });
      return { updated: true };
    } catch (err: any) {
      if (err?.code === 11000) return reply.conflict('A category with this name already exists');
      throw err;
    }
  });

  // DELETE /commerce/categories/:id — delete (guard: reject if active products use it)
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('commerce_categories', 'delete'),
    schema: { summary: 'Delete a category' }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const _id = new ObjectId(req.params.id);
    const id  = req.params.id;

    const inUse = await db.collection('products').countDocuments({
      category: id,
      status:   { $ne: 'archived' }
    });
    if (inUse > 0) {
      return reply.conflict(`Cannot delete: ${inUse} active product(s) use this category`);
    }

    const result = await db.collection(COL).deleteOne({ _id });
    if (result.deletedCount === 0) return reply.notFound('Category not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'category.delete',
      resourceId: id,
      ip:         req.ip
    });
    return { deleted: true };
  });
}
