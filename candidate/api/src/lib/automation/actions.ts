import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { dispatch } from '../notifications/dispatch.js';

export async function executeAction(
  app:    FastifyInstance,
  type:   string,
  params: Record<string, unknown>
): Promise<void> {
  switch (type) {
    case 'notification.send':      return notificationSend(app, params);
    case 'message.send':           return messageSend(app, params);
    case 'calendar.event.create':  return calendarEventCreate(app, params);
    default: throw new Error(`Unknown action type: ${type}`);
  }
}

async function notificationSend(app: FastifyInstance, params: Record<string, unknown>): Promise<void> {
  const db = app.mongo.db!;

  let recipients: ObjectId[];
  if (Array.isArray(params.userIds)) {
    recipients = (params.userIds as string[]).map(id => new ObjectId(id));
  } else if (params.userId) {
    recipients = [new ObjectId(params.userId as string)];
  } else {
    // Default: all admins/owners
    const admins = await db.collection('users')
      .find({ role: { $in: ['admin', 'owner'] } }, { projection: { _id: 1 } })
      .toArray();
    recipients = admins.map(a => a._id as ObjectId);
  }

  if (!recipients.length) return;

  await dispatch(app, {
    userId:   recipients.length === 1 ? recipients[0] : recipients,
    type:     (params.type    as string) ?? 'automation',
    title:    (params.title   as string) ?? 'Automation notification',
    body:     (params.body    as string) ?? undefined,
    link:     (params.link    as string) ?? undefined,
    groupKey: (params.groupKey as string) ?? undefined,
  });
}

async function messageSend(app: FastifyInstance, params: Record<string, unknown>): Promise<void> {
  const db  = app.mongo.db!;
  const now = new Date();

  // Resolve sender — default to earliest owner/admin
  let fromId: ObjectId;
  if (params.from) {
    fromId = new ObjectId(params.from as string);
  } else {
    const sender = await db.collection('users').findOne(
      { role: { $in: ['owner', 'admin'] } },
      { sort: { createdAt: 1 } }
    );
    if (!sender) return;
    fromId = sender._id as ObjectId;
  }

  // Resolve recipients
  let toIds: ObjectId[];
  if (Array.isArray(params.to)) {
    toIds = (params.to as string[]).map(id => new ObjectId(id));
  } else if (params.to) {
    toIds = [new ObjectId(params.to as string)];
  } else {
    return;
  }

  const threadId = new ObjectId();
  const result = await db.collection('messages').insertOne({
    threadId,
    subject:   (params.subject as string) ?? '(no subject)',
    from:      fromId,
    to:        toIds,
    cc:        [],
    body:      (params.body as string) ?? '',
    createdAt: now,
    updatedAt: now,
  });

  const states = toIds.map(uid => ({
    messageId: result.insertedId,
    userId:    uid,
    read:      false,
    readAt:    null,
    archived:  false,
    deleted:   false,
  }));
  if (states.length) await db.collection('message_state').insertMany(states);
}

async function calendarEventCreate(app: FastifyInstance, params: Record<string, unknown>): Promise<void> {
  const db  = app.mongo.db!;
  const now = new Date();

  let createdBy: ObjectId;
  if (params.createdBy) {
    createdBy = new ObjectId(params.createdBy as string);
  } else {
    const owner = await db.collection('users').findOne(
      { role: { $in: ['owner', 'admin'] } },
      { sort: { createdAt: 1 } }
    );
    if (!owner) return;
    createdBy = owner._id as ObjectId;
  }

  const startDate = params.startDate ? new Date(params.startDate as string) : now;
  const endDate   = params.endDate   ? new Date(params.endDate   as string) : startDate;

  await db.collection('events').insertOne({
    title:     (params.title   as string) ?? 'Automated Event',
    content:   (params.content as string) ?? '',
    startDate,
    endDate,
    singleDay: !params.endDate,
    createdBy,
    createdAt: now,
    updatedAt: now,
  });
}
