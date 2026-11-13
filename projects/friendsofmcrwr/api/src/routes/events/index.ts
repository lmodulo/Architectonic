import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const EVENTS = 'events';

export default async function eventsRoutes(app: FastifyInstance) {

  // GET /events/public — upcoming events, no auth required
  // Must be registered before /:id to take precedence
  app.get('/public', async () => {
    const db  = app.mongo.db!;
    const now = new Date();
    const max = new Date(now); max.setFullYear(max.getFullYear() + 1);

    const events = await db.collection(EVENTS)
      .find({ startDate: { $gt: now, $lt: max } })
      .sort({ startDate: 1 })
      .toArray();

    return events.map(e => ({
      id:        e._id.toString(),
      title:     e.title,
      content:   e.content,
      startDate: e.startDate,
      endDate:   e.endDate,
      singleDay: e.singleDay,
    }));
  });

  // GET /events — list all events with optional ?title= filter
  app.get('/', { preHandler: app.requireAuth }, async (req) => {
    const db = app.mongo.db!;
    const { title } = req.query as { title?: string };

    const filter: Record<string, unknown> = {};
    if (req.session.workspaceId) filter.workspaceId = new ObjectId(req.session.workspaceId);
    if (title?.trim()) filter.title = { $regex: title.trim(), $options: 'i' };

    const events = await db.collection(EVENTS)
      .find(filter)
      .sort({ startDate: 1 })
      .toArray();

    return events.map(e => ({
      id:        e._id.toString(),
      title:     e.title,
      content:   e.content,
      startDate: e.startDate,
      endDate:   e.endDate,
      singleDay: e.singleDay,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  });

  // POST /events — create
  app.post('/', { preHandler: app.requirePermission('events', 'create') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { title, content, startDate, endDate, singleDay } = req.body as Record<string, unknown>;

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!startDate) throw app.httpErrors.badRequest('Start date is required');

    const start = new Date(startDate as string);
    const end   = singleDay ? new Date(startDate as string) : new Date((endDate ?? startDate) as string);
    const now   = new Date();

    const doc = {
      title:       (title as string).trim(),
      content:     (content as string) ?? '',
      startDate:   start,
      endDate:     end,
      singleDay:   Boolean(singleDay),
      createdBy:   new ObjectId(req.session.userId!),
      workspaceId: req.session.workspaceId ? new ObjectId(req.session.workspaceId) : undefined,
      createdAt:   now,
      updatedAt:   now,
    };

    const result = await db.collection(EVENTS).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'event.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title }, ip: req.ip,
    });

    app.bus.fire('calendar.event.created', {
      event: { id: result.insertedId.toString(), title: doc.title, startDate: doc.startDate.toISOString(), endDate: doc.endDate.toISOString(), singleDay: doc.singleDay },
      createdBy: { id: req.session.userId!, username: req.session.username! }
    });

    reply.status(201);
    return { id: result.insertedId.toString(), ...doc, createdBy: req.session.userId! };
  });

  // PUT /events/:id — update
  app.put('/:id', { preHandler: app.requirePermission('events', 'update') }, async (req) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };
    const { title, content, startDate, endDate, singleDay } = req.body as Record<string, unknown>;

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid event ID'); }

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');
    if (!startDate) throw app.httpErrors.badRequest('Start date is required');

    const start = new Date(startDate as string);
    const end   = singleDay ? new Date(startDate as string) : new Date((endDate ?? startDate) as string);

    const update = {
      title:     (title as string).trim(),
      content:   (content as string) ?? '',
      startDate: start,
      endDate:   end,
      singleDay: Boolean(singleDay),
      updatedAt: new Date(),
    };

    const result = await db.collection(EVENTS).findOneAndUpdate(
      { _id: oid },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) throw app.httpErrors.notFound('Event not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'event.update', resourceId: id,
      meta: { title: update.title }, ip: req.ip,
    });

    return { id: result._id.toString(), ...update };
  });

  // DELETE /events/:id
  app.delete('/:id', { preHandler: app.requirePermission('events', 'delete') }, async (req, reply) => {
    const db = app.mongo.db!;
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid event ID'); }

    const result = await db.collection(EVENTS).deleteOne({ _id: oid });
    if (result.deletedCount === 0) throw app.httpErrors.notFound('Event not found');

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'event.delete', resourceId: id, ip: req.ip,
    });

    reply.status(204);
  });
}
