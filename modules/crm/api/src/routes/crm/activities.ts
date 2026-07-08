import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'crm_activities';

const VALID_TYPES       = ['Call', 'Email', 'Meeting', 'Demo', 'Note', 'Task'] as const;
const VALID_ENTITY_TYPES = ['contact', 'company', 'deal'] as const;
const VALID_OUTCOMES    = ['Answered', 'No-show', 'Left Voicemail', 'Productive', 'N/A'] as const;

function mapDoc(d: Record<string, unknown>) {
  return {
    ...d,
    id:         (d._id as ObjectId).toString(),
    _id:        undefined,
    entityId:   d.entityId   ? (d.entityId   as ObjectId).toString()  : null,
    assignedTo: d.assignedTo ? (d.assignedTo as ObjectId).toString()  : null,
    createdBy:  d.createdBy  ? (d.createdBy  as ObjectId).toString()  : null,
  };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

export default async function activitiesRoutes(app: FastifyInstance) {

  // GET /crm/activities
  app.get('/', { preHandler: app.requirePermission('crm_activities', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const {
      entityType, entityId, type, assignedTo, open,
      limit = '100', skip = '0',
    } = req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (type)       match.type       = type;
    if (assignedTo) match.assignedTo = parseOid(assignedTo, app);
    if (entityType) match.entityType = entityType;
    if (entityId)   match.entityId   = parseOid(entityId, app);
    if (open === 'true') match.completedAt = { $exists: false };

    const [docs, total] = await Promise.all([
      db.collection(COL)
        .find(match)
        .sort({ scheduledAt: -1, createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { activities: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /crm/activities
  app.post('/', { preHandler: app.requirePermission('crm_activities', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      type, title, body = '', entityType, entityId,
      scheduledAt, outcome = 'N/A', assignedTo,
    } = req.body as Record<string, unknown>;

    if (!type  || !VALID_TYPES.includes(type as typeof VALID_TYPES[number]))
      throw app.httpErrors.badRequest(`Invalid type. Valid: ${VALID_TYPES.join(', ')}`);
    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('title is required');
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType as typeof VALID_ENTITY_TYPES[number]))
      throw app.httpErrors.badRequest(`Invalid entityType. Valid: ${VALID_ENTITY_TYPES.join(', ')}`);

    const doc = {
      type:        String(type),
      title:       (title as string).trim(),
      body:        String(body),
      entityType:  entityType ? String(entityType) : null,
      entityId:    entityId ? parseOid(entityId as string, app) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt as string) : null,
      completedAt: null as Date | null,
      outcome:     String(outcome),
      assignedTo:  assignedTo ? parseOid(assignedTo as string, app) : null,
      createdBy:   new ObjectId(req.session.userId!),
      createdAt:   now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_activity.create', resourceId: result.insertedId.toString(),
      meta: { type: doc.type, title: doc.title, entityType: doc.entityType }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /crm/activities/:id
  app.get('/:id', { preHandler: app.requirePermission('crm_activities', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Activity not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /crm/activities/:id — also handles mark-complete (send completedAt)
  app.patch('/:id', { preHandler: app.requirePermission('crm_activities', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { type, title, body, entityType, entityId, scheduledAt, completedAt, outcome, assignedTo } =
      req.body as Record<string, unknown>;

    if (type !== undefined && !VALID_TYPES.includes(type as typeof VALID_TYPES[number]))
      throw app.httpErrors.badRequest(`Invalid type. Valid: ${VALID_TYPES.join(', ')}`);

    const $set: Record<string, unknown> = {};

    if (type        !== undefined) $set.type        = String(type);
    if (title       !== undefined) $set.title       = (title as string).trim();
    if (body        !== undefined) $set.body        = String(body);
    if (entityType  !== undefined) $set.entityType  = entityType ? String(entityType) : null;
    if (entityId    !== undefined) $set.entityId    = entityId ? parseOid(entityId as string, app) : null;
    if (scheduledAt !== undefined) $set.scheduledAt = scheduledAt ? new Date(scheduledAt as string) : null;
    if (completedAt !== undefined) $set.completedAt = completedAt ? new Date(completedAt as string) : null;
    if (outcome     !== undefined) $set.outcome     = String(outcome);
    if (assignedTo  !== undefined) $set.assignedTo  = assignedTo ? parseOid(assignedTo as string, app) : null;

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Activity not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_activity.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /crm/activities/:id
  app.delete('/:id', { preHandler: app.requirePermission('crm_activities', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Activity not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_activity.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });
}
