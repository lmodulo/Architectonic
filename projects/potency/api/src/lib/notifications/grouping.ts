import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';
import type { NotificationPayload } from './dispatch.js';

const COLL = 'notifications';

export async function insertNew(db: Db, userId: ObjectId, payload: NotificationPayload, now: Date): Promise<ObjectId> {
  const id = new ObjectId();
  await db.collection(COLL).insertOne({
    _id: id,
    userId,
    type:     payload.type,
    title:    payload.title,
    body:     payload.body    ?? null,
    link:     payload.link    ?? null,
    read:     false,
    readAt:   null,
    createdAt: now,
    source:   payload.source  ?? null,
    groupKey: payload.groupKey ?? null,
    delivered: { websocket: false, email: false },
  });
  return id;
}

export async function upsertGrouped(
  db: Db,
  userId: ObjectId,
  payload: NotificationPayload,
  now: Date
): Promise<ObjectId> {
  const existing = await db.collection(COLL).findOne({
    userId,
    groupKey: payload.groupKey,
    read: false,
  });

  if (existing) {
    await db.collection(COLL).updateOne(
      { _id: existing._id },
      { $set: { title: payload.title, body: payload.body ?? null, createdAt: now } }
    );
    return existing._id as ObjectId;
  }

  return insertNew(db, userId, payload, now);
}
