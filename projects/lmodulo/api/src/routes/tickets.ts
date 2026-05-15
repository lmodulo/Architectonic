import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { storage } from '../lib/storage.js';
import { getSupportSprint } from '../lib/supportSprint.js';
import { logAudit } from '../lib/audit.js';
import { sendTicketNotificationEmail } from '../lib/email.js';

const COL = 'agile_jobs';

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function mapDoc(d: Record<string, unknown>) {
  return { ...d, id: (d._id as ObjectId).toString(), _id: undefined };
}

export default async function ticketsRoutes(app: FastifyInstance) {

  // GET /tickets — list support tickets (customers see their own; staff see all)
  app.get('/', { preHandler: app.requireAuth }, async (req) => {
    const db     = app.mongo.db!;
    const userId = new ObjectId(req.session.userId!);

    const sprint = await db.collection('agile_sprints').findOne({ title: 'Support' });
    if (!sprint) return { tickets: [], total: 0 };

    const userDoc = await db.collection('users').findOne({ _id: userId });
    const match: Record<string, unknown> = { sprintId: sprint._id };
    if (userDoc?.role === 'customer') match.createdBy = userId;

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'agile_tasks', localField: '_id', foreignField: 'jobId', as: 'tasks' } },
      {
        $addFields: {
          completionPct: {
            $cond: [
              { $gt: [{ $sum: '$tasks.estimateHours' }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $sum: {
                          $map: {
                            input: '$tasks', as: 't',
                            in: { $cond: [{ $eq: ['$$t.status', 'Done'] }, '$$t.estimateHours', 0] },
                          },
                        },
                      },
                      { $sum: '$tasks.estimateHours' },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          taskCount: { $size: '$tasks' },
        },
      },
      { $project: { tasks: 0 } },
      { $sort: { createdAt: -1 } },
    ];

    const docs = await db.collection(COL).aggregate(pipeline).toArray();
    return { tickets: docs.map(d => mapDoc(d as Record<string, unknown>)), total: docs.length };
  });

  // POST /tickets — create a support ticket (stored as an agile job)
  app.post('/', { preHandler: app.requireAuth }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const { title, description = '' } = req.body as Record<string, unknown>;

    if (!title || !(title as string).trim()) throw app.httpErrors.badRequest('Title is required');

    const { sprintId } = await getSupportSprint(db);

    const doc = {
      sprintId,
      title:            (title as string).trim(),
      description:      String(description),
      category:         'Bug',
      status:           'Backlog',
      blocked:          false,
      dependencyIds:    [] as ObjectId[],
      calendarEventIds: [] as ObjectId[],
      attachments:      [] as unknown[],
      startDate:        now,
      endDate:          null,
      createdBy:        new ObjectId(req.session.userId!),
      updatedBy:        null as ObjectId | null,
      createdAt:        now,
      updatedAt:        now,
    };

    const result = await db.collection(COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'ticket.create', resourceId: result.insertedId.toString(),
      meta: { title: doc.title }, ip: req.ip,
    });

    const staff = await db.collection('users').find({ role: { $in: ['owner', 'admin'] } }).toArray();
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const ticketUrl = `${appUrl}/folio/tickets`;
    for (const member of staff) {
      if (member.email) {
        sendTicketNotificationEmail(member.email as string, {
          ticketId:    result.insertedId.toString(),
          title:       doc.title,
          submittedBy: req.session.username!,
          ticketUrl,
        }).catch(console.error);
      }
    }

    reply.status(201);
    return mapDoc({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // POST /tickets/:id/attachments — upload a file to a ticket
  app.post('/:id/attachments', { preHandler: app.requireAuth }, async (req, reply) => {
    const db     = app.mongo.db!;
    const oid    = parseOid((req.params as { id: string }).id, app);
    const userId = new ObjectId(req.session.userId!);

    const userDoc = await db.collection('users').findOne({ _id: userId });
    const doc     = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Ticket not found');
    if (userDoc?.role === 'customer' && doc.createdBy?.toString() !== userId.toString()) {
      throw app.httpErrors.forbidden('Not your ticket');
    }

    const file = await req.file();
    if (!file) throw app.httpErrors.badRequest('No file uploaded');

    const buf  = await file.toBuffer();
    const safe = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';

    const existing = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === safe);
    if (existing?.url) await storage.remove(existing.url);

    const url = await storage.save(safe, buf, file.mimetype, `tickets/${oid.toString()}`);

    const attachment = {
      name:       safe,
      url,
      mimetype:   file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: userId,
    };

    const updated = [
      ...((doc.attachments ?? []) as any[]).filter((a: any) => a.name !== safe),
      attachment,
    ];

    await db.collection(COL).updateOne({ _id: oid }, { $set: { attachments: updated, updatedAt: new Date() } });

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'ticket.attachment_upload', resourceId: oid.toString(),
      meta: { filename: safe }, ip: req.ip,
    });

    reply.status(201);
    return { attachments: updated.map((a: any) => ({ ...a, uploadedBy: a.uploadedBy?.toString() })) };
  });

  // DELETE /tickets/:id/attachments/:filename
  app.delete('/:id/attachments/:filename', { preHandler: app.requireAuth }, async (req, reply) => {
    const db       = app.mongo.db!;
    const oid      = parseOid((req.params as { id: string; filename: string }).id, app);
    const filename = (req.params as { id: string; filename: string }).filename;
    const userId   = new ObjectId(req.session.userId!);

    const userDoc = await db.collection('users').findOne({ _id: userId });
    const doc     = await db.collection(COL).findOne({ _id: oid });
    if (!doc) throw app.httpErrors.notFound('Ticket not found');
    if (userDoc?.role === 'customer' && doc.createdBy?.toString() !== userId.toString()) {
      throw app.httpErrors.forbidden('Not your ticket');
    }

    const attachment = ((doc.attachments ?? []) as any[]).find((a: any) => a.name === filename);
    if (!attachment) throw app.httpErrors.notFound('Attachment not found');

    await storage.remove(attachment.url);
    await db.collection(COL).updateOne(
      { _id: oid },
      { $pull: { attachments: { name: filename } } as any, $set: { updatedAt: new Date() } }
    );

    reply.status(204);
  });
}
