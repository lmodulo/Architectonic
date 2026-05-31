import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Messages', () => {
  let app: FastifyInstance;
  let aliceCookie: string;
  let bobCookie: string;
  let aliceId: ObjectId;
  let bobId: ObjectId;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    ({ userId: aliceId } = await createUser(getDb(), { username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'owner' }));
    ({ userId: bobId   } = await createUser(getDb(), { username: 'bob',   email: 'bob@t.com',   password: 'pw123456', role: 'contributor' }));

    aliceCookie = await loginAs(app, 'alice@t.com', 'pw123456');
    bobCookie   = await loginAs(app, 'bob@t.com',   'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  describe('POST /messages (compose)', () => {
    it('creates a new thread and returns 201', async () => {
      const res = await authedRequest(app, aliceCookie, {
        method: 'POST', url: '/messages',
        payload: { to: [bobId.toString()], subject: 'Hello Bob', body: '<p>Hi!</p>' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.threadId).toBeDefined();
      expect(body.messageId).toBeDefined();
    });

    it('creates message_state rows for sender (read) and recipient (unread)', async () => {
      const res = await authedRequest(app, aliceCookie, {
        method: 'POST', url: '/messages',
        payload: { to: [bobId.toString()], subject: 'State test', body: '<p>check state</p>' },
      });
      const { messageId } = res.json();

      const states = await getDb().collection('message_state').find({ messageId: new ObjectId(messageId) }).toArray();
      expect(states).toHaveLength(2);

      const senderState    = states.find(s => s.userId.toString() === aliceId.toString());
      const recipientState = states.find(s => s.userId.toString() === bobId.toString());

      expect(senderState!.read).toBe(true);
      expect(recipientState!.read).toBe(false);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/messages',
        payload: { to: [bobId.toString()], subject: 'X', body: 'X' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /messages/unread-count', () => {
    it('returns a count for authenticated user', async () => {
      // Send a message to bob so he has unread
      await authedRequest(app, aliceCookie, {
        method: 'POST', url: '/messages',
        payload: { to: [bobId.toString()], subject: 'Unread test', body: '<p>test</p>' },
      });

      const res = await authedRequest(app, bobCookie, { method: 'GET', url: '/messages/unread-count' });
      expect(res.statusCode).toBe(200);
      expect(typeof res.json().count).toBe('number');
    });
  });

  describe('GET /messages (inbox)', () => {
    it('returns inbox threads for authenticated user', async () => {
      const res = await authedRequest(app, bobCookie, { method: 'GET', url: '/messages' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.threads)).toBe(true);
      expect(typeof body.hasMore).toBe('boolean');
    });

    it('returns empty inbox for user with no received messages', async () => {
      await createUser(getDb(), { username: 'charlie', email: 'charlie@t.com', password: 'pw123456', role: 'viewer' });
      const charlieCookie = await loginAs(app, 'charlie@t.com', 'pw123456');

      const res = await authedRequest(app, charlieCookie, { method: 'GET', url: '/messages' });
      expect(res.statusCode).toBe(200);
      expect(res.json().threads).toHaveLength(0);
    });
  });

  describe('GET /messages/:threadId', () => {
    let threadId: string;

    beforeAll(async () => {
      const res = await authedRequest(app, aliceCookie, {
        method: 'POST', url: '/messages',
        payload: { to: [bobId.toString()], subject: 'Thread view test', body: '<p>content</p>' },
      });
      threadId = res.json().threadId;
    });

    it('participant can view the thread', async () => {
      const res = await authedRequest(app, aliceCookie, { method: 'GET', url: `/messages/${threadId}` });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
      expect(res.json()[0].subject).toBe('Thread view test');
    });

    it('viewing thread marks recipient messages as read', async () => {
      const before = await getDb().collection('message_state')
        .findOne({ userId: bobId, read: false });
      expect(before).not.toBeNull();

      await authedRequest(app, bobCookie, { method: 'GET', url: `/messages/${threadId}` });

      const msgIds = await getDb().collection('messages')
        .find({ threadId: new ObjectId(threadId) })
        .toArray()
        .then(ms => ms.map(m => m._id));

      const unread = await getDb().collection('message_state').countDocuments({
        userId: bobId, messageId: { $in: msgIds }, read: false,
      });
      expect(unread).toBe(0);
    });

    it('non-participant gets 403', async () => {
      await createUser(getDb(), { username: 'dave', email: 'dave@t.com', password: 'pw123456', role: 'viewer' });
      const daveCookie = await loginAs(app, 'dave@t.com', 'pw123456');

      const res = await authedRequest(app, daveCookie, { method: 'GET', url: `/messages/${threadId}` });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /messages/sent', () => {
    it('returns threads where user is sender', async () => {
      const res = await authedRequest(app, aliceCookie, { method: 'GET', url: '/messages/sent' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.threads)).toBe(true);
      expect(body.threads.length).toBeGreaterThan(0);
    });
  });
});
