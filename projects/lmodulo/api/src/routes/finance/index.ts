import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import Stripe from 'stripe';
import { logAudit } from '../../lib/audit.js';
import { calcNextDate } from '../../lib/recurringDates.js';

const INV_COL = 'finance_invoices';
const PAY_COL = 'finance_payments';

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

function mapInvoice(doc: Record<string, unknown>) {
  const rec = doc.recurrence as Record<string, unknown> | undefined;
  return {
    ...doc,
    id:             (doc._id as ObjectId).toString(),
    _id:            undefined,
    customerId:     doc.customerId     ? (doc.customerId     as ObjectId).toString() : null,
    companyId:      doc.companyId      ? (doc.companyId      as ObjectId).toString() : null,
    createdBy:      doc.createdBy      ? (doc.createdBy      as ObjectId).toString() : null,
    subscriptionId: doc.subscriptionId ? (doc.subscriptionId as ObjectId).toString() : undefined,
    ...(rec ? {
      recurrence: {
        ...rec,
        generatedFromId: rec.generatedFromId ? (rec.generatedFromId as ObjectId).toString() : undefined,
      }
    } : {}),
  };
}

export default async function financeRoutes(app: FastifyInstance) {

  // GET /finance/invoices
  app.get('/invoices', { preHandler: app.requireAuth }, async (req) => {
    const db     = app.mongo.db!;
    const userId = req.session.userId!;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    const match: Record<string, unknown> = {};

    if (user?.role === 'customer') {
      match.customerId = new ObjectId(userId);
    }

    const { status, limit = '50', skip = '0', sort = 'createdAt', sortDir = 'desc', subscriptionId } = req.query as Record<string, string>;
    if (status)         match.status         = status;
    if (subscriptionId) match.subscriptionId = parseOid(subscriptionId, app);

    const SORTABLE = new Set(['invoiceNumber', 'dueDate', 'total', 'status', 'createdAt']);
    const sortField = SORTABLE.has(sort) ? sort : 'createdAt';
    const sortOrder = sortDir === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      db.collection(INV_COL)
        .find(match)
        .sort({ [sortField]: sortOrder })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray(),
      db.collection(INV_COL).countDocuments(match),
    ]);

    return { invoices: docs.map(d => mapInvoice(d as Record<string, unknown>)), total };
  });

  // POST /finance/invoices
  app.post('/invoices', { preHandler: app.requirePermission('finance_invoices', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      customerId, companyId, lineItems = [], taxRate = 0, currency = 'USD',
      status = 'draft', dueDate, notes = '', recurrence,
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

    const rec = recurrence as { enabled?: boolean; frequency?: string; until?: string; dueDateOffsetDays?: number } | undefined;
    const recurrenceField = rec?.enabled ? {
      recurrence: {
        enabled:   true,
        frequency: rec.frequency ?? 'monthly',
        nextDate:  calcNextDate(now, rec.frequency ?? 'monthly'),
        ...(rec.until             ? { until:             new Date(rec.until) }             : {}),
        ...(rec.dueDateOffsetDays != null ? { dueDateOffsetDays: rec.dueDateOffsetDays } : {}),
      }
    } : {};

    const doc = {
      invoiceNumber,
      customerId: parseOid(customerId as string, app),
      companyId:  companyId ? parseOid(companyId as string, app) : null,
      lineItems:  items,
      subtotal,
      taxRate:    Number(taxRate),
      taxAmount,
      total,
      currency:   String(currency),
      status:     String(status) as InvoiceStatus,
      dueDate:    dueDate ? new Date(dueDate as string) : null,
      notes:      String(notes),
      createdBy:  new ObjectId(req.session.userId!),
      createdAt:  now,
      updatedAt:  now,
      ...recurrenceField,
    };

    const result = await db.collection(INV_COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_invoice.create', resourceId: result.insertedId.toString(),
      meta: { invoiceNumber, total }, ip: req.ip,
    });

    reply.status(201);
    return mapInvoice({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /finance/invoices/:id
  app.get('/invoices/:id', { preHandler: app.requireAuth }, async (req, reply) => {
    const db     = app.mongo.db!;
    const oid    = parseOid((req.params as { id: string }).id, app);
    const userId = req.session.userId!;

    const doc = await db.collection(INV_COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Invoice not found');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (user?.role === 'customer' && doc.customerId?.toString() !== userId) {
      return reply.forbidden('Access denied');
    }

    return mapInvoice(doc as Record<string, unknown>);
  });

  // PATCH /finance/invoices/:id
  app.patch('/invoices/:id', { preHandler: app.requirePermission('finance_invoices', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      lineItems, taxRate, status, dueDate, notes, currency, customerId, companyId, recurrence,
    } = req.body as Record<string, unknown>;

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (status      !== undefined) $set.status    = String(status);
    if (dueDate     !== undefined) $set.dueDate   = dueDate ? new Date(dueDate as string) : null;
    if (notes       !== undefined) $set.notes      = String(notes);
    if (currency    !== undefined) $set.currency   = String(currency);
    if (customerId  !== undefined) $set.customerId = parseOid(customerId as string, app);
    if (companyId   !== undefined) $set.companyId  = companyId ? parseOid(companyId as string, app) : null;

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
      const inv = await db.collection(INV_COL).findOne({ _id: oid });
      if (inv) {
        const subtotal  = inv.subtotal as number;
        const tr        = Number(taxRate);
        const taxAmount = subtotal * (tr / 100);
        $set.taxRate    = tr;
        $set.taxAmount  = taxAmount;
        $set.total      = subtotal + taxAmount;
      }
    }

    if (recurrence !== undefined) {
      const rec = recurrence as { enabled?: boolean; frequency?: string; until?: string; dueDateOffsetDays?: number } | null;
      if (!rec || !rec.enabled) {
        $set['recurrence.enabled'] = false;
      } else {
        $set['recurrence.enabled']   = true;
        $set['recurrence.frequency'] = rec.frequency ?? 'monthly';
        if (!$set['recurrence.nextDate']) {
          $set['recurrence.nextDate'] = calcNextDate(new Date(), rec.frequency ?? 'monthly');
        }
        if (rec.until != null)             $set['recurrence.until']             = new Date(rec.until);
        if (rec.dueDateOffsetDays != null)  $set['recurrence.dueDateOffsetDays'] = rec.dueDateOffsetDays;
      }
    }

    const result = await db.collection(INV_COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Invoice not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_invoice.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /finance/invoices/:id
  app.delete('/invoices/:id', { preHandler: app.requirePermission('finance_invoices', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(INV_COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Invoice not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_invoice.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });

  // POST /finance/invoices/:id/pay — create Stripe PaymentIntent
  app.post('/invoices/:id/pay', { preHandler: app.requireAuth }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const invoice = await db.collection(INV_COL).findOne({ _id: oid });
    if (!invoice) return reply.notFound('Invoice not found');
    if (invoice.status === 'paid') return reply.badRequest('Invoice already paid');

    const stripe = getStripe();
    if (!stripe) return reply.serviceUnavailable('Stripe is not configured');

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round((invoice.total as number) * 100),
      currency: (invoice.currency as string).toLowerCase(),
      metadata: { invoiceId: oid.toString() },
    });

    return { clientSecret: paymentIntent.client_secret };
  });

  // POST /finance/stripe/webhook
  // The frontend proxy forwards this as application/octet-stream so Fastify delivers the raw Buffer.
  // addContentTypeParser for octet-stream gives us the raw bytes for Stripe signature verification.
  app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' }, (_req, body, done) => {
    done(null, body);
  });

  app.post('/stripe/webhook', async (req, reply) => {
    const stripe = getStripe();
    if (!stripe) return reply.serviceUnavailable('Stripe is not configured');

    const sig    = req.headers['stripe-signature'] as string;
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody = req.body as Buffer | string;

    let event: Stripe.Event;
    if (secret && sig) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, secret);
      } catch (err) {
        return reply.badRequest(`Webhook signature verification failed: ${(err as Error).message}`);
      }
    } else {
      // No secret configured — parse body as JSON (dev/test only)
      event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi        = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata.invoiceId;
      const db        = app.mongo.db!;

      if (invoiceId) {
        const oid = new ObjectId(invoiceId);
        await db.collection(INV_COL).updateOne(
          { _id: oid },
          { $set: { status: 'paid', paidAt: new Date(), stripePaymentIntentId: pi.id, updatedAt: new Date() } }
        );

        const invoice = await db.collection(INV_COL).findOne({ _id: oid });
        if (invoice) {
          await db.collection(PAY_COL).insertOne({
            invoiceId:             oid,
            customerId:            invoice.customerId,
            stripePaymentIntentId: pi.id,
            stripeChargeId:        (pi as any).latest_charge ?? null,
            amount:                invoice.total,
            currency:              invoice.currency,
            status:                'succeeded',
            createdAt:             new Date(),
          });
        }
      }
    }

    return { received: true };
  });

  // GET /finance/customers
  app.get('/customers', { preHandler: app.requirePermission('users', 'read') }, async (req) => {
    const db = app.mongo.db!;

    const customers = await db.collection('users').aggregate([
      { $match: { role: 'customer' } },
      {
        $lookup: {
          from:         'crm_companies',
          localField:   'companyId',
          foreignField: '_id',
          as:           '_co',
        }
      },
      { $addFields: { companyName: { $arrayElemAt: ['$_co.name', 0] } } },
      { $project: { _co: 0, passwordHash: 0, passwordSetTokenHash: 0, passwordSetTokenExpiry: 0 } },
      { $sort: { createdAt: -1 } },
    ]).toArray();

    return {
      customers: customers.map(u => ({
        ...u,
        id:        u._id.toString(),
        _id:       undefined,
        companyId: u.companyId ? u.companyId.toString() : null,
      }))
    };
  });
}
