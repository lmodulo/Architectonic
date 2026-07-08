import type { FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';
import { calcNextDate } from '../../lib/recurringDates.js';
import { logAudit } from '../../lib/audit.js';

const SUB_COL     = 'finance_subscriptions';
const PERIOD_COL  = 'finance_retainer_periods';

async function computeHoursUsed(db: Db, companyId: ObjectId, periodStart: Date, periodEnd: Date): Promise<number> {
  const result = await db.collection('time_entries').aggregate([
    {
      $match: {
        billable: true,
        date: {
          $gte: periodStart.toISOString().substring(0, 10),
          $lte: periodEnd.toISOString().substring(0, 10),
        },
      },
    },
    {
      $lookup: {
        from:         'agile_milestones',
        localField:   'milestoneId',
        foreignField: '_id',
        as:           '_milestone',
      },
    },
    { $unwind: { path: '$_milestone', preserveNullAndEmptyArrays: false } },
    { $match: { '_milestone.clientId': companyId } },
    { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
  ]).toArray();

  return result.length > 0 ? (result[0].total as number) / 60 : 0;
}

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
    const {
      status, customerId, limit = '25', skip = '0',
      sort = 'nextBillingDate', sortDir = 'asc',
    } = req.query as Record<string, string>;

    const user  = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const match: Record<string, unknown> = {};

    if (user?.role === 'customer') {
      match.customerId = new ObjectId(userId);
    } else if (customerId) {
      match.customerId = parseOid(customerId, app);
    }

    if (status) match.status = status;

    const SORTABLE = new Set(['name', 'billingCycle', 'nextBillingDate', 'status']);
    const sortField = SORTABLE.has(sort) ? sort : 'nextBillingDate';
    const sortOrder = sortDir === 'desc' ? -1 : 1;

    const [docs, total] = await Promise.all([
      db.collection(SUB_COL)
        .find(match)
        .sort({ [sortField]: sortOrder })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray(),
      db.collection(SUB_COL).countDocuments(match),
    ]);

    return { subscriptions: docs.map(d => mapSub(d as Record<string, unknown>)), total };
  });

  // POST /finance/subscriptions
  app.post('/', { preHandler: app.requirePermission('finance_subscriptions', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      name, customerId, companyId, lineItems = [], taxRate = 0, currency = 'USD',
      billingCycle, startDate, endDate, dueDateOffsetDays, notes = '',
      retainerEnabled = false, retainerHours = null, rolloverEnabled = false,
      rolloverCap = null, overageRate = null,
    } = req.body as Record<string, unknown>;

    if (!name)         throw app.httpErrors.badRequest('name is required');
    if (!customerId)   throw app.httpErrors.badRequest('customerId is required');
    if (!billingCycle) throw app.httpErrors.badRequest('billingCycle is required');
    if (!startDate)    throw app.httpErrors.badRequest('startDate is required');

    const start      = new Date(startDate as string);
    const companyOid = companyId ? parseOid(companyId as string, app) : null;
    const items = (lineItems as Array<{ description: string; quantity: number; unitPrice: number }>).map(i => ({
      description: i.description,
      quantity:    Number(i.quantity),
      unitPrice:   Number(i.unitPrice),
      amount:      Number(i.quantity) * Number(i.unitPrice),
    }));

    const doc = {
      name:              String(name),
      customerId:        parseOid(customerId as string, app),
      companyId:         companyOid,
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
      retainerEnabled:   Boolean(retainerEnabled),
      retainerHours:     retainerHours != null ? Number(retainerHours) : null,
      rolloverEnabled:   Boolean(rolloverEnabled),
      rolloverCap:       rolloverCap != null ? Number(rolloverCap) : null,
      overageRate:       overageRate != null ? Number(overageRate) : null,
      createdBy:         new ObjectId(req.session.userId!),
      createdAt:         now,
      updatedAt:         now,
    };

    const result = await db.collection(SUB_COL).insertOne(doc);

    if (doc.retainerEnabled && doc.retainerHours != null && companyOid) {
      const periodEnd = new Date(calcNextDate(start, String(billingCycle)));
      periodEnd.setDate(periodEnd.getDate() - 1);
      await db.collection(PERIOD_COL).insertOne({
        subscriptionId: result.insertedId,
        companyId:      companyOid,
        periodStart:    start,
        periodEnd,
        hoursBase:      doc.retainerHours,
        hoursRolledOver: 0,
        hoursIncluded:  doc.retainerHours,
        hoursUsed:      0,
        hoursUsedAt:    now,
        status:         'open',
        invoiceId:      null,
        createdAt:      now,
        updatedAt:      now,
      });
    }

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
      retainerEnabled, retainerHours, rolloverEnabled, rolloverCap, overageRate,
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
    if (retainerEnabled   !== undefined) $set.retainerEnabled   = Boolean(retainerEnabled);
    if (retainerHours     !== undefined) $set.retainerHours     = retainerHours != null ? Number(retainerHours) : null;
    if (rolloverEnabled   !== undefined) $set.rolloverEnabled   = Boolean(rolloverEnabled);
    if (rolloverCap       !== undefined) $set.rolloverCap       = rolloverCap != null ? Number(rolloverCap) : null;
    if (overageRate       !== undefined) $set.overageRate       = overageRate != null ? Number(overageRate) : null;

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

  // GET /finance/subscriptions/:id/retainer-current
  app.get('/:id/retainer-current', { preHandler: app.requirePermission('finance_subscriptions', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const now = new Date();

    const period = await db.collection(PERIOD_COL).findOne({ subscriptionId: oid, status: 'open' });
    if (!period) return reply.notFound('No open retainer period');

    const hoursUsed = await computeHoursUsed(
      db,
      period.companyId as ObjectId,
      period.periodStart as Date,
      period.periodEnd as Date,
    );

    await db.collection(PERIOD_COL).updateOne(
      { _id: period._id },
      { $set: { hoursUsed, hoursUsedAt: now, updatedAt: now } },
    );

    return {
      ...period,
      id:             period._id.toString(),
      _id:            undefined,
      subscriptionId: oid.toString(),
      companyId:      (period.companyId as ObjectId).toString(),
      invoiceId:      period.invoiceId ? (period.invoiceId as ObjectId).toString() : null,
      hoursUsed,
    };
  });

  // GET /finance/subscriptions/:id/retainer-history
  app.get('/:id/retainer-history', { preHandler: app.requirePermission('finance_subscriptions', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const periods = await db.collection(PERIOD_COL)
      .find({ subscriptionId: oid })
      .sort({ periodStart: -1 })
      .limit(36)
      .toArray();

    return {
      periods: periods.map(p => ({
        ...p,
        id:             p._id.toString(),
        _id:            undefined,
        subscriptionId: oid.toString(),
        companyId:      (p.companyId as ObjectId).toString(),
        invoiceId:      p.invoiceId ? (p.invoiceId as ObjectId).toString() : null,
      })),
    };
  });
}
