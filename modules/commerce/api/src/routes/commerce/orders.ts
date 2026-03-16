import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'orders';

const STATUS_VALUES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

function mapOrder(d: any) {
  return { ...d, id: d._id.toString(), _id: undefined };
}

export default async function ordersRoutes(app: FastifyInstance) {

  // GET /commerce/orders — list with filters and pagination
  app.get<{
    Querystring: {
      status?: string; search?: string;
      limit?: number; skip?: number;
    }
  }>('/', {
    preHandler: app.requirePermission('commerce_orders', 'read'),
    schema: {
      summary: 'List orders',
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: [...STATUS_VALUES] },
          search: { type: 'string' },
          limit:  { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          skip:   { type: 'integer', minimum: 0, default: 0 }
        }
      }
    }
  }, async (req) => {
    const { status, search, limit = 25, skip = 0 } = req.query;
    const db     = app.mongo.db!;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { guestEmail:  { $regex: search, $options: 'i' } }
      ];
    }

    const [docs, total] = await Promise.all([
      db.collection(COL)
        .find(filter, { projection: { items: 0 } }) // exclude items from list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(COL).countDocuments(filter)
    ]);

    return { orders: docs.map(mapOrder), total, skip, limit };
  });

  // GET /commerce/orders/:id — full order detail
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('commerce_orders', 'read'),
    schema: { summary: 'Get full order detail' }
  }, async (req, reply) => {
    const doc = await app.mongo.db!.collection(COL).findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return reply.notFound('Order not found');
    return mapOrder(doc);
  });

  // PATCH /commerce/orders/:id/status — update order status
  app.patch<{
    Params: { id: string };
    Body: { status: string; notes?: string }
  }>('/:id/status', {
    preHandler: app.requirePermission('commerce_orders', 'update'),
    schema: {
      summary: 'Update order status',
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: [...STATUS_VALUES] },
          notes:  { type: 'string', maxLength: 1000 }
        }
      }
    }
  }, async (req, reply) => {
    const db    = app.mongo.db!;
    const _id   = new ObjectId(req.params.id);
    const { status, notes } = req.body;

    const $set: Record<string, unknown> = { status, updatedAt: new Date() };
    if (notes !== undefined) $set.notes = notes;

    const previous = await db.collection(COL).findOneAndUpdate(
      { _id },
      { $set },
      { returnDocument: 'before' }
    );

    if (!previous) return reply.notFound('Order not found');

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'order.status_change',
      resourceId: req.params.id,
      meta:       { from: (previous as any).status, to: status },
      ip:         req.ip
    });
    return { updated: true, status };
  });
}
