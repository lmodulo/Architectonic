import type { FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';
import { calcNextDate } from '../lib/recurringDates.js';

const INV_COL = 'finance_invoices';
const SUB_COL = 'finance_subscriptions';

async function nextInvoiceNumber(db: Db): Promise<string> {
  const lastInv = await db.collection(INV_COL)
    .find({}).sort({ invoiceNumber: -1 }).limit(1).toArray();
  const lastNum = lastInv.length > 0
    ? parseInt((lastInv[0].invoiceNumber as string).replace('INV-', ''), 10)
    : 0;
  return `INV-${String(lastNum + 1).padStart(4, '0')}`;
}

async function processRecurringInvoices(db: Db, now: Date) {
  const templates = await db.collection(INV_COL)
    .find({ 'recurrence.enabled': true, 'recurrence.nextDate': { $lte: now } })
    .toArray();

  for (const tmpl of templates) {
    const rec = tmpl.recurrence as Record<string, unknown>;
    const invoiceNumber = await nextInvoiceNumber(db);

    const dueDate = rec.dueDateOffsetDays != null
      ? new Date(now.getTime() + (rec.dueDateOffsetDays as number) * 86400000)
      : (tmpl.dueDate ?? null);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, invoiceNumber: _inv, status: _st, createdAt: _c, updatedAt: _u, recurrence: _rec, ...rest } = tmpl as Record<string, unknown>;

    await db.collection(INV_COL).insertOne({
      ...rest,
      invoiceNumber,
      status:    'draft',
      dueDate,
      createdAt: now,
      updatedAt: now,
      recurrence: { generatedFromId: tmpl._id as ObjectId },
    });

    const nextDate = calcNextDate(now, rec.frequency as string);
    const until    = rec.until as Date | undefined;
    const $set: Record<string, unknown> = { 'recurrence.nextDate': nextDate, updatedAt: now };
    if (until && nextDate > until) $set['recurrence.enabled'] = false;

    await db.collection(INV_COL).updateOne({ _id: tmpl._id }, { $set });
  }
}

async function processSubscriptions(db: Db, now: Date) {
  const subs = await db.collection(SUB_COL)
    .find({ status: 'active', nextBillingDate: { $lte: now } })
    .toArray();

  for (const sub of subs) {
    const invoiceNumber = await nextInvoiceNumber(db);

    const dueDate = sub.dueDateOffsetDays != null
      ? new Date(now.getTime() + (sub.dueDateOffsetDays as number) * 86400000)
      : null;

    const items  = (sub.lineItems ?? []) as Array<{ amount: number }>;
    const subtotal  = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = subtotal * ((sub.taxRate as number) / 100);

    await db.collection(INV_COL).insertOne({
      invoiceNumber,
      customerId:     sub.customerId,
      companyId:      sub.companyId ?? null,
      subscriptionId: sub._id,
      lineItems:      sub.lineItems,
      subtotal,
      taxRate:        sub.taxRate,
      taxAmount,
      total:          subtotal + taxAmount,
      currency:       sub.currency,
      status:         'draft',
      dueDate,
      notes:          sub.notes ?? '',
      createdBy:      sub.createdBy,
      createdAt:      now,
      updatedAt:      now,
    });

    const nextBillingDate = calcNextDate(now, sub.billingCycle as string);
    const $set: Record<string, unknown> = { nextBillingDate, updatedAt: now };
    if (sub.endDate && nextBillingDate > (sub.endDate as Date)) $set.status = 'cancelled';

    await db.collection(SUB_COL).updateOne({ _id: sub._id }, { $set });
  }
}

async function tick(db: Db) {
  const now = new Date();
  await processRecurringInvoices(db, now);
  await processSubscriptions(db, now);
}

export default async function schedulerPlugin(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db = app.mongo.db!;
    app.log.info('scheduler tick');
    await tick(db);
    setInterval(() => tick(db), 60 * 60 * 1000);
  });
}
