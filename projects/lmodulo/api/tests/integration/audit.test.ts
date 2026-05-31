import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('GET /audit', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUser(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
    await createUser(getDb(), { username: 'viewer', email: 'viewer@t.com', password: 'pw123456', role: 'viewer' });

    ownerCookie  = await loginAs(app, 'owner@t.com', 'pw123456');
    viewerCookie = await loginAs(app, 'viewer@t.com', 'pw123456');

    // Seed audit log entries
    const now = new Date();
    await getDb().collection('audit_logs').insertMany([
      { userId: 'u1', username: 'alice', action: 'auth.login',  ip: '127.0.0.1', meta: {}, createdAt: new Date(now.getTime() - 3000) },
      { userId: 'u1', username: 'alice', action: 'auth.logout', ip: '127.0.0.1', meta: {}, createdAt: new Date(now.getTime() - 2000) },
      { userId: 'u2', username: 'bob',   action: 'user.invite', ip: '127.0.0.1', meta: {}, createdAt: new Date(now.getTime() - 1000) },
      { userId: 'u2', username: 'bob',   action: 'role.create', ip: '127.0.0.1', meta: {}, createdAt: now },
    ]);
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('owner can read audit log', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/audit' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.entries)).toBe(true);
    expect(typeof body.count).toBe('number');
    expect(body.entries[0]).toHaveProperty('action');
    expect(body.entries[0]).toHaveProperty('username');
  });

  it('viewer gets 403 (no audit:read)', async () => {
    const res = await authedRequest(app, viewerCookie, { method: 'GET', url: '/audit' });
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/audit' });
    expect(res.statusCode).toBe(401);
  });

  it('pagination: limit and skip work', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/audit?limit=2&skip=0' });
    expect(res.statusCode).toBe(200);
    expect(res.json().entries).toHaveLength(2);
  });

  it('filter by action prefix', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/audit?action=auth' });
    expect(res.statusCode).toBe(200);
    const entries: Array<{ action: string }> = res.json().entries;
    expect(entries.every(e => e.action.startsWith('auth.'))).toBe(true);
  });

  it('filter by username (q param, case-insensitive)', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/audit?q=BOB' });
    expect(res.statusCode).toBe(200);
    const entries: Array<{ username: string }> = res.json().entries;
    expect(entries.every(e => e.username.toLowerCase().includes('bob'))).toBe(true);
  });

  it('entries are sorted newest-first', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/audit' });
    const entries: Array<{ createdAt: string }> = res.json().entries;
    for (let i = 0; i < entries.length - 1; i++) {
      expect(new Date(entries[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(entries[i + 1].createdAt).getTime()
      );
    }
  });
});
