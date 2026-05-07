import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { notifyNewEvent, type CalendarEventDoc } from '../../lib/calendarNotify.js';

const COL  = 'calendar_events';
const SUBS = 'event_subscriptions';

function mapEvent(d: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
  if (out.ownerId   instanceof ObjectId) out.ownerId   = (out.ownerId   as ObjectId).toString();
  if (out.createdBy instanceof ObjectId) out.createdBy = (out.createdBy as ObjectId).toString();
  if (out.updatedBy instanceof ObjectId) out.updatedBy = (out.updatedBy as ObjectId).toString();
  out.sharedWith = Array.isArray(out.sharedWith)
    ? (out.sharedWith as unknown[]).map(id => id instanceof ObjectId ? id.toString() : String(id))
    : [];
  return out;
}

async function resolveNames(
  db: ReturnType<FastifyInstance['mongo']['db']>,
  ids: Set<string>,
): Promise<Map<string, string>> {
  if (ids.size === 0 || !db) return new Map();
  const oids = [...ids].flatMap(id => { try { return [new ObjectId(id)]; } catch { return []; } });
  const users = await db.collection('users').find(
    { _id: { $in: oids } },
    { projection: { _id: 1, username: 1, firstName: 1, lastName: 1 } },
  ).toArray();
  return new Map(users.map(u => [
    (u._id as ObjectId).toString(),
    (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : String(u.username),
  ]));
}

function parseOid(id: string): ObjectId | null {
  try { return new ObjectId(id); } catch { return null; }
}

function parseSharedWith(raw: unknown): ObjectId[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).flatMap(id => {
    const oid = parseOid(String(id));
    return oid ? [oid] : [];
  });
}

export default async function calendarEventsRoutes(app: FastifyInstance) {

  // GET /calendar-events/public — no auth, upcoming public-visibility events
  app.get('/public', async (req) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const max = new Date(now); max.setFullYear(max.getFullYear() + 1);
    const { type, from, to } = req.query as { type?: string; from?: string; to?: string };

    const filter: Record<string, unknown> = {
      status:     'active',
      visibility: 'public',
      startDate:  { $gt: from ? new Date(from) : now, $lt: to ? new Date(to) : max },
    };
    if (type) filter.eventType = type;

    const docs = await db.collection(COL).find(filter).sort({ startDate: 1 }).toArray();
    return docs.map(e => ({
      id:        e._id.toString(),
      title:     e.title,
      content:   e.content,
      eventType: e.eventType,
      startDate: e.startDate,
      endDate:   e.endDate,
      singleDay: e.singleDay,
      allDay:    e.allDay ?? false,
      location:  e.location ?? '',
      tags:      e.tags ?? [],
    }));
  });

  // GET /calendar-events — authenticated; returns events owned by or shared with this user
  // Pass ?all=1 to bypass ownership filter (requires calendar_events.create permission)
  app.get('/', { preHandler: app.requirePermission('calendar_events', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { type, status, visibility, search, from, to, limit = '50', skip = '0', all } =
      req.query as Record<string, string>;

    const currentUserOid = new ObjectId(req.session.userId!);

    let showAll = false;
    if (all === '1') {
      const u    = await db.collection('users').findOne({ _id: currentUserOid }, { projection: { role: 1 } });
      const role = u ? await db.collection('roles').findOne({ name: u.role }, { projection: { permissions: 1 } }) : null;
      const permsObj = role?.permissions as Record<string, Record<string, boolean>> | undefined;
      showAll = permsObj?.['calendar_events']?.['create'] === true;
    }

    const filter: Record<string, unknown> = {};

    if (!showAll) {
      // Personal view: events I own or events explicitly shared with me
      filter.$or = [
        { ownerId: currentUserOid },
        { sharedWith: currentUserOid },
      ];
    }

    if (type)       filter.eventType  = type;
    if (status)     filter.status     = status;
    if (visibility) filter.visibility = visibility;
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to)   dateFilter.$lte = new Date(to);
      filter.startDate = dateFilter;
    }

    let cursor;
    if (search?.trim()) {
      filter.$text = { $search: search.trim() };
      cursor = db.collection(COL)
        .find(filter, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      cursor = db.collection(COL).find(filter).sort({ startDate: 1 });
    }

    const [docs, total] = await Promise.all([
      cursor.skip(Number(skip)).limit(Number(limit)).toArray(),
      db.collection(COL).countDocuments(filter),
    ]);

    const ids = new Set<string>();
    docs.forEach(d => {
      if (d.ownerId   instanceof ObjectId) ids.add(d.ownerId.toString());
      if (d.createdBy instanceof ObjectId) ids.add(d.createdBy.toString());
    });
    const nameMap = await resolveNames(db, ids);

    const events = docs.map(d => {
      const ev = mapEvent(d as Record<string, unknown>);
      ev.ownerName     = ev.ownerId   ? (nameMap.get(ev.ownerId   as string) ?? null) : null;
      ev.createdByName = ev.createdBy ? (nameMap.get(ev.createdBy as string) ?? null) : null;
      return ev;
    });

    return { events, total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /calendar-events — create; ownerId = self; sharedWith = specified users
  app.post('/', { preHandler: app.requirePermission('calendar_events', 'create') }, async (req, reply) => {
    const db = app.mongo.db!;
    const {
      title, content = '', eventType = 'upcoming_event',
      startDate, endDate, singleDay = false, allDay = false,
      location = '', tags = [], status = 'active', visibility = 'private',
      sharedWith,
    } = req.body as Record<string, unknown>;

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!startDate) throw app.httpErrors.badRequest('Start date is required');

    const ownerOid   = new ObjectId(req.session.userId!);
    const sharedOids = parseSharedWith(sharedWith);
    const start      = new Date(startDate as string);
    const end        = singleDay ? new Date(startDate as string) : new Date((endDate ?? startDate) as string);
    const now        = new Date();

    const doc = {
      title:      (title as string).trim().slice(0, 200),
      content:    String(content),
      eventType:  String(eventType),
      startDate:  start,
      endDate:    end,
      singleDay:  Boolean(singleDay),
      allDay:     Boolean(allDay),
      location:   String(location),
      tags:       Array.isArray(tags) ? (tags as unknown[]).map(t => String(t).trim()).filter(Boolean) : [],
      status:     String(status),
      visibility: String(visibility),
      ownerId:    ownerOid,
      sharedWith: sharedOids,
      createdBy:  ownerOid,
      updatedBy:  null as ObjectId | null,
      createdAt:  now,
      updatedAt:  now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'calendar_event.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, eventType: doc.eventType, visibility: doc.visibility },
      ip: req.ip,
    });

    const eventDoc: CalendarEventDoc = { ...doc, _id: result.insertedId };
    dispatchNewEventNotifications(app, eventDoc).catch(
      err => app.log.error({ err }, '[calendar] notify error'),
    );

    reply.status(201);
    const ev = mapEvent({ ...doc, _id: result.insertedId } as Record<string, unknown>);
    const nameMap = await resolveNames(db, new Set([ev.ownerId as string].filter(Boolean)));
    ev.ownerName     = ev.ownerId ? (nameMap.get(ev.ownerId as string) ?? null) : null;
    ev.createdByName = ev.ownerName;
    return ev;
  });

  // GET /calendar-events/:id
  app.get('/:id', { preHandler: app.requirePermission('calendar_events', 'read') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Event not found');

    const ev = mapEvent(doc as Record<string, unknown>);
    const ids = new Set([ev.ownerId, ev.createdBy].filter(Boolean) as string[]);
    const nameMap = await resolveNames(db, ids);
    ev.ownerName     = ev.ownerId   ? (nameMap.get(ev.ownerId   as string) ?? null) : null;
    ev.createdByName = ev.createdBy ? (nameMap.get(ev.createdBy as string) ?? null) : null;
    return ev;
  });

  // PATCH /calendar-events/:id — partial update
  app.patch('/:id', { preHandler: app.requirePermission('calendar_events', 'update') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }

    const {
      title, content, eventType, startDate, endDate, singleDay,
      allDay, location, tags, status, visibility, sharedWith,
    } = req.body as Record<string, unknown>;

    const $set: Record<string, unknown> = {
      updatedBy: new ObjectId(req.session.userId!),
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      if (!(title as string).trim()) throw app.httpErrors.badRequest('Title cannot be empty');
      $set.title = (title as string).trim().slice(0, 200);
    }
    if (content    !== undefined) $set.content    = String(content);
    if (eventType  !== undefined) $set.eventType  = String(eventType);
    if (allDay     !== undefined) $set.allDay      = Boolean(allDay);
    if (location   !== undefined) $set.location   = String(location);
    if (tags       !== undefined) $set.tags        = (tags as unknown[]).map(t => String(t).trim()).filter(Boolean);
    if (status     !== undefined) $set.status      = String(status);
    if (visibility !== undefined) $set.visibility  = String(visibility);
    if (sharedWith !== undefined) $set.sharedWith  = parseSharedWith(sharedWith);

    if (startDate !== undefined) $set.startDate = new Date(startDate as string);
    if (endDate   !== undefined) $set.endDate   = new Date(endDate as string);
    if (singleDay !== undefined) {
      $set.singleDay = Boolean(singleDay);
      if (Boolean(singleDay)) {
        const start = $set.startDate as Date | undefined;
        if (start) $set.endDate = start;
      }
    }

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Event not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'calendar_event.update', resourceId: id,
      meta: { fields: Object.keys($set) }, ip: req.ip,
    });

    return { updated: true };
  });

  // DELETE /calendar-events/:id
  app.delete('/:id', { preHandler: app.requirePermission('calendar_events', 'delete') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }

    const result = await db.collection(COL).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Event not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'calendar_event.delete', resourceId: id, ip: req.ip,
    });

    reply.status(204);
  });
}

async function dispatchNewEventNotifications(app: FastifyInstance, event: CalendarEventDoc): Promise<void> {
  const db   = app.mongo.db!;
  const subs = await db.collection(SUBS).find({
    'notifyOn.newEvent': true,
    $or: [{ eventTypes: { $size: 0 } }, { eventTypes: event.eventType }],
  }).toArray();

  if (subs.length === 0) return;
  const recipientIds = subs.map((s: Record<string, unknown>) => s.userId as ObjectId);
  await notifyNewEvent(app, event, recipientIds);
}
