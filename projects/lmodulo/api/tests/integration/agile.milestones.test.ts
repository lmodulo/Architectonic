import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Agile — Milestones (Overview tab)', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let contributorCookie: string;
  let milestoneId: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    await createUser(getDb(), { username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'owner' });
    await createUser(getDb(), { username: 'bob',   email: 'bob@t.com',   password: 'pw123456', role: 'contributor' });

    ownerCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /agile/milestones ──────────────────────────────────────────────────

  describe('GET /agile/milestones', () => {
    it('returns 200 with empty list when no milestones exist', async () => {
      const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/agile/milestones' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.milestones)).toBe(true);
      expect(body.milestones).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/agile/milestones' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read milestones', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/agile/milestones' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /agile/milestones ─────────────────────────────────────────────────

  describe('POST /agile/milestones', () => {
    it('creates a milestone and returns 201 with rollup fields', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'Alpha Release', priority: 'High', status: 'Planning' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Alpha Release');
      expect(body.priority).toBe('High');
      expect(body.status).toBe('Planning');
      milestoneId = body.id;
    });

    it('defaults priority to Medium and status to Planning', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'Beta Release' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.priority).toBe('Medium');
      expect(body.status).toBe('Planning');
    });

    it('rejects missing title with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { priority: 'High' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank title with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: '   ' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'X', status: 'InvalidStatus' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid priority with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'X', priority: 'Extreme' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects endDate before startDate with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'X', startDate: '2026-06-10', endDate: '2026-06-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor without create permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'Should fail' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'X' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /agile/milestones (with data) ─────────────────────────────────────

  describe('GET /agile/milestones (with data)', () => {
    it('returns created milestones with rollup stats', async () => {
      const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/agile/milestones' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.milestones.length).toBeGreaterThan(0);
      const m = body.milestones[0];
      expect(m.id).toBeDefined();
      expect(m._id).toBeUndefined();
      expect(typeof m.sprintCount).toBe('number');
      expect(typeof m.jobCount).toBe('number');
      expect(typeof m.taskCount).toBe('number');
      expect(typeof m.completionPct).toBe('number');
    });

    it('filters by status', async () => {
      // Create an Active milestone to ensure filter works
      await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'Active MS', status: 'Active' },
      });

      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: '/agile/milestones?status=Active',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.milestones.every((m: any) => m.status === 'Active')).toBe(true);
    });

    it('respects limit and skip pagination', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: '/agile/milestones?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().milestones).toHaveLength(1);
    });
  });

  // ── GET /agile/milestones/:id ──────────────────────────────────────────────

  describe('GET /agile/milestones/:id', () => {
    it('returns the milestone with rollup stats', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/milestones/${milestoneId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(milestoneId);
      expect(body.title).toBe('Alpha Release');
      expect(typeof body.completionPct).toBe('number');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const fakeId = new ObjectId().toString();
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/milestones/${fakeId}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: '/agile/milestones/not-a-valid-id',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/agile/milestones/${milestoneId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /agile/milestones/:id ────────────────────────────────────────────

  describe('PATCH /agile/milestones/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/milestones/${milestoneId}`,
        payload: { title: 'Alpha Release v2', status: 'Active' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists the updated fields', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/milestones/${milestoneId}`,
      });
      expect(res.json().title).toBe('Alpha Release v2');
      expect(res.json().status).toBe('Active');
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/milestones/${milestoneId}`,
        payload: { status: 'NotAStatus' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid priority with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/milestones/${milestoneId}`,
        payload: { priority: 'Extreme' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank title with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/milestones/${milestoneId}`,
        payload: { title: '   ' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('blocks Completed when sprints are not Completed', async () => {
      // Insert an incomplete sprint directly
      await getDb().collection('agile_sprints').insertOne({
        _id:         new ObjectId(),
        milestoneId: new ObjectId(milestoneId),
        title:       'Sprint 1',
        sprintNumber: 1,
        status:      'Active',
        createdAt:   new Date(),
        updatedAt:   new Date(),
      });

      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/milestones/${milestoneId}`,
        payload: { status: 'Completed' },
      });
      expect(res.statusCode).toBe(409);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/milestones/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without update permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/agile/milestones/${milestoneId}`,
        payload: { title: 'Should fail' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /agile/milestones/:id ───────────────────────────────────────────

  describe('DELETE /agile/milestones/:id', () => {
    it('blocks deletion when sprints exist', async () => {
      // milestoneId already has a sprint inserted in the PATCH test above
      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/milestones/${milestoneId}`,
      });
      expect(res.statusCode).toBe(409);
    });

    it('deletes a milestone with no children and returns 204', async () => {
      // Create a fresh milestone with no sprints
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'To Delete' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/milestones/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for already-deleted / unknown milestone', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/milestones/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without delete permission returns 403', async () => {
      // Create a separate milestone for this check
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/milestones',
        payload: { title: 'Perm check' },
      });
      const checkId = create.json().id;

      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/agile/milestones/${checkId}`,
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
