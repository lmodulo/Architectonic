import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Agile — Jobs (Board / Plan tab)', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let contributorCookie: string;
  let milestoneId: string;
  let sprintId: string;
  let jobId: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    await createUser(getDb(), { username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'owner' });
    await createUser(getDb(), { username: 'bob',   email: 'bob@t.com',   password: 'pw123456', role: 'contributor' });

    ownerCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');

    // Build fixture hierarchy: milestone → sprint
    const ms = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/agile/milestones',
      payload: { title: 'Milestone', status: 'Active' },
    });
    milestoneId = ms.json().id;

    const sp = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/agile/sprints',
      payload: { milestoneId, title: 'Sprint 1', status: 'Active' },
    });
    sprintId = sp.json().id;
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /agile/jobs ────────────────────────────────────────────────────────

  describe('GET /agile/jobs', () => {
    it('returns 200 with empty list when no jobs exist', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs?sprintId=${sprintId}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().jobs).toHaveLength(0);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/agile/jobs' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read jobs', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'GET', url: `/agile/jobs?sprintId=${sprintId}`,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /agile/jobs ───────────────────────────────────────────────────────

  describe('POST /agile/jobs', () => {
    it('creates a job and returns 201 with jobNumber', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Implement login', category: 'Feature' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Implement login');
      expect(body.category).toBe('Feature');
      expect(typeof body.jobNumber).toBe('number');
      expect(body.jobNumber).toBeGreaterThan(0);
      jobId = body.id;
    });

    it('defaults category to Feature and status to Backlog', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Another job' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().category).toBe('Feature');
      expect(res.json().status).toBe('Backlog');
    });

    it('rejects missing sprintId with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { title: 'No Sprint' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing title with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'X', status: 'Invalid' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid category with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'X', category: 'NotReal' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unknown sprintId with 404', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId: new ObjectId().toString(), title: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without create permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Should fail' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /agile/jobs (with data) ────────────────────────────────────────────

  describe('GET /agile/jobs (with data)', () => {
    it('returns jobs with rollup stats', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs?sprintId=${sprintId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.jobs.length).toBeGreaterThan(0);
      const j = body.jobs[0];
      expect(j.id).toBeDefined();
      expect(j._id).toBeUndefined();
      expect(typeof j.taskCount).toBe('number');
      expect(typeof j.completionPct).toBe('number');
    });

    it('filters by status', async () => {
      await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Blocked job', status: 'Blocked' },
      });
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs?sprintId=${sprintId}&status=Blocked`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().jobs.every((j: any) => j.status === 'Blocked')).toBe(true);
    });
  });

  // ── GET /agile/jobs/:id ────────────────────────────────────────────────────

  describe('GET /agile/jobs/:id', () => {
    it('returns the job with rollup stats by ObjectId', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs/${jobId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(jobId);
      expect(body.title).toBe('Implement login');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: '/agile/jobs/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /agile/jobs/:id ──────────────────────────────────────────────────

  describe('PATCH /agile/jobs/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/jobs/${jobId}`,
        payload: { title: 'Implement login — updated', blocked: true },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists the updated fields', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs/${jobId}`,
      });
      expect(res.json().title).toBe('Implement login — updated');
      expect(res.json().blocked).toBe(true);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/jobs/${jobId}`,
        payload: { status: 'Invalid' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid category with 400', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/jobs/${jobId}`,
        payload: { category: 'NotReal' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('blocks Done when open tasks remain', async () => {
      // Insert an open task for this job
      await getDb().collection('agile_tasks').insertOne({
        _id:       new ObjectId(),
        jobId:     new ObjectId(jobId),
        title:     'Open task',
        status:    'In Progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/jobs/${jobId}`,
        payload: { status: 'Done' },
      });
      expect(res.statusCode).toBe(409);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'PATCH', url: `/agile/jobs/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without update permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/agile/jobs/${jobId}`,
        payload: { title: 'Should fail' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /agile/jobs/:id ─────────────────────────────────────────────────

  describe('DELETE /agile/jobs/:id', () => {
    it('blocks deletion when tasks exist', async () => {
      // jobId already has a task from the PATCH test above
      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/jobs/${jobId}`,
      });
      expect(res.statusCode).toBe(409);
    });

    it('deletes a job with no tasks and returns 204', async () => {
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'To Delete' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/jobs/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for unknown job', async () => {
      const res = await authedRequest(app, ownerCookie, {
        method: 'DELETE', url: `/agile/jobs/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('owner can delete; contributor (no delete) returns 403', async () => {
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Perm check job' },
      });
      const checkId = create.json().id;

      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/agile/jobs/${checkId}`,
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /agile/jobs/:id/dependencies ──────────────────────────────────────

  describe('GET /agile/jobs/:id/dependencies', () => {
    it('returns empty array when no dependencies', async () => {
      const create = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Dep test job' },
      });
      const depJobId = create.json().id;

      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs/${depJobId}/dependencies`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveLength(0);
    });

    it('returns resolved dependency objects', async () => {
      const depA = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Dep A' },
      });
      const depAId = depA.json().id;

      const depB = await authedRequest(app, ownerCookie, {
        method: 'POST', url: '/agile/jobs',
        payload: { sprintId, title: 'Job with dep', dependencyIds: [depAId] },
      });
      const depBId = depB.json().id;

      const res = await authedRequest(app, ownerCookie, {
        method: 'GET', url: `/agile/jobs/${depBId}/dependencies`,
      });
      expect(res.statusCode).toBe(200);
      const deps = res.json();
      expect(deps).toHaveLength(1);
      expect(deps[0].id).toBe(depAId);
    });
  });
});
