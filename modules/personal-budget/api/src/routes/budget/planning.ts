import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { projectCashflow } from '../../lib/cashflow.js';
import { detectBills } from '../../lib/bill-detector.js';

export default async function planningRoutes(app: FastifyInstance) {

  // GET /budget/planning/cashflow — 12-month projection
  app.get('/cashflow', { preHandler: app.requirePermission('budget_planning', 'read') }, async (req) => {
    const db     = app.mongo.db!;
    const userId = req.session.userId!;
    const months = Math.min(24, parseInt((req.query as Record<string, string>).months ?? '12', 10));

    const buckets = await projectCashflow(db, userId, months);
    return { buckets };
  });

  // GET /budget/planning/bills — detected recurring bills
  app.get('/bills', { preHandler: app.requirePermission('budget_planning', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);

    // Re-run detection to catch new bills (non-blocking; also runs after every sync)
    detectBills(db, req.session.userId!)
      .catch(err => app.log.warn('[budget] bill detect: %s', err.message));

    const bills = await db
      .collection('budget_bills')
      .find({ userId: uid, dismissed: false })
      .sort({ nextDue: 1 })
      .toArray();

    const now = new Date();

    return {
      bills: bills.map(b => ({
        id:            b._id.toString(),
        merchant:      b.merchant,
        amount:        b.amount,
        frequencyDays: b.frequencyDays,
        lastPaid:      b.lastPaid,
        nextDue:       b.nextDue,
        confirmed:     b.confirmed,
        daysUntilDue:  Math.ceil((new Date(b.nextDue).getTime() - now.getTime()) / 86_400_000),
      })),
    };
  });

  // PATCH /budget/planning/bills/:id — confirm / dismiss / edit next-due / edit amount
  app.patch('/bills/:id', { preHandler: app.requirePermission('budget_planning', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid bill ID'); }

    const { confirmed, dismissed, nextDue, amount } = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (confirmed  !== undefined) patch.confirmed  = Boolean(confirmed);
    if (dismissed  !== undefined) patch.dismissed  = Boolean(dismissed);
    if (nextDue    !== undefined) patch.nextDue    = new Date(nextDue as string);
    if (amount     !== undefined) patch.amount     = Number(amount);

    const result = await db.collection('budget_bills').findOneAndUpdate(
      { _id: oid, userId: uid },
      { $set: patch },
      { returnDocument: 'after' }
    );

    if (!result) throw app.httpErrors.notFound('Bill not found');
    return { id: result._id.toString(), ...patch };
  });

  // DELETE /budget/planning/bills/:id
  app.delete('/bills/:id', { preHandler: app.requirePermission('budget_planning', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid bill ID'); }

    const res = await db.collection('budget_bills').deleteOne({ _id: oid, userId: uid });
    if (res.deletedCount === 0) throw app.httpErrors.notFound('Bill not found');

    reply.status(204);
  });

  // GET /budget/planning/rules — list automation rules (ordered)
  app.get('/rules', { preHandler: app.requirePermission('budget_planning', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);

    const rules = await db
      .collection('budget_automation_rules')
      .find({ userId: uid })
      .sort({ order: 1 })
      .toArray();

    return {
      rules: rules.map(r => ({
        id:             r._id.toString(),
        name:           r.name,
        order:          r.order,
        active:         r.active,
        conditionLogic: r.conditionLogic,
        conditions:     r.conditions,
        actions:        r.actions,
        createdAt:      r.createdAt,
        updatedAt:      r.updatedAt,
      })),
    };
  });

  // POST /budget/planning/rules — create rule
  app.post('/rules', { preHandler: app.requirePermission('budget_planning', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { name, conditionLogic, conditions, actions, active } = req.body as Record<string, unknown>;

    if (!name || !(name as string).trim()) throw app.httpErrors.badRequest('name is required');
    if (!Array.isArray(conditions) || conditions.length === 0) throw app.httpErrors.badRequest('conditions are required');
    if (!Array.isArray(actions)    || actions.length    === 0) throw app.httpErrors.badRequest('actions are required');

    // Determine next order value
    const last = await db
      .collection('budget_automation_rules')
      .findOne({ userId: uid }, { sort: { order: -1 } });
    const order = (last?.order ?? 0) + 1;

    const now = new Date();
    const doc = {
      userId:         uid,
      name:           (name as string).trim(),
      order,
      active:         active !== false,
      conditionLogic: conditionLogic === 'any' ? 'any' : 'all',
      conditions,
      actions,
      createdAt:      now,
      updatedAt:      now,
    };

    const { insertedId } = await db.collection('budget_automation_rules').insertOne(doc);

    reply.status(201);
    return { id: insertedId.toString(), ...doc, userId: uid.toString() };
  });

  // PATCH /budget/planning/rules/reorder — bulk reorder (must come before /:id)
  app.patch('/rules/reorder', { preHandler: app.requirePermission('budget_planning', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { order } = req.body as { order: { id: string; order: number }[] };

    if (!Array.isArray(order)) throw app.httpErrors.badRequest('order must be an array');

    await Promise.all(
      order.map(({ id, order: o }) => {
        let oid: ObjectId;
        try { oid = new ObjectId(id); } catch { return; }
        return db.collection('budget_automation_rules').updateOne(
          { _id: oid, userId: uid },
          { $set: { order: o, updatedAt: new Date() } }
        );
      })
    );

    return { updated: order.length };
  });

  // PATCH /budget/planning/rules/:id — update rule
  app.patch('/rules/:id', { preHandler: app.requirePermission('budget_planning', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid rule ID'); }

    const { name, conditionLogic, conditions, actions, active } = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (name           !== undefined) patch.name           = (name as string).trim();
    if (conditionLogic !== undefined) patch.conditionLogic = conditionLogic === 'any' ? 'any' : 'all';
    if (conditions     !== undefined) patch.conditions     = conditions;
    if (actions        !== undefined) patch.actions        = actions;
    if (active         !== undefined) patch.active         = Boolean(active);

    const result = await db.collection('budget_automation_rules').findOneAndUpdate(
      { _id: oid, userId: uid },
      { $set: patch },
      { returnDocument: 'after' }
    );

    if (!result) throw app.httpErrors.notFound('Rule not found');
    return { id: result._id.toString(), ...patch };
  });

  // DELETE /budget/planning/rules/:id
  app.delete('/rules/:id', { preHandler: app.requirePermission('budget_planning', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid rule ID'); }

    const res = await db.collection('budget_automation_rules').deleteOne({ _id: oid, userId: uid });
    if (res.deletedCount === 0) throw app.httpErrors.notFound('Rule not found');

    reply.status(204);
  });
}
