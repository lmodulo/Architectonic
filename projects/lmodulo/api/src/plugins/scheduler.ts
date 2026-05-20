import type { FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';
import { calcNextDate } from '../lib/recurringDates.js';
import { sendInvoiceOverdueEmail } from '../lib/email.js';

const INV_COL    = 'finance_invoices';
const SUB_COL    = 'finance_subscriptions';
const PERIOD_COL = 'finance_retainer_periods';

async function computeRetainerHoursUsed(db: Db, companyId: ObjectId, periodStart: Date, periodEnd: Date): Promise<number> {
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
    { $unwind: { path: '$_milestone', preserveNullAndEmpty: false } },
    { $match: { '_milestone.clientId': companyId } },
    { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
  ]).toArray();

  return result.length > 0 ? (result[0].total as number) / 60 : 0;
}

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

    const lineItems = [...((sub.lineItems ?? []) as Array<{ description: string; quantity: number; unitPrice: number; amount: number }>)];

    // Handle retainer period close + overage billing
    if (sub.retainerEnabled && sub.companyId) {
      const openPeriod = await db.collection(PERIOD_COL).findOne({
        subscriptionId: sub._id,
        status: 'open',
      });

      if (openPeriod) {
        const hoursUsed = await computeRetainerHoursUsed(
          db,
          sub.companyId as ObjectId,
          openPeriod.periodStart as Date,
          openPeriod.periodEnd as Date,
        );

        const hoursIncluded = openPeriod.hoursIncluded as number;
        const hoursOver     = Math.max(0, hoursUsed - hoursIncluded);

        if (sub.overageRate != null && hoursOver > 0) {
          const overageAmount = Math.round(hoursOver * (sub.overageRate as number) * 100) / 100;
          lineItems.push({
            description: `Overage: ${hoursOver.toFixed(2)} hrs @ $${(sub.overageRate as number).toFixed(2)}/hr`,
            quantity:    1,
            unitPrice:   overageAmount,
            amount:      overageAmount,
          });
        }

        // Close the period — update after invoice is inserted so we have its ID
        const retainerClose = { hoursUsed, status: 'closed', updatedAt: now };
        await db.collection(PERIOD_COL).updateOne({ _id: openPeriod._id }, { $set: retainerClose });

        // Open next period with rollover
        const nextStart   = calcNextDate(openPeriod.periodEnd as Date, sub.billingCycle as string);
        const nextEnd     = new Date(calcNextDate(nextStart, sub.billingCycle as string));
        nextEnd.setDate(nextEnd.getDate() - 1);

        const hoursUnused  = Math.max(0, hoursIncluded - hoursUsed);
        const rolloverCap  = sub.rolloverCap != null ? (sub.rolloverCap as number) : Infinity;
        const rolledOver   = sub.rolloverEnabled ? Math.min(hoursUnused, rolloverCap) : 0;
        const hoursBase    = (sub.retainerHours as number) ?? 0;

        await db.collection(PERIOD_COL).insertOne({
          subscriptionId:  sub._id,
          companyId:       sub.companyId,
          periodStart:     nextStart,
          periodEnd:       nextEnd,
          hoursBase,
          hoursRolledOver: rolledOver,
          hoursIncluded:   hoursBase + rolledOver,
          hoursUsed:       0,
          hoursUsedAt:     now,
          status:          'open',
          invoiceId:       null,
          createdAt:       now,
          updatedAt:       now,
        });
      }
    }

    const items     = lineItems as Array<{ amount: number }>;
    const subtotal  = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = subtotal * ((sub.taxRate as number) / 100);

    const invResult = await db.collection(INV_COL).insertOne({
      invoiceNumber,
      customerId:     sub.customerId,
      companyId:      sub.companyId ?? null,
      subscriptionId: sub._id,
      lineItems,
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

    // Store invoiceId on the closed period
    if (sub.retainerEnabled) {
      await db.collection(PERIOD_COL).updateOne(
        { subscriptionId: sub._id, status: 'closed', invoiceId: null },
        { $set: { invoiceId: invResult.insertedId, updatedAt: now } },
      );
    }

    const nextBillingDate = calcNextDate(now, sub.billingCycle as string);
    const $set: Record<string, unknown> = { nextBillingDate, updatedAt: now };
    if (sub.endDate && nextBillingDate > (sub.endDate as Date)) $set.status = 'cancelled';

    await db.collection(SUB_COL).updateOne({ _id: sub._id }, { $set });
  }
}

async function processOverdueInvoices(db: Db, now: Date) {
  const overdue = await db.collection(INV_COL).find({
    status:  'sent',
    dueDate: { $lt: now },
  }).toArray();

  for (const inv of overdue) {
    await db.collection(INV_COL).updateOne({ _id: inv._id }, { $set: { status: 'overdue', updatedAt: now } });
    const customer = await db.collection('users').findOne({ _id: inv.customerId });
    if (customer?.email) {
      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      sendInvoiceOverdueEmail(customer.email as string, {
        invoiceNumber: inv.invoiceNumber as string,
        total:         inv.total as number,
        currency:      inv.currency as string,
        dueDate:       inv.dueDate as Date,
        invoiceUrl:    `${appUrl}/payments`,
      }).catch(err => console.error('[email] overdue reminder failed:', err));
    }
  }
}

async function tick(db: Db) {
  const now = new Date();
  await processRecurringInvoices(db, now);
  await processSubscriptions(db, now);
  await processOverdueInvoices(db, now);
}

export default async function schedulerPlugin(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db = app.mongo.db!;
    app.log.info('scheduler tick');
    await tick(db);
    setInterval(() => tick(db), 60 * 60 * 1000);
  });
}
