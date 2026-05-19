import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { calcNextDate } from '../../lib/recurringDates.js';
import { logAudit } from '../../lib/audit.js';

const SUB_COL = 'finance_subscriptions';

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function mapSub(doc: Record<string, unknown>) {
  return {
    ...doc,
    id:         (doc._id as ObjectId).toString(),
    _id:        undefined,
    customerId: doc.customerId ? (doc.customerId as ObjectId).toString() : null,
    companyId:  doc.companyId  ? (doc.companyId  as ObjectId).toString() : null,
    createdBy:  doc.createdBy  ? (doc.createdBy  as ObjectId).toString() : null,
  };
}

export default async function subscriptionRoutes(app: FastifyInstance) {

  // GET /finance/subscriptions
  app.get('/', { preHandler: app.requirePermission('finance_subscriptions', 'read') }, async (req) => {
    const db     = app.mongo.db!;
    const userId = req.session.userId!;
    const { status, customerId } = req.query as Record<string, string>;

    const user  = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const match: Record<string, unknown> = {};

    if (user?.role === 'customer') {
      match.customerId = new ObjectId(userId);
    } else if (customerId) {
      match.customerId = parseOid(customerId, app);
    }

    if (status) match.status = status;

    const docs = await db.collection(SUB_COL)
      .find(match)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return { subscriptions: docs.map(d => mapSub(d as Record<string, unknown>)) };
  });

  // POST /finance/subscriptions
  app.post('/', { preHandler: app.requirePermission('finance_subscriptions', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      name, customerId, companyId, lineItems = [], taxRate = 0, currency = 'USD',
      billingCycle, startDate, endDate, dueDateOffsetDays, notes = '',
    } = req.body as Record<string, unknown>;

    if (!name)         throw app.httpErrors.badRequest('name is required');
    if (!customerId)   throw app.httpErrors.badRequest('customerId is required');
    if (!billingCycle) throw app.httpErrors.badRequest('billingCycle is required');
    if (!startDate)    throw app.httpErrors.badRequest('startDate is required');

    const start = new Date(startDate as string);
    const items = (lineItems as Array<{ description: string; quantity: number; unitPrice: number }>).map(i => ({
      description: i.description,
      quantity:    Number(i.quantity),
      unitPrice:   Number(i.unitPrice),
      amount:      Number(i.quantity) * Number(i.unitPrice),
    }));

    const doc = {
      name:              String(name),
      customerId:        parseOid(customerId as string, app),
      companyId:         companyId ? parseOid(companyId as string, app) : null,
      lineItems:         items,
      taxRate:           Number(taxRate),
      currency:          String(currency),
      billingCycle:      String(billingCycle),
      startDate:         start,
      nextBillingDate:   calcNextDate(start, String(billingCycle)),
      endDate:           endDate ? new Date(endDate as string) : null,
      dueDateOffsetDays: dueDateOffsetDays != null ? Number(dueDateOffsetDays) : null,
      status:            'active' as const,
      notes:             String(notes),
      createdBy:         new ObjectId(req.session.userId!),
      createdAt:         now,
      updatedAt:         now,
    };

    const result = await db.collection(SUB_COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_subscription.create', resourceId: result.insertedId.toString(),
      meta: { name }, ip: req.ip,
    });

    reply.status(201);
    return mapSub({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /finance/subscriptions/:id
  app.get('/:id', { preHandler: app.requirePermission('finance_subscriptions', 'read') }, async (req, reply) => {
    const db     = app.mongo.db!;
    const oid    = parseOid((req.params as { id: string }).id, app);
    const userId = req.session.userId!;

    const doc = await db.collection(SUB_COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Subscription not found');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.role === 'customer' && doc.customerId?.toString() !== userId) {
      return reply.forbidden('Access denied');
    }

    return mapSub(doc as Record<string, unknown>);
  });

  // PATCH /finance/subscriptions/:id
  app.patch('/:id', { preHandler: app.requirePermission('finance_subscriptions', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      name, lineItems, taxRate, currency, billingCycle,
      endDate, dueDateOffsetDays, notes, status,
    } = req.body as Record<string, unknown>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (name              !== undefined) $set.name              = String(name);
    if (currency          !== undefined) $set.currency          = String(currency);
    if (billingCycle      !== undefined) $set.billingCycle      = String(billingCycle);
    if (endDate           !== undefined) $set.endDate           = endDate ? new Date(endDate as string) : null;
    if (dueDateOffsetDays !== undefined) $set.dueDateOffsetDays = dueDateOffsetDays != null ? Number(dueDateOffsetDays) : null;
    if (notes             !== undefined) $set.notes             = String(notes);
    if (status            !== undefined) $set.status            = String(status);
    if (taxRate           !== undefined) $set.taxRate           = Number(taxRate);

    if (lineItems !== undefined) {
      $set.lineItems = (lineItems as Array<{ description: string; quantity: number; unitPrice: number }>).map(i => ({
        description: i.description,
        quantity:    Number(i.quantity),
        unitPrice:   Number(i.unitPrice),
        amount:      Number(i.quantity) * Number(i.unitPrice),
      }));
    }

    const result = await db.collection(SUB_COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Subscription not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_subscription.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /finance/subscriptions/:id
  app.delete('/:id', { preHandler: app.requirePermission('finance_subscriptions', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(SUB_COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Subscription not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_subscription.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });
}
