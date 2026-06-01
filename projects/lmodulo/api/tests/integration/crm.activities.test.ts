import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('CRM — Activities tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let activityId: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    await createUser(getDb(), { username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'admin' });
    await createUser(getDb(), { username: 'bob',   email: 'bob@t.com',   password: 'pw123456', role: 'contributor' });

    adminCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /crm/activities ───────────────────────────────────────────────────

  describe('GET /crm/activities', () => {
    it('returns 200 with empty list when no activities exist', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/activities' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.activities)).toBe(true);
      expect(body.activities).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/crm/activities' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read activities', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/crm/activities' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /crm/activities ──────────────────────────────────────────────────

  describe('POST /crm/activities', () => {
    it('creates an activity and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Call', title: 'Discovery call', body: 'Discussed requirements' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.type).toBe('Call');
      expect(body.title).toBe('Discovery call');
      expect(body.body).toBe('Discussed requirements');
      activityId = body.id;
    });

    it('creates activity with entityType and entityId', async () => {
      const fakeId = new ObjectId().toString();
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Meeting', title: 'Kickoff', entityType: 'company', entityId: fakeId },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.entityType).toBe('company');
      expect(body.entityId).toBe(fakeId);
    });

    it('creates activity with scheduledAt', async () => {
      const scheduled = new Date(Date.now() + 86400000).toISOString();
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Task', title: 'Follow up', scheduledAt: scheduled },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().scheduledAt).toBeDefined();
    });

    it('contributor can create activities', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Note', title: 'Contributor note' },
      });
      expect(res.statusCode).toBe(201);
    });

    it('rejects missing type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { title: 'No type' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Fax', title: 'Old school' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing title with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Email' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank title with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Email', title: '   ' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid entityType with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Email', title: 'X', entityType: 'invoice' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Call', title: 'X' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /crm/activities (with data) ───────────────────────────────────────

  describe('GET /crm/activities (with data)', () => {
    it('returns activities list with id (no _id)', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/activities' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.activities.length).toBeGreaterThan(0);
      const a = body.activities[0];
      expect(a.id).toBeDefined();
      expect(a._id).toBeUndefined();
    });

    it('filters by type', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/activities?type=Call',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.activities.every((a: any) => a.type === 'Call')).toBe(true);
    });

    it('filters by entityType', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/activities?entityType=company',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.activities.every((a: any) => a.entityType === 'company')).toBe(true);
    });

    it('filters open=true returns only activities without completedAt', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/activities?open=true',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.activities.every((a: any) => !a.completedAt)).toBe(true);
    });

    it('respects limit and skip pagination', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/activities?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().activities).toHaveLength(1);
    });
  });

  // ── GET /crm/activities/:id ───────────────────────────────────────────────

  describe('GET /crm/activities/:id', () => {
    it('returns the activity by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/activities/${activityId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(activityId);
      expect(body.title).toBe('Discovery call');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/activities/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/activities/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/crm/activities/${activityId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /crm/activities/:id ─────────────────────────────────────────────

  describe('PATCH /crm/activities/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/activities/${activityId}`,
        payload: { title: 'Updated discovery call', outcome: 'Productive' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/activities/${activityId}`,
      });
      const body = res.json();
      expect(body.title).toBe('Updated discovery call');
      expect(body.outcome).toBe('Productive');
    });

    it('mark-complete by setting completedAt', async () => {
      const now = new Date().toISOString();
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/activities/${activityId}`,
        payload: { completedAt: now },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/activities/${activityId}`,
      });
      expect(get.json().completedAt).toBeDefined();
    });

    it('completed activity excluded from open=true filter', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/activities?open=true',
      });
      const ids = res.json().activities.map((a: any) => a.id);
      expect(ids).not.toContain(activityId);
    });

    it('rejects invalid type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/activities/${activityId}`,
        payload: { type: 'Telegram' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/activities/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor can update activities', async () => {
      const create = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Email', title: 'Contributor activity' },
      });
      const id = create.json().id;

      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/crm/activities/${id}`,
        payload: { title: 'Contributor updated' },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── DELETE /crm/activities/:id ────────────────────────────────────────────

  describe('DELETE /crm/activities/:id', () => {
    it('contributor cannot delete activities (403)', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Demo', title: 'Perm check' },
      });
      const checkId = create.json().id;

      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/crm/activities/${checkId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes an activity and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/activities',
        payload: { type: 'Task', title: 'To Delete' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/activities/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for already-deleted activity', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/activities/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
