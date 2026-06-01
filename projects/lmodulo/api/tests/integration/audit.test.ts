import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Audit Log', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    await createUser(getDb(), { username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'admin' });
    await createUser(getDb(), { username: 'bob',   email: 'bob@t.com',   password: 'pw123456', role: 'contributor' });

    adminCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');

    // Seed entries with distinct usernames (charlie/Diana) so they don't collide
    // with auth.login entries that loginAs writes for alice and bob.
    const db  = getDb();
    const now = Date.now();
    await db.collection('audit_logs').insertMany([
      {
        userId:     new ObjectId().toString(),
        username:   'charlie',
        action:     'invoice.create',
        resourceId: 'res-1',
        meta:       { amount: 100 },
        ip:         '127.0.0.1',
        createdAt:  new Date(now - 3000),
      },
      {
        userId:     new ObjectId().toString(),
        username:   'charlie',
        action:     'invoice.update',
        resourceId: 'res-1',
        meta:       {},
        ip:         '127.0.0.1',
        createdAt:  new Date(now - 2000),
      },
      {
        userId:     new ObjectId().toString(),
        username:   'Diana',
        action:     'contact.delete',
        resourceId: null,
        meta:       {},
        ip:         '10.0.0.1',
        createdAt:  new Date(now - 1000),
      },
    ]);
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /audit — auth & permissions ──────────────────────────────────────

  describe('GET /audit — auth & permissions', () => {
    it('returns 200 with entries and count for admin', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.entries)).toBe(true);
      expect(typeof body.count).toBe('number');
      expect(body.entries.length).toBeGreaterThan(0);
      expect(body.count).toBeGreaterThan(0);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/audit' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor returns 403 (no audit.read permission)', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/audit' });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /audit — response shape ───────────────────────────────────────────

  describe('GET /audit — response shape', () => {
    it('entries have id (not _id) and all expected fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice',
      });
      const entry = res.json().entries[0];
      expect(entry.id).toBeDefined();
      expect(entry._id).toBeUndefined();
      expect(entry.userId).toBeDefined();
      expect(entry.username).toBeDefined();
      expect(entry.action).toBeDefined();
      expect('resourceId' in entry).toBe(true);
      expect('meta' in entry).toBe(true);
      expect('ip' in entry).toBe(true);
      expect(entry.createdAt).toBeDefined();
    });

    it('null resourceId is returned as null, not undefined', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=contact',
      });
      expect(res.json().entries[0].resourceId).toBeNull();
    });

    it('meta object is preserved on the entry', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice',
      });
      const create = res.json().entries.find((e: any) => e.action === 'invoice.create');
      expect(create).toBeDefined();
      expect(create.meta).toEqual({ amount: 100 });
    });

    it('defaults to createdAt desc sort — newest entry first', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice',
      });
      const entries = res.json().entries;
      expect(entries).toHaveLength(2);
      const dates = entries.map((e: any) => new Date(e.createdAt).getTime());
      expect(dates[0]).toBeGreaterThan(dates[1]);
    });

    it('count equals total matching documents (unaffected by limit)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&limit=1',
      });
      const { entries, count } = res.json();
      expect(entries).toHaveLength(1);
      expect(count).toBe(2);
    });
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  describe('GET /audit — pagination', () => {
    it('limit=1 returns one entry', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&limit=1',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(1);
    });

    it('skip=1 skips the first result', async () => {
      const all   = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?action=invoice' });
      const paged = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?action=invoice&skip=1' });
      expect(paged.json().entries[0].id).toBe(all.json().entries[1].id);
    });

    it('limit larger than collection returns all matching entries', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&limit=999',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(2);
    });

    it('skip past end returns empty entries but correct count', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&skip=100',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(0);
      expect(res.json().count).toBe(2);
    });
  });

  // ── action filter ─────────────────────────────────────────────────────────

  describe('GET /audit — action filter', () => {
    it('action=invoice returns only invoice.* entries with exact count', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?action=invoice' });
      expect(res.statusCode).toBe(200);
      const { entries, count } = res.json();
      expect(count).toBe(2);
      expect(entries.every((e: any) => e.action.startsWith('invoice.'))).toBe(true);
    });

    it('action=contact returns only contact.* entries', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?action=contact' });
      const { entries, count } = res.json();
      expect(count).toBe(1);
      expect(entries[0].action).toBe('contact.delete');
    });

    it('action filter does not match entries without the dot separator', async () => {
      // 'invoice' must NOT match 'invoicePlus.create' — the regex anchors to prefix + dot
      await getDb().collection('audit_logs').insertOne({
        userId: new ObjectId().toString(), username: 'test',
        action: 'invoicePlus.create', resourceId: null, meta: {}, ip: null,
        createdAt: new Date(),
      });
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?action=invoice' });
      const actions: string[] = res.json().entries.map((e: any) => e.action);
      expect(actions.every(a => a.startsWith('invoice.'))).toBe(true);
    });

    it('action=nonexistent returns empty entries with count 0', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?action=nonexistent' });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(0);
      expect(res.json().count).toBe(0);
    });
  });

  // ── username search (q) ───────────────────────────────────────────────────

  describe('GET /audit — q (username search)', () => {
    it('q=charlie returns only charlie entries', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?q=charlie' });
      expect(res.statusCode).toBe(200);
      const { entries, count } = res.json();
      expect(count).toBe(2);
      expect(entries.every((e: any) => e.username === 'charlie')).toBe(true);
    });

    it('q search is case-insensitive (diana matches Diana)', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?q=diana' });
      const { entries, count } = res.json();
      expect(count).toBe(1);
      expect(entries[0].username).toBe('Diana');
    });

    it('q is a partial match (char matches charlie)', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?q=char' });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries.every((e: any) => e.username === 'charlie')).toBe(true);
    });

    it('q with no matches returns empty entries with count 0', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/audit?q=zzznobody' });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(0);
      expect(res.json().count).toBe(0);
    });
  });

  // ── sort ──────────────────────────────────────────────────────────────────

  describe('GET /audit — sort', () => {
    it('sortDir=asc returns oldest entry first', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&sortDir=asc',
      });
      expect(res.statusCode).toBe(200);
      const entries = res.json().entries;
      expect(entries).toHaveLength(2);
      const dates = entries.map((e: any) => new Date(e.createdAt).getTime());
      expect(dates[0]).toBeLessThan(dates[1]);
    });

    it('sort=username&sortDir=asc orders entries alphabetically', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?q=charlie&sort=username&sortDir=asc',
      });
      expect(res.statusCode).toBe(200);
      const usernames: string[] = res.json().entries.map((e: any) => e.username);
      const sorted = [...usernames].sort();
      expect(usernames).toEqual(sorted);
    });

    it('sort=action&sortDir=asc orders entries by action field', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?q=charlie&sort=action&sortDir=asc',
      });
      expect(res.statusCode).toBe(200);
      const actions: string[] = res.json().entries.map((e: any) => e.action);
      const sorted = [...actions].sort();
      expect(actions).toEqual(sorted);
    });

    it('sort=ip is a recognised sort field (no error)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&sort=ip',
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json().entries)).toBe(true);
    });

    it('unrecognised sort field falls back to createdAt (no error, still 200)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?sort=badField',
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json().entries)).toBe(true);
    });
  });

  // ── combined filters ──────────────────────────────────────────────────────

  describe('GET /audit — combined filters', () => {
    it('action + q returns the intersection', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&q=charlie',
      });
      expect(res.statusCode).toBe(200);
      const { entries, count } = res.json();
      expect(count).toBe(2);
      expect(entries.every((e: any) =>
        e.action.startsWith('invoice.') && e.username === 'charlie'
      )).toBe(true);
    });

    it('action + q with no overlap returns empty list with count 0', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=contact&q=charlie',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(0);
      expect(res.json().count).toBe(0);
    });

    it('action + sortDir=asc + limit=1 returns the earliest matching entry', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/audit?action=invoice&sortDir=asc&limit=1',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().entries).toHaveLength(1);
      expect(res.json().entries[0].action).toBe('invoice.create');
    });
  });
});
