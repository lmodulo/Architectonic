import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'crm_deals';

const VALID_STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Contract', 'Closed Won', 'Closed Lost'] as const;
const VALID_TYPES  = ['New Business', 'Upsell', 'Renewal', 'Partnership'] as const;

const STAGE_PROBABILITY: Record<string, number> = {
  'Discovery':    10,
  'Proposal':     30,
  'Negotiation':  60,
  'Contract':     85,
  'Closed Won':  100,
  'Closed Lost':   0,
};

function mapDoc(d: Record<string, unknown>) {
  return {
    ...d,
    id:         (d._id as ObjectId).toString(),
    _id:        undefined,
    companyId:  d.companyId  ? (d.companyId  as ObjectId).toString()  : null,
    assignedTo: d.assignedTo ? (d.assignedTo as ObjectId).toString()  : null,
    createdBy:  d.createdBy  ? (d.createdBy  as ObjectId).toString()  : null,
    updatedBy:  d.updatedBy  ? (d.updatedBy  as ObjectId).toString()  : null,
    contactIds: Array.isArray(d.contactIds)
      ? (d.contactIds as ObjectId[]).map(o => o.toString())
      : [],
  };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

export default async function dealsRoutes(app: FastifyInstance) {

  // GET /crm/deals
  app.get('/', { preHandler: app.requirePermission('crm_deals', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const {
      stage, companyId, assignedTo, type, closingBefore, excludeLost,
      limit = '200', skip = '0',
    } = req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (stage)      match.stage      = stage;
    if (type)       match.type       = type;
    if (companyId)  match.companyId  = parseOid(companyId, app);
    if (assignedTo) match.assignedTo = parseOid(assignedTo, app);
    if (closingBefore) match.expectedCloseDate = { $lte: new Date(closingBefore) };
    if (excludeLost === 'true') match.stage = { $ne: 'Closed Lost' };

    const [docs, total] = await Promise.all([
      db.collection(COL).aggregate([
        { $match: match },
        { $lookup: { from: 'crm_companies', localField: 'companyId', foreignField: '_id', as: '_co' } },
        { $addFields: { companyName: { $arrayElemAt: ['$_co.name', 0] } } },
        { $project: { _co: 0 } },
        { $sort: { createdAt: -1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
      ]).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { deals: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /crm/deals
  app.post('/', { preHandler: app.requirePermission('crm_deals', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      title, companyId, contactIds = [], stage = 'Discovery', value = 0,
      currency = 'USD', probability, type = 'New Business',
      expectedCloseDate, description = '', assignedTo, lostReason = '',
    } = req.body as Record<string, unknown>;

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('title is required');
    if (!VALID_STAGES.includes(stage as typeof VALID_STAGES[number]))
      throw app.httpErrors.badRequest(`Invalid stage. Valid: ${VALID_STAGES.join(', ')}`);
    if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number]))
      throw app.httpErrors.badRequest(`Invalid type. Valid: ${VALID_TYPES.join(', ')}`);
    if (stage === 'Closed Lost' && !String(lostReason).trim())
      throw app.httpErrors.badRequest('lostReason is required when stage is Closed Lost');

    const autoProb = probability !== undefined ? Number(probability) : STAGE_PROBABILITY[stage as string];

    const doc = {
      title:             (title as string).trim(),
      companyId:         companyId ? parseOid(companyId as string, app) : null,
      contactIds:        Array.isArray(contactIds)
        ? (contactIds as string[]).map(id => parseOid(id, app))
        : [],
      stage:             String(stage),
      value:             Number(value) || 0,
      currency:          String(currency),
      probability:       Math.min(100, Math.max(0, autoProb)),
      type:              String(type),
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate as string) : null,
      description:       String(description),
      lostReason:        String(lostReason),
      assignedTo:        assignedTo ? parseOid(assignedTo as string, app) : null,
      createdBy:         new ObjectId(req.session.userId!),
      updatedBy:         null as ObjectId | null,
      createdAt:         now,
      updatedAt:         now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_deal.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, stage: doc.stage, value: doc.value }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /crm/deals/:id
  app.get('/:id', { preHandler: app.requirePermission('crm_deals', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const [doc] = await db.collection(COL).aggregate([
      { $match: { _id: oid } },
      { $lookup: { from: 'crm_companies', localField: 'companyId', foreignField: '_id', as: '_co' } },
      { $addFields: { companyName: { $arrayElemAt: ['$_co.name', 0] } } },
      { $project: { _co: 0 } },
    ]).toArray();

    if (!doc) return reply.notFound('Deal not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /crm/deals/:id
  app.patch('/:id', { preHandler: app.requirePermission('crm_deals', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      title, companyId, contactIds, stage, value, currency, probability,
      type, expectedCloseDate, description, assignedTo, lostReason,
    } = req.body as Record<string, unknown>;

    if (stage !== undefined && !VALID_STAGES.includes(stage as typeof VALID_STAGES[number]))
      throw app.httpErrors.badRequest(`Invalid stage. Valid: ${VALID_STAGES.join(', ')}`);
    if (type  !== undefined && !VALID_TYPES.includes(type as typeof VALID_TYPES[number]))
      throw app.httpErrors.badRequest(`Invalid type. Valid: ${VALID_TYPES.join(', ')}`);
    if (stage === 'Closed Lost' && lostReason !== undefined && !String(lostReason).trim())
      throw app.httpErrors.badRequest('lostReason is required when stage is Closed Lost');

    const $set: Record<string, unknown> = { updatedBy: new ObjectId(req.session.userId!), updatedAt: new Date() };

    if (title             !== undefined) $set.title             = (title as string).trim();
    if (description       !== undefined) $set.description       = String(description);
    if (currency          !== undefined) $set.currency          = String(currency);
    if (lostReason        !== undefined) $set.lostReason        = String(lostReason);
    if (value             !== undefined) $set.value             = Number(value) || 0;
    if (companyId         !== undefined) $set.companyId         = companyId ? parseOid(companyId as string, app) : null;
    if (assignedTo        !== undefined) $set.assignedTo        = assignedTo ? parseOid(assignedTo as string, app) : null;
    if (expectedCloseDate !== undefined) $set.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate as string) : null;
    if (contactIds        !== undefined)
      $set.contactIds = Array.isArray(contactIds)
        ? (contactIds as string[]).map(id => parseOid(id, app))
        : [];
    if (stage !== undefined) {
      $set.stage = String(stage);
      // Auto-set probability when stage changes unless client sent one explicitly
      $set.probability = probability !== undefined
        ? Math.min(100, Math.max(0, Number(probability)))
        : STAGE_PROBABILITY[stage as string];
    } else if (probability !== undefined) {
      $set.probability = Math.min(100, Math.max(0, Number(probability)));
    }
    if (type !== undefined) $set.type = String(type);

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Deal not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_deal.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /crm/deals/:id
  app.delete('/:id', { preHandler: app.requirePermission('crm_deals', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Deal not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_deal.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });
}
