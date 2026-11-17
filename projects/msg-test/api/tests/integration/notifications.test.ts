import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUserAndWorkspace } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('GET /notifications', () => {
  let app: FastifyInstance;
  let cookie: string;
  let userId: ObjectId;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    ({ userId } = await createUserAndWorkspace(getDb(), { username: 'notifuser', email: 'notif@t.com', password: 'pw123456', role: 'owner' }));
    cookie = await loginAs(app, 'notif@t.com', 'pw123456');

    // Seed notifications
    await getDb().collection('notifications').insertMany([
      { userId, type: 'info', title: 'First',  read: false, createdAt: new Date(Date.now() - 2000), body: null, link: null, readAt: null },
      { userId, type: 'info', title: 'Second', read: true,  createdAt: new Date(Date.now() - 1000), body: null, link: null, readAt: new Date() },
    ]);
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('returns paginated notifications for the authenticated user', async () => {
    const res = await authedRequest(app, cookie, { method: 'GET', url: '/notifications' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
  });

  it('filter=unread returns only unread notifications', async () => {
    const res = await authedRequest(app, cookie, { method: 'GET', url: '/notifications?filter=unread' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.every((n: { read: boolean }) => !n.read)).toBe(true);
    expect(body.total).toBe(1);
  });

  it('unauthenticated gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/notifications' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /notifications/unread-count', () => {
  let app: FastifyInstance;
  let cookie: string;
  let userId: ObjectId;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    ({ userId } = await createUserAndWorkspace(getDb(), { username: 'countuser', email: 'count@t.com', password: 'pw123456', role: 'owner' }));
    cookie = await loginAs(app, 'count@t.com', 'pw123456');

    await getDb().collection('notifications').insertMany([
      { userId, type: 'info', title: 'Unread 1', read: false, createdAt: new Date(), body: null, link: null, readAt: null },
      { userId, type: 'info', title: 'Unread 2', read: false, createdAt: new Date(), body: null, link: null, readAt: null },
      { userId, type: 'info', title: 'Read',     read: true,  createdAt: new Date(), body: null, link: null, readAt: new Date() },
    ]);
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('returns correct unread count', async () => {
    const res = await authedRequest(app, cookie, { method: 'GET', url: '/notifications/unread-count' });
    expect(res.statusCode).toBe(200);
    expect(res.json().count).toBe(2);
  });
});

describe('GET /notifications/preferences + PUT /notifications/preferences', () => {
  let app: FastifyInstance;
  let cookie: string;
  let userId: ObjectId;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    ({ userId } = await createUserAndWorkspace(getDb(), { username: 'prefsuser', email: 'prefs@t.com', password: 'pw123456', role: 'owner' }));
    cookie = await loginAs(app, 'prefs@t.com', 'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('GET returns default prefs when none exist (auto-creates)', async () => {
    const res = await authedRequest(app, cookie, { method: 'GET', url: '/notifications/preferences' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.muted).toEqual([]);
    expect(body.channels).toBeDefined();
    expect(body.quiet).toBeDefined();

    // Should be persisted now
    const prefs = await getDb().collection('notification_preferences').findOne({ userId });
    expect(prefs).not.toBeNull();
  });

  it('PUT updates preferences', async () => {
    const res = await authedRequest(app, cookie, {
      method: 'PUT', url: '/notifications/preferences',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ muted: ['comment.added'] }),
    });
    expect(res.statusCode).toBe(200);

    const prefs = await getDb().collection('notification_preferences').findOne({ userId });
    expect(prefs!.muted).toContain('comment.added');
  });
});
