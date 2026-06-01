import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const EST_COL = 'finance_estimates';
const INV_COL = 'finance_invoices';

type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function mapEstimate(doc: Record<string, unknown>) {
  return {
    ...doc,
    id:         (doc._id as ObjectId).toString(),
    _id:        undefined,
    customerId: doc.customerId ? (doc.customerId as ObjectId).toString() : null,
    companyId:  doc.companyId  ? (doc.companyId  as ObjectId).toString() : null,
    createdBy:  doc.createdBy  ? (doc.createdBy  as ObjectId).toString() : null,
    invoiceId:  doc.invoiceId  ? (doc.invoiceId  as ObjectId).toString() : null,
    estimateId: doc.estimateId ? (doc.estimateId as ObjectId).toString() : undefined,
  };
}

export default async function estimatesRoutes(app: FastifyInstance) {

  // GET /finance/estimates
  app.get('/', { preHandler: app.requireAuth }, async (req) => {
    const db     = app.mongo.db!;
    const userId = req.session.userId!;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const match: Record<string, unknown> = {};

    if (user?.role === 'customer') {
      match.customerId = new ObjectId(userId);
    }

    const { status, limit = '25', skip = '0', sort = 'createdAt', sortDir = 'desc' } = req.query as Record<string, string>;
    if (status) match.status = status;

    const SORTABLE = new Set(['estimateNumber', 'total', 'status', 'validUntil', 'createdAt']);
    const sortField = SORTABLE.has(sort) ? sort : 'createdAt';
    const sortOrder = sortDir === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      db.collection(EST_COL)
        .find(match)
        .sort({ [sortField]: sortOrder })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray(),
      db.collection(EST_COL).countDocuments(match),
    ]);

    return { estimates: docs.map(d => mapEstimate(d as Record<string, unknown>)), total };
  });

  // POST /finance/estimates
  app.post('/', { preHandler: app.requirePermission('finance_estimates', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      customerId, companyId, title = '', lineItems = [], taxRate = 0, currency = 'USD',
      status = 'draft', validUntil, notes = '',
    } = req.body as Record<string, unknown>;

    if (!customerId) throw app.httpErrors.badRequest('customerId is required');

    const items = (lineItems as Array<{ description: string; quantity: number; unitPrice: number }>).map(item => ({
      description: item.description,
      quantity:    Number(item.quantity),
      unitPrice:   Number(item.unitPrice),
      amount:      Number(item.quantity) * Number(item.unitPrice),
    }));

    const subtotal  = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = subtotal * (Number(taxRate) / 100);
    const total     = subtotal + taxAmount;

    const lastEst = await db.collection(EST_COL)
      .find({})
      .sort({ estimateNumber: -1 })
      .limit(1)
      .toArray();
    const lastNum = lastEst.length > 0
      ? parseInt((lastEst[0].estimateNumber as string).replace('EST-', ''), 10)
      : 0;
    const estimateNumber = `EST-${String(lastNum + 1).padStart(4, '0')}`;

    const doc = {
      estimateNumber,
      title:      String(title),
      customerId: parseOid(customerId as string, app),
      companyId:  companyId ? parseOid(companyId as string, app) : null,
      lineItems:  items,
      subtotal,
      taxRate:    Number(taxRate),
      taxAmount,
      total,
      currency:   String(currency),
      status:     String(status) as EstimateStatus,
      validUntil: validUntil ? new Date(validUntil as string) : null,
      notes:      String(notes),
      invoiceId:  null,
      createdBy:  new ObjectId(req.session.userId!),
      createdAt:  now,
      updatedAt:  now,
    };

    const result = await db.collection(EST_COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_estimate.create', resourceId: result.insertedId.toString(),
      meta: { estimateNumber, total }, ip: req.ip,
    });

    reply.status(201);
    return mapEstimate({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /finance/estimates/:id
  app.get('/:id', { preHandler: app.requireAuth }, async (req, reply) => {
    const db     = app.mongo.db!;
    const oid    = parseOid((req.params as { id: string }).id, app);
    const userId = req.session.userId!;

    const doc = await db.collection(EST_COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Estimate not found');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.role === 'customer' && doc.customerId?.toString() !== userId) {
      return reply.forbidden('Access denied');
    }

    return mapEstimate(doc as Record<string, unknown>);
  });

  // PATCH /finance/estimates/:id
  app.patch('/:id', { preHandler: app.requirePermission('finance_estimates', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      title, status, validUntil, notes, currency, customerId, companyId, lineItems, taxRate,
    } = req.body as Record<string, unknown>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (title      !== undefined) $set.title      = String(title);
    if (status     !== undefined) $set.status     = String(status);
    if (validUntil !== undefined) $set.validUntil = validUntil ? new Date(validUntil as string) : null;
    if (notes      !== undefined) $set.notes      = String(notes);
    if (currency   !== undefined) $set.currency   = String(currency);
    if (customerId !== undefined) $set.customerId = parseOid(customerId as string, app);
    if (companyId  !== undefined) $set.companyId  = companyId ? parseOid(companyId as string, app) : null;

    if (lineItems !== undefined) {
      const items = (lineItems as Array<{ description: string; quantity: number; unitPrice: number }>).map(item => ({
        description: item.description,
        quantity:    Number(item.quantity),
        unitPrice:   Number(item.unitPrice),
        amount:      Number(item.quantity) * Number(item.unitPrice),
      }));
      const subtotal  = items.reduce((s, i) => s + i.amount, 0);
      const tr        = taxRate !== undefined ? Number(taxRate) : 0;
      const taxAmount = subtotal * (tr / 100);
      $set.lineItems  = items;
      $set.subtotal   = subtotal;
      $set.taxRate    = tr;
      $set.taxAmount  = taxAmount;
      $set.total      = subtotal + taxAmount;
    } else if (taxRate !== undefined) {
      const est = await db.collection(EST_COL).findOne({ _id: oid });
      if (est) {
        const subtotal  = est.subtotal as number;
        const tr        = Number(taxRate);
        const taxAmount = subtotal * (tr / 100);
        $set.taxRate    = tr;
        $set.taxAmount  = taxAmount;
        $set.total      = subtotal + taxAmount;
      }
    }

    const result = await db.collection(EST_COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Estimate not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_estimate.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /finance/estimates/:id
  app.delete('/:id', { preHandler: app.requirePermission('finance_estimates', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(EST_COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Estimate not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_estimate.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });

  // POST /finance/estimates/:id/accept — customer signs off (sent → accepted)
  app.post('/:id/accept', { preHandler: app.requirePermission('finance_estimates', 'read') }, async (req, reply) => {
    const db     = app.mongo.db!;
    const oid    = parseOid((req.params as { id: string }).id, app);
    const userId = req.session.userId!;

    const doc = await db.collection(EST_COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Estimate not found');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.role === 'customer' && doc.customerId?.toString() !== userId) {
      return reply.forbidden('Access denied');
    }
    if (doc.status !== 'sent') return reply.badRequest('Only sent estimates can be accepted');

    await db.collection(EST_COL).updateOne({ _id: oid }, { $set: { status: 'accepted', updatedAt: new Date() } });

    logAudit(db, {
      userId, username: req.session.username!,
      action: 'finance_estimate.accept', resourceId: oid.toString(), ip: req.ip,
    });

    return { updated: true };
  });

  // POST /finance/estimates/:id/decline — customer declines (sent → declined)
  app.post('/:id/decline', { preHandler: app.requirePermission('finance_estimates', 'read') }, async (req, reply) => {
    const db     = app.mongo.db!;
    const oid    = parseOid((req.params as { id: string }).id, app);
    const userId = req.session.userId!;

    const doc = await db.collection(EST_COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Estimate not found');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.role === 'customer' && doc.customerId?.toString() !== userId) {
      return reply.forbidden('Access denied');
    }
    if (doc.status !== 'sent') return reply.badRequest('Only sent estimates can be declined');

    await db.collection(EST_COL).updateOne({ _id: oid }, { $set: { status: 'declined', updatedAt: new Date() } });

    logAudit(db, {
      userId, username: req.session.username!,
      action: 'finance_estimate.decline', resourceId: oid.toString(), ip: req.ip,
    });

    return { updated: true };
  });

  // POST /finance/estimates/:id/convert — convert accepted estimate to a new draft invoice
  app.post('/:id/convert', { preHandler: app.requirePermission('finance_invoices', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const now = new Date();

    const estimate = await db.collection(EST_COL).findOne({ _id: oid });
    if (!estimate) return reply.notFound('Estimate not found');

    if (estimate.invoiceId != null) {
      return reply.conflict('Estimate has already been converted to an invoice');
    }

    const blockedStatuses = ['declined', 'expired'];
    if (blockedStatuses.includes(estimate.status as string)) {
      throw app.httpErrors.badRequest('Cannot convert a declined or expired estimate');
    }

    // Auto-increment invoice number
    const lastInv = await db.collection(INV_COL)
      .find({})
      .sort({ invoiceNumber: -1 })
      .limit(1)
      .toArray();
    const lastNum = lastInv.length > 0
      ? parseInt((lastInv[0].invoiceNumber as string).replace('INV-', ''), 10)
      : 0;
    const invoiceNumber = `INV-${String(lastNum + 1).padStart(4, '0')}`;

    const invoiceDoc = {
      invoiceNumber,
      customerId:  estimate.customerId,
      companyId:   estimate.companyId,
      lineItems:   estimate.lineItems,
      subtotal:    estimate.subtotal,
      taxRate:     estimate.taxRate,
      taxAmount:   estimate.taxAmount,
      total:       estimate.total,
      currency:    estimate.currency,
      notes:       estimate.notes,
      estimateId:  oid,
      status:      'draft',
      dueDate:     null,
      createdBy:   new ObjectId(req.session.userId!),
      createdAt:   now,
      updatedAt:   now,
    };

    const invoiceResult = await db.collection(INV_COL).insertOne(invoiceDoc);
    const invoiceOid = invoiceResult.insertedId;

    await db.collection(EST_COL).updateOne(
      { _id: oid },
      { $set: { invoiceId: invoiceOid, status: 'accepted', updatedAt: now } }
    );

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_estimate.convert', resourceId: oid.toString(),
      meta: { invoiceId: invoiceOid.toString(), invoiceNumber }, ip: req.ip,
    });
    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_invoice.create', resourceId: invoiceOid.toString(),
      meta: { invoiceNumber, fromEstimate: oid.toString() }, ip: req.ip,
    });

    reply.status(201);
    return { invoiceId: invoiceOid.toString() };
  });
}
