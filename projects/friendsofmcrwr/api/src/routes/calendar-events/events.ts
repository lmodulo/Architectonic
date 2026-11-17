import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { notifyNewEvent, type CalendarEventDoc } from '../../lib/calendarNotify.js';
import { attachMedia, deleteEventMedia, publicMedia, resolveMedia, type EventMedia } from './media.js';

const COL  = 'calendar_events';
const SUBS = 'event_subscriptions';

function mapEvent(d: Record<string, unknown>) {
  return { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
}

// Times are wall-clock "HH:MM" (24-hour) at the event's place, with no time zone, beside the date-only
// startDate/endDate: startTime is on the start date and endTime on the end date. Both are null for an all-day
// event; endTime is optional ("starts at 7 PM").
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

type HttpErrors = { httpErrors: { badRequest: (message?: string) => Error } };

function parseTime(app: HttpErrors, v: unknown, label: string): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !TIME.test(v)) throw app.httpErrors.badRequest(`${label} must be a time like 09:30`);
  return v;
}

/** The stored times for these settings, checked: none when all day, and an end after the start on a one-day event. */
function eventTimes(
  app: HttpErrors,
  e: { allDay: boolean; startTime: unknown; endTime: unknown; start: Date; end: Date },
): { startTime: string | null; endTime: string | null } {
  if (e.allDay) return { startTime: null, endTime: null };
  const startTime = parseTime(app, e.startTime, 'Start time');
  const endTime = startTime ? parseTime(app, e.endTime, 'End time') : null;
  const oneDay = e.end.getTime() <= e.start.getTime();
  if (startTime && endTime && oneDay && endTime <= startTime) {
    throw app.httpErrors.badRequest('End time must be after the start time');
  }
  return { startTime, endTime };
}

export default async function calendarEventsRoutes(app: FastifyInstance) {

  // GET /calendar-events/public — no auth, public events that haven't ended yet, soonest first
  // Must be registered before /:id
  app.get('/public', async (req) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const max = new Date(now); max.setFullYear(max.getFullYear() + 1);
    const { type, from, to } = req.query as { type?: string; from?: string; to?: string };

    const filter: Record<string, unknown> = {
      status:     'active',
      visibility: 'public',
      startDate:  { $lt: to ? new Date(to) : max },
    };
    if (from) {
      // An explicit range: events starting after `from`
      (filter.startDate as Record<string, unknown>).$gt = new Date(from);
    } else {
      // Events are date-only, stored at UTC midnight with no time zone, so an event stays listed until its
      // last day is over everywhere ("anywhere on Earth", UTC-12): 36 hours after that day's UTC midnight.
      // In-progress and same-day events therefore stay listed; nobody sees one drop off before its day ends.
      const ended = new Date(now.getTime() - 36 * 60 * 60 * 1000);
      filter.$or = [
        { endDate: { $gt: ended } },
        { endDate: null, startDate: { $gt: ended } },
      ];
    }
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
      startTime: e.allDay ? null : e.startTime ?? null,
      endTime:   e.allDay ? null : e.endTime ?? null,
      location:  e.location ?? '',
      tags:      e.tags ?? [],
      // Photos and videos: what a visitor needs to show them (not the uploader's file names)
      media:     ((e.media ?? []) as EventMedia[]).map(m => ({ id: m.id, kind: m.kind, url: m.url })),
    }));
  });

  // GET /calendar-events — authenticated list with filters
  app.get('/', { preHandler: app.requirePermission('calendar_events', 'read') }, async (req) => {
    const db = app.mongo.db!;
    const { type, status, visibility, search, from, to, limit = '50', skip = '0' } =
      req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
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

    return { events: docs.map(mapEvent), total, skip: Number(skip), limit: Number(limit) };
  });

  // POST /calendar-events — create
  app.post('/', { preHandler: app.requirePermission('calendar_events', 'create') }, async (req, reply) => {
    const db = app.mongo.db!;
    const {
      title, content = '', eventType = 'upcoming_event',
      startDate, endDate, singleDay = false, allDay = false, startTime, endTime,
      location = '', tags = [], status = 'active', visibility = 'public', media = [],
    } = req.body as Record<string, unknown>;

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!startDate) throw app.httpErrors.badRequest('Start date is required');
    const userId = new ObjectId(req.session.userId!);
    const mediaDocs = await resolveMedia(app, media, null, userId);

    const start = new Date(startDate as string);
    const end   = singleDay ? new Date(startDate as string) : new Date((endDate ?? startDate) as string);
    const now   = new Date();
    const times = eventTimes(app, { allDay: Boolean(allDay), startTime, endTime, start, end });

    const doc = {
      title:      (title as string).trim().slice(0, 200),
      content:    String(content),
      eventType:  String(eventType),
      startDate:  start,
      endDate:    end,
      singleDay:  Boolean(singleDay),
      allDay:     Boolean(allDay),
      startTime:  times.startTime,
      endTime:    times.endTime,
      location:   String(location),
      tags:       Array.isArray(tags) ? (tags as unknown[]).map(t => String(t).trim()).filter(Boolean) : [],
      status:     String(status),
      visibility: String(visibility),
      media:      mediaDocs.map(publicMedia),
      createdBy:  userId,
      updatedBy:  null as ObjectId | null,
      createdAt:  now,
      updatedAt:  now,
    };

    const result = await db.collection(COL).insertOne(doc);
    await attachMedia(db, result.insertedId, mediaDocs);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'calendar_event.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title, eventType: doc.eventType }, ip: req.ip,
    });

    const eventDoc: CalendarEventDoc = { ...doc, _id: result.insertedId };
    dispatchNewEventNotifications(app, eventDoc).catch(
      err => app.log.error({ err }, '[calendar] notify error'),
    );

    reply.status(201);
    return mapEvent({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /calendar-events/:id
  app.get('/:id', { preHandler: app.requirePermission('calendar_events', 'read') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
    const doc = await db.collection(COL).findOne({ _id: oid });
    if (!doc) return reply.notFound('Event not found');
    return mapEvent(doc as Record<string, unknown>);
  });

  // PATCH /calendar-events/:id — partial update
  app.patch('/:id', { preHandler: app.requirePermission('calendar_events', 'update') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };
    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }

    const {
      title, content, eventType, startDate, endDate, singleDay,
      allDay, startTime, endTime, location, tags, status, visibility, media,
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

    if (startDate !== undefined) $set.startDate = new Date(startDate as string);
    if (endDate   !== undefined) $set.endDate   = new Date(endDate as string);
    if (singleDay !== undefined) {
      $set.singleDay = Boolean(singleDay);
      if (Boolean(singleDay)) {
        const start = $set.startDate as Date | undefined ?? undefined;
        if (start) $set.endDate = start;
      }
    }

    // The times depend on All day and the dates, so they're checked against the event as it will be after this update
    if ([allDay, startTime, endTime, startDate, endDate, singleDay].some(v => v !== undefined)) {
      const current = await db.collection(COL).findOne(
        { _id: oid },
        { projection: { startDate: 1, endDate: 1, singleDay: 1, allDay: 1, startTime: 1, endTime: 1 } },
      );
      if (!current) return reply.notFound('Event not found');
      const start = ($set.startDate as Date | undefined) ?? (current.startDate as Date);
      const single = singleDay !== undefined ? Boolean(singleDay) : Boolean(current.singleDay);
      const end = single ? start : ($set.endDate as Date | undefined) ?? (current.endDate as Date | null) ?? start;
      Object.assign($set, eventTimes(app, {
        allDay:    allDay !== undefined ? Boolean(allDay) : Boolean(current.allDay),
        startTime: startTime !== undefined ? startTime : current.startTime,
        endTime:   endTime !== undefined ? endTime : current.endTime,
        start, end,
      }));
    }

    // The photos and videos it keeps, in order (checked before anything is written)
    const mediaDocs = media !== undefined
      ? await resolveMedia(app, media, oid, new ObjectId(req.session.userId!))
      : null;
    if (mediaDocs) $set.media = mediaDocs.map(publicMedia);

    const result = await db.collection(COL).updateOne({ _id: oid }, { $set });
    if (result.matchedCount === 0) return reply.notFound('Event not found');
    if (mediaDocs) await attachMedia(db, oid, mediaDocs);

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
    await deleteEventMedia(db, oid);

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
