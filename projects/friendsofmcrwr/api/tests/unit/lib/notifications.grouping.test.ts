import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getDb } from '../../helpers/db.js';
import { insertNew, upsertGrouped } from '../../../src/lib/notifications/grouping.js';
import type { NotificationPayload } from '../../../src/lib/notifications/dispatch.js';

const userId = new ObjectId();

describe('insertNew', () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(() => getDb().collection('notifications').deleteMany({}));

  it('inserts a notification and returns its _id', async () => {
    const payload: NotificationPayload = {
      userId,
      type: 'info',
      title: 'Test notification',
      body: 'Hello',
    };
    const id = await insertNew(getDb(), userId, payload, new Date());

    const doc = await getDb().collection('notifications').findOne({ _id: id });
    expect(doc).not.toBeNull();
    expect(doc!.title).toBe('Test notification');
    expect(doc!.body).toBe('Hello');
    expect(doc!.read).toBe(false);
    expect(doc!.groupKey).toBeNull();
    expect(doc!.delivered).toEqual({ websocket: false, email: false });
  });

  it('defaults body, link, source, and groupKey to null', async () => {
    const payload: NotificationPayload = { userId, type: 'info', title: 'Minimal' };
    const id = await insertNew(getDb(), userId, payload, new Date());

    const doc = await getDb().collection('notifications').findOne({ _id: id });
    expect(doc!.body).toBeNull();
    expect(doc!.link).toBeNull();
    expect(doc!.source).toBeNull();
    expect(doc!.groupKey).toBeNull();
  });
});

describe('upsertGrouped', () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(() => getDb().collection('notifications').deleteMany({}));

  it('creates a new notification when none exists with the groupKey', async () => {
    const payload: NotificationPayload = { userId, type: 'info', title: 'First', groupKey: 'g1' };
    await upsertGrouped(getDb(), userId, payload, new Date());

    const count = await getDb().collection('notifications').countDocuments({ userId, groupKey: 'g1' });
    expect(count).toBe(1);
  });

  it('updates the existing unread notification instead of creating a duplicate', async () => {
    const payload: NotificationPayload = { userId, type: 'info', title: 'Original', groupKey: 'g2' };
    await upsertGrouped(getDb(), userId, payload, new Date());

    const updated: NotificationPayload = { userId, type: 'info', title: 'Updated', groupKey: 'g2' };
    await upsertGrouped(getDb(), userId, updated, new Date());

    const all = await getDb().collection('notifications').find({ userId, groupKey: 'g2' }).toArray();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Updated');
  });

  it('creates a new notification when existing groupKey notification is already read', async () => {
    const payload: NotificationPayload = { userId, type: 'info', title: 'Read one', groupKey: 'g3' };
    const firstId = await upsertGrouped(getDb(), userId, payload, new Date());

    // Mark it read
    await getDb().collection('notifications').updateOne({ _id: firstId }, { $set: { read: true } });

    // Upsert again — should create new since old is read
    const payload2: NotificationPayload = { userId, type: 'info', title: 'New one', groupKey: 'g3' };
    const secondId = await upsertGrouped(getDb(), userId, payload2, new Date());

    expect(firstId.toString()).not.toBe(secondId.toString());
    const count = await getDb().collection('notifications').countDocuments({ userId, groupKey: 'g3' });
    expect(count).toBe(2);
  });
});
