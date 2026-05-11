import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'crm_companies';

const VALID_INDUSTRY = ['SaaS', 'Enterprise', 'Startup', 'Agency', 'Government', 'Other'] as const;
const VALID_SIZE     = ['1-10', '11-50', '51-200', '200+'] as const;
const VALID_TYPE     = ['Prospect', 'Customer', 'Partner', 'Vendor'] as const;

function mapDoc(d: Record<string, unknown>) {
  return {
    ...d,
    id:        (d._id as ObjectId).toString(),
    _id:       undefined,
    assignedTo: d.assignedTo ? (d.assignedTo as ObjectId).toString() : null,
    createdBy: d.createdBy  ? (d.createdBy  as ObjectId).toString()  : null,
    updatedBy: d.updatedBy  ? (d.updatedBy  as ObjectId).toString()  : null,
  };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

// Aggregation that computes healthScore from deal value + activity recency
function healthPipeline(matchStage: Record<string, unknown>) {
  return [
    { $match: matchStage },
    {
      $lookup: {
        from: 'crm_deals',
        let: { cid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$companyId', '$$cid'] }, { $ne: ['$stage', 'Closed Lost'] }] } } },
        ],
        as: '_deals',
      },
    },
    {
      $lookup: {
        from: 'crm_activities',
        let: { cid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$entityType', 'company'] }, { $eq: ['$entityId', '$$cid'] }] } } },
          { $sort: { completedAt: -1 } },
          { $limit: 1 },
        ],
        as: '_lastActivity',
      },
    },
    {
      $addFields: {
        _totalDealValue: { $sum: '$_deals.value' },
        _lastActivityDate: { $arrayElemAt: ['$_lastActivity.completedAt', 0] },
      },
    },
    {
      $addFields: {
        _dealScore: { $min: [70, { $divide: ['$_totalDealValue', 10000] }] },
        _daysSinceActivity: {
          $cond: [
            { $gt: ['$_lastActivityDate', null] },
            { $divide: [{ $subtract: ['$$NOW', '$_lastActivityDate'] }, 86400000] },
            999,
          ],
        },
      },
    },
    {
      $addFields: {
        healthScore: {
          $round: [
            {
              $add: [
                '$_dealScore',
                {
                  $switch: {
                    branches: [
                      { case: { $lte: ['$_daysSinceActivity', 7]  }, then: 30 },
                      { case: { $lte: ['$_daysSinceActivity', 30] }, then: 20 },
                      { case: { $lte: ['$_daysSinceActivity', 90] }, then: 10 },
                    ],
                    default: 0,
                  },
                },
              ],
            },
            0,
          ],
        },
        dealCount: { $size: '$_deals' },
      },
    },
    { $project: { _deals: 0, _lastActivity: 0, _totalDealValue: 0, _dealScore: 0, _daysSinceActivity: 0, _lastActivityDate: 0 } },
  ];
}

export default async function companiesRoutes(app: FastifyInstance) {

  // GET /crm/companies
  app.get('/', { preHandler: app.requirePermission('crm_companies', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { search, type, industry, assignedTo, limit = '50', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (type)       match.type       = type;
    if (industry)   match.industry   = industry;
    if (assignedTo) match.assignedTo = parseOid(assignedTo, app);
    if (search?.trim()) match.$text  = { $search: search.trim() };

    const [docs, total] = await Promise.all([
      db.collection(COL).aggregate([
        ...healthPipeline(match),
        { $sort: { createdAt: -1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
      ]).toArray(),
      db.collection(COL).countDocuments(match),
    ]);

    return { companies: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /crm/companies
  app.post('/', { preHandler: app.requirePermission('crm_companies', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      name, domain = '', website = '', description = '',
      industry = 'Other', size = '1-10', type = 'Prospect',
      assignedTo, tags = [],
    } = req.body as Record<string, unknown>;

    if (!name || !(name as string).trim()) throw app.httpErrors.badRequest('name is required');
    if (!VALID_INDUSTRY.includes(industry as typeof VALID_INDUSTRY[number]))
      throw app.httpErrors.badRequest(`Invalid industry. Valid: ${VALID_INDUSTRY.join(', ')}`);
    if (!VALID_TYPE.includes(type as typeof VALID_TYPE[number]))
      throw app.httpErrors.badRequest(`Invalid type. Valid: ${VALID_TYPE.join(', ')}`);

    const doc = {
      name:        (name as string).trim(),
      domain:      String(domain).trim().toLowerCase() || null,
      website:     String(website).trim() || null,
      description: String(description),
      industry:    String(industry),
      size:        String(size),
      type:        String(type),
      assignedTo:  assignedTo ? parseOid(assignedTo as string, app) : null,
      tags:        Array.isArray(tags) ? tags.map(String) : [],
      createdBy:   new ObjectId(req.session.userId!),
      updatedBy:   null as ObjectId | null,
      createdAt:   now,
      updatedAt:   now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_company.create', resourceId: result.insertedId.toString(),
      meta: { name: doc.name, type: doc.type }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /crm/companies/:id
  app.get('/:id', { preHandler: app.requirePermission('crm_companies', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const [doc] = await db.collection(COL).aggregate(healthPipeline({ _id: oid })).toArray();
    if (!doc) return reply.notFound('Company not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /crm/companies/:id
  app.patch('/:id', { preHandler: app.requirePermission('crm_companies', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const { name, domain, website, description, industry, size, type, assignedTo, tags } =
      req.body as Record<string, unknown>;

    if (industry !== undefined && !VALID_INDUSTRY.includes(industry as typeof VALID_INDUSTRY[number]))
      throw app.httpErrors.badRequest(`Invalid industry. Valid: ${VALID_INDUSTRY.join(', ')}`);
    if (type !== undefined && !VALID_TYPE.includes(type as typeof VALID_TYPE[number]))
      throw app.httpErrors.badRequest(`Invalid type. Valid: ${VALID_TYPE.join(', ')}`);

    const $set: Record<string, unknown> = { updatedBy: new ObjectId(req.session.userId!), updatedAt: new Date() };

    if (name        !== undefined) $set.name        = (name as string).trim();
    if (domain      !== undefined) $set.domain      = String(domain).trim().toLowerCase() || null;
    if (website     !== undefined) $set.website     = String(website).trim() || null;
    if (description !== undefined) $set.description = String(description);
    if (industry    !== undefined) $set.industry    = String(industry);
    if (size        !== undefined) $set.size        = String(size);
    if (type        !== undefined) $set.type        = String(type);
    if (tags        !== undefined) $set.tags        = Array.isArray(tags) ? tags.map(String) : [];
    if (assignedTo  !== undefined) $set.assignedTo  = assignedTo ? parseOid(assignedTo as string, app) : null;

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Company not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_company.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /crm/companies/:id
  app.delete('/:id', { preHandler: app.requirePermission('crm_companies', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Company not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_company.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });
}
