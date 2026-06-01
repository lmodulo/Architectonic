import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('CRM — Companies tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let companyId: string;

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

  // ── GET /crm/companies ────────────────────────────────────────────────────

  describe('GET /crm/companies', () => {
    it('returns 200 with empty list when no companies exist', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/companies' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.companies)).toBe(true);
      expect(body.companies).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/crm/companies' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read companies', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/crm/companies' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /crm/companies ───────────────────────────────────────────────────

  describe('POST /crm/companies', () => {
    it('creates a company and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'Acme Corp', industry: 'SaaS', type: 'Customer', domain: 'acme.com' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.name).toBe('Acme Corp');
      expect(body.industry).toBe('SaaS');
      expect(body.type).toBe('Customer');
      expect(body.domain).toBe('acme.com');
      companyId = body.id;
    });

    it('defaults industry to Other, type to Prospect, size to 1-10', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'Defaults Co' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.industry).toBe('Other');
      expect(body.type).toBe('Prospect');
      expect(body.size).toBe('1-10');
    });

    it('rejects missing name with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { industry: 'SaaS' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank name with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: '   ' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid industry with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'X', industry: 'NotAnIndustry' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'X', type: 'Competitor' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor without create permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'Blocked' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/crm/companies',
        payload: { name: 'X' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /crm/companies (with data) ────────────────────────────────────────

  describe('GET /crm/companies (with data)', () => {
    it('returns companies with healthScore and dealCount fields', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/companies' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.companies.length).toBeGreaterThan(0);
      const co = body.companies[0];
      expect(co.id).toBeDefined();
      expect(co._id).toBeUndefined();
      expect(typeof co.healthScore).toBe('number');
      expect(typeof co.dealCount).toBe('number');
    });

    it('filters by type', async () => {
      await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'Partner Co', type: 'Partner', domain: 'partner.com' },
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/companies?type=Partner',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.companies.every((c: any) => c.type === 'Partner')).toBe(true);
    });

    it('respects limit and skip pagination', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/companies?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().companies).toHaveLength(1);
    });
  });

  // ── GET /crm/companies/:id ────────────────────────────────────────────────

  describe('GET /crm/companies/:id', () => {
    it('returns the company by id with health fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/companies/${companyId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(companyId);
      expect(body.name).toBe('Acme Corp');
      expect(body._id).toBeUndefined();
      expect(typeof body.healthScore).toBe('number');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/companies/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/companies/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/crm/companies/${companyId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /crm/companies/:id ──────────────────────────────────────────────

  describe('PATCH /crm/companies/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/companies/${companyId}`,
        payload: { name: 'Acme Corp 2', type: 'Partner' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/companies/${companyId}`,
      });
      const body = res.json();
      expect(body.name).toBe('Acme Corp 2');
      expect(body.type).toBe('Partner');
    });

    it('rejects invalid industry with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/companies/${companyId}`,
        payload: { industry: 'NotAnIndustry' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/companies/${companyId}`,
        payload: { type: 'Enemy' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/companies/${new ObjectId()}`,
        payload: { name: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without update permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/crm/companies/${companyId}`,
        payload: { name: 'Blocked' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /crm/companies/:id/milestones ─────────────────────────────────────

  describe('GET /crm/companies/:id/milestones', () => {
    it('returns empty milestones array for company with no linked milestones', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/companies/${companyId}/milestones`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.milestones)).toBe(true);
      expect(body.milestones).toHaveLength(0);
      expect(typeof body.totalEstimatedHours).toBe('number');
      expect(typeof body.totalActualHours).toBe('number');
    });

    it('returns 404 for unknown company id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/companies/${new ObjectId()}/milestones`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'GET', url: `/crm/companies/${companyId}/milestones`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── DELETE /crm/companies/:id ─────────────────────────────────────────────

  describe('DELETE /crm/companies/:id', () => {
    it('contributor without delete permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/crm/companies/${companyId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes a company and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/companies',
        payload: { name: 'To Delete', domain: 'todelete.com' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/companies/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for already-deleted company', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/companies/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
