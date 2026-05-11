import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const COL = 'crm_contacts';

const VALID_ROLE   = ['Decision Maker', 'Champion', 'Technical', 'Finance', 'Other'] as const;
const VALID_STATUS = ['Prospect', 'Active', 'Churned', 'Partner'] as const;
const VALID_SOURCE = ['Inbound', 'Referral', 'Conference', 'Outreach', 'Other'] as const;

function mapDoc(d: Record<string, unknown>) {
  return {
    ...d,
    id:        (d._id as ObjectId).toString(),
    _id:       undefined,
    companyId: d.companyId  ? (d.companyId as ObjectId).toString()  : null,
    assignedTo: d.assignedTo ? (d.assignedTo as ObjectId).toString() : null,
    createdBy: d.createdBy  ? (d.createdBy  as ObjectId).toString()  : null,
    updatedBy: d.updatedBy  ? (d.updatedBy  as ObjectId).toString()  : null,
  };
}

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

export default async function contactsRoutes(app: FastifyInstance) {

  // GET /crm/contacts
  app.get('/', { preHandler: app.requirePermission('crm_contacts', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { search, status, role, companyId, assignedTo, source, limit = '50', skip = '0' } =
      req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (status)    match.status    = status;
    if (role)      match.role      = role;
    if (source)    match.source    = source;
    if (companyId) match.companyId = parseOid(companyId, app);
    if (assignedTo) match.assignedTo = parseOid(assignedTo, app);
    if (search?.trim()) match.$text = { $search: search.trim() };

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

    return { contacts: docs.map(d => mapDoc(d as Record<string, unknown>)), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /crm/contacts
  app.post('/', { preHandler: app.requirePermission('crm_contacts', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      firstName, lastName, email = '', phone = '', role = 'Other',
      status = 'Prospect', source = 'Other', companyId, linkedInUrl = '',
      timezone = '', tags = [], assignedTo,
    } = req.body as Record<string, unknown>;

    if (!firstName || !(firstName as string).trim()) throw app.httpErrors.badRequest('firstName is required');
    if (!lastName  || !(lastName  as string).trim()) throw app.httpErrors.badRequest('lastName is required');
    if (!VALID_ROLE.includes(role as typeof VALID_ROLE[number]))
      throw app.httpErrors.badRequest(`Invalid role. Valid: ${VALID_ROLE.join(', ')}`);
    if (!VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);

    const doc = {
      firstName:   (firstName as string).trim(),
      lastName:    (lastName  as string).trim(),
      email:       String(email).trim().toLowerCase() || null,
      phone:       String(phone).trim() || null,
      role:        String(role),
      status:      String(status),
      source:      String(source),
      companyId:   companyId ? parseOid(companyId as string, app) : null,
      assignedTo:  assignedTo ? parseOid(assignedTo as string, app) : null,
      linkedInUrl: String(linkedInUrl),
      timezone:    String(timezone),
      tags:        Array.isArray(tags) ? tags.map(String) : [],
      createdBy:   new ObjectId(req.session.userId!),
      updatedBy:   null as ObjectId | null,
      createdAt:   now,
      updatedAt:   now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_contact.create', resourceId: result.insertedId.toString(),
      meta: { firstName: doc.firstName, lastName: doc.lastName }, ip: req.ip,
    });

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /crm/contacts/:id
  app.get('/:id', { preHandler: app.requirePermission('crm_contacts', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const [doc] = await db.collection(COL).aggregate([
      { $match: { _id: oid } },
      { $lookup: { from: 'crm_companies', localField: 'companyId', foreignField: '_id', as: '_co' } },
      { $addFields: { companyName: { $arrayElemAt: ['$_co.name', 0] } } },
      { $project: { _co: 0 } },
    ]).toArray();

    if (!doc) return reply.notFound('Contact not found');
    return mapDoc(doc as Record<string, unknown>);
  });

  // PATCH /crm/contacts/:id
  app.patch('/:id', { preHandler: app.requirePermission('crm_contacts', 'update') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      firstName, lastName, email, phone, role, status, source,
      companyId, assignedTo, linkedInUrl, timezone, tags,
    } = req.body as Record<string, unknown>;

    if (role   !== undefined && !VALID_ROLE.includes(role   as typeof VALID_ROLE[number]))
      throw app.httpErrors.badRequest(`Invalid role. Valid: ${VALID_ROLE.join(', ')}`);
    if (status !== undefined && !VALID_STATUS.includes(status as typeof VALID_STATUS[number]))
      throw app.httpErrors.badRequest(`Invalid status. Valid: ${VALID_STATUS.join(', ')}`);

    const $set: Record<string, unknown> = { updatedBy: new ObjectId(req.session.userId!), updatedAt: new Date() };

    if (firstName   !== undefined) $set.firstName   = (firstName as string).trim();
    if (lastName    !== undefined) $set.lastName    = (lastName  as string).trim();
    if (email       !== undefined) $set.email       = String(email).trim().toLowerCase() || null;
    if (phone       !== undefined) $set.phone       = String(phone).trim() || null;
    if (role        !== undefined) $set.role        = String(role);
    if (status      !== undefined) $set.status      = String(status);
    if (source      !== undefined) $set.source      = String(source);
    if (linkedInUrl !== undefined) $set.linkedInUrl = String(linkedInUrl);
    if (timezone    !== undefined) $set.timezone    = String(timezone);
    if (tags        !== undefined) $set.tags        = Array.isArray(tags) ? tags.map(String) : [];
    if (companyId   !== undefined) $set.companyId   = companyId ? parseOid(companyId as string, app) : null;
    if (assignedTo  !== undefined) $set.assignedTo  = assignedTo ? parseOid(assignedTo as string, app) : null;

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Contact not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_contact.update', resourceId: oid.toString(),
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /crm/contacts/:id
  app.delete('/:id', { preHandler: app.requirePermission('crm_contacts', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Contact not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'crm_contact.delete', resourceId: oid.toString(), ip: req.ip,
    });

    reply.status(204);
  });
}
