import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Agile — Sprints', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let contributorCookie: string;
  let milestoneId: string;
  let sprintId: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    await createUser(getDb(), { username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'owner' });
    await createUser(getDb(), { username: 'bob',   email: 'bob@t.com',   password: 'pw123456', role: 'contributor' });

    ownerCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');

    // Create a parent milestone to attach sprints to
    const ms = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/agile/milestones',
      payload: { title: 'Test Milestone', status: 'Active' },
    });
    milestoneId = ms.json().id;
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /agile/sprints ─────────────────────────────────────────────────────

  describe('GET /agile/sprints', () => {
    it('returns 200 with empty list before any sprints exist', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/sprints?milestoneId=${milestoneId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.sprints)).toBe(true);
      expect(body.sprints).toHaveLength(0);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/agile/sprints' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── POST /agile/sprints ────────────────────────────────────────────────────

  describe('POST /agile/sprints', () => {
    it('creates a sprint and returns 201', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'Sprint 1', capacity: 40 },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Sprint 1');
      expect(body.sprintNumber).toBe(1);
      expect(body.capacity).toBe(40);
      sprintId = body.id;
    });

    it('auto-increments sprintNumber', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'Sprint 2' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().sprintNumber).toBe(2);
    });

    it('rejects missing milestoneId with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { title: 'No Parent' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing title with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'X', status: 'Unknown' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects endDate before startDate with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'X', startDate: '2026-07-10', endDate: '2026-07-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unknown milestoneId with 404', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId: new ObjectId().toString(), title: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without create permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'Should fail' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /agile/sprints (with data) ────────────────────────────────────────

  describe('GET /agile/sprints (with data)', () => {
    it('returns sprints for a milestone with rollup stats', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/sprints?milestoneId=${milestoneId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.sprints.length).toBeGreaterThan(0);
      const s = body.sprints[0];
      expect(s.id).toBeDefined();
      expect(s._id).toBeUndefined();
      expect(typeof s.completionPct).toBe('number');
      expect(typeof s.committedEffort).toBe('number');
      expect(typeof s.velocity).toBe('number');
      expect(typeof s.jobCount).toBe('number');
    });

    it('filters by status', async () => {
      // Sprint 1 is still in Planning — update it to Active for this test
      await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/sprints/${sprintId}`,
        payload: { status: 'Active' },
      });

      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/sprints?milestoneId=${milestoneId}&status=Active`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().sprints.every((s: any) => s.status === 'Active')).toBe(true);
    });
  });

  // ── GET /agile/sprints/:id ─────────────────────────────────────────────────

  describe('GET /agile/sprints/:id', () => {
    it('returns the sprint with rollup stats', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/sprints/${sprintId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(sprintId);
      expect(body.title).toBe('Sprint 1');
      expect(typeof body.completionPct).toBe('number');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/sprints/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: '/agile/sprints/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /agile/sprints/:id ───────────────────────────────────────────────

  describe('PATCH /agile/sprints/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/sprints/${sprintId}`,
        payload: { title: 'Sprint 1 — Revised', capacity: 80 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists the updated fields', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/sprints/${sprintId}`,
      });
      expect(res.json().title).toBe('Sprint 1 — Revised');
      expect(res.json().capacity).toBe(80);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/sprints/${sprintId}`,
        payload: { status: 'NotValid' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank title with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/sprints/${sprintId}`,
        payload: { title: '' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('blocks Completed when jobs are not Done', async () => {
      // Insert an open job for this sprint
      await getDb().collection('agile_jobs').insertOne({
        _id:       new ObjectId(),
        sprintId:  new ObjectId(sprintId),
        title:     'Open Job',
        jobNumber: 9001,
        status:    'In Progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/sprints/${sprintId}`,
        payload: { status: 'Completed' },
      });
      expect(res.statusCode).toBe(409);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/sprints/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without update permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/agile/sprints/${sprintId}`,
        payload: { title: 'Should fail' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /agile/sprints/:id ──────────────────────────────────────────────

  describe('DELETE /agile/sprints/:id', () => {
    it('blocks deletion when jobs exist', async () => {
      // sprintId has a job inserted in the PATCH test above
      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/sprints/${sprintId}`,
      });
      expect(res.statusCode).toBe(409);
    });

    it('deletes an empty sprint and returns 204', async () => {
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'To Delete Sprint' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/sprints/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for unknown sprint', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/sprints/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without delete permission returns 403', async () => {
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/sprints',
        payload: { milestoneId, title: 'Perm check sprint' },
      });
      const checkId = create.json().id;

      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/agile/sprints/${checkId}`,
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
