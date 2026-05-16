import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const RULES = 'automation_rules';
const LOGS  = 'automation_logs';

export const TRIGGER_EVENTS = [
  'auth.user.registered',
  'auth.user.invited',
  'auth.user.invite.accepted',
  'calendar.event.created',
] as const;

export const ACTION_TYPES = [
  'notification.send',
  'message.send',
  'calendar.event.create',
] as const;

export default async function automationRoutes(app: FastifyInstance) {

  // GET /automation — list all rules
  app.get('/', { preHandler: app.requirePermission('automation', 'read') }, async () => {
    const rules = await app.mongo.db!.collection(RULES)
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return rules.map(r => ({
      id:        r._id.toString(),
      name:      r.name,
      trigger:   r.trigger,
      actions:   r.actions,
      enabled:   r.enabled,
      createdBy: r.createdBy?.toString(),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  });

  // GET /automation/meta — available triggers and action types
  app.get('/meta', { preHandler: app.requirePermission('automation', 'read') }, async () => ({
    triggerEvents: TRIGGER_EVENTS,
    actionTypes:   ACTION_TYPES,
  }));

  // POST /automation — create a rule
  app.post<{
    Body: {
      name:    string;
      trigger: { event: string; conditions: unknown[] };
      actions: unknown[];
    }
  }>('/', { preHandler: app.requirePermission('automation', 'create') }, async (req, reply) => {
    const { name, trigger, actions } = req.body;

    if (!name?.trim())                           return reply.badRequest('name is required');
    if (!trigger?.event?.trim())                 return reply.badRequest('trigger.event is required');
    if (!TRIGGER_EVENTS.includes(trigger.event as typeof TRIGGER_EVENTS[number])) {
      return reply.badRequest(`Unknown trigger event: ${trigger.event}`);
    }
    if (!Array.isArray(actions) || !actions.length) return reply.badRequest('At least one action is required');

    const now = new Date();
    const result = await app.mongo.db!.collection(RULES).insertOne({
      name:      name.trim(),
      trigger:   { event: trigger.event, conditions: trigger.conditions ?? [] },
      actions,
      enabled:   true,
      createdBy: new ObjectId(req.session.userId!),
      createdAt: now,
      updatedAt: now,
    });

    await app.bus.reloadRules();

    logAudit(app.mongo.db!, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'automation.rule.create', resourceId: result.insertedId.toString(),
      meta: { name: name.trim() }, ip: req.ip,
    });

    reply.code(201);
    return { id: result.insertedId.toString() };
  });

  // PATCH /automation/:id — update a rule (partial)
  app.patch<{
    Params: { id: string };
    Body: {
      name?:    string;
      trigger?: { event: string; conditions: unknown[] };
      actions?: unknown[];
      enabled?: boolean;
    }
  }>('/:id', { preHandler: app.requirePermission('automation', 'update') }, async (req, reply) => {
    const { name, trigger, actions, enabled } = req.body;

    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid rule ID'); }

    if (trigger?.event && !TRIGGER_EVENTS.includes(trigger.event as typeof TRIGGER_EVENTS[number])) {
      return reply.badRequest(`Unknown trigger event: ${trigger.event}`);
    }

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (name     !== undefined) $set.name    = name.trim();
    if (trigger  !== undefined) $set.trigger = { event: trigger.event, conditions: trigger.conditions ?? [] };
    if (actions  !== undefined) $set.actions = actions;
    if (enabled  !== undefined) $set.enabled = Boolean(enabled);

    const result = await app.mongo.db!.collection(RULES).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Rule not found');

    await app.bus.reloadRules();

    logAudit(app.mongo.db!, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'automation.rule.update', resourceId: req.params.id, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /automation/:id
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: app.requirePermission('automation', 'delete') },
    async (req, reply) => {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); }
      catch { return reply.badRequest('Invalid rule ID'); }

      const result = await app.mongo.db!.collection(RULES).deleteOne({ _id: oid });
      if (result.deletedCount === 0) return reply.notFound('Rule not found');

      await app.bus.reloadRules();

      logAudit(app.mongo.db!, {
        userId: req.session.userId!, username: req.session.username!,
        action: 'automation.rule.delete', resourceId: req.params.id, ip: req.ip,
      });

      return { deleted: true };
    }
  );

  // GET /automation/:id/logs — execution history for a rule
  app.get<{ Params: { id: string }; Querystring: { page?: string } }>(
    '/:id/logs',
    { preHandler: app.requirePermission('automation', 'read') },
    async (req, reply) => {
      let oid: ObjectId;
      try { oid = new ObjectId(req.params.id); }
      catch { return reply.badRequest('Invalid rule ID'); }

      const page  = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 20;
      const skip  = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        app.mongo.db!.collection(LOGS)
          .find({ ruleId: oid })
          .sort({ executedAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        app.mongo.db!.collection(LOGS).countDocuments({ ruleId: oid }),
      ]);

      return {
        logs: logs.map(l => ({
          id:          l._id.toString(),
          event:       l.event,
          success:     l.success,
          error:       l.error,
          executedAt:  l.executedAt,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }
  );
}
