import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('CRM — Deals / Pipeline tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let dealId: string;
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

    // Seed a company for deal association tests
    const coRes = await authedRequest(app, adminCookie, {
      method: 'POST', url: '/crm/companies',
      payload: { name: 'Deal Corp' },
    });
    companyId = coRes.json().id;
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /crm/deals ────────────────────────────────────────────────────────

  describe('GET /crm/deals', () => {
    it('returns 200 with empty list when no deals exist', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/deals' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.deals)).toBe(true);
      expect(body.deals).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/crm/deals' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read deals', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/crm/deals' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /crm/deals ───────────────────────────────────────────────────────

  describe('POST /crm/deals', () => {
    it('creates a deal and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Big Win', stage: 'Proposal', value: 50000, companyId },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.title).toBe('Big Win');
      expect(body.stage).toBe('Proposal');
      expect(body.value).toBe(50000);
      expect(body.companyId).toBe(companyId);
      dealId = body.id;
    });

    it('defaults stage to Discovery and type to New Business', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Defaults Deal' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.stage).toBe('Discovery');
      expect(body.type).toBe('New Business');
    });

    it('auto-sets probability from stage', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Negotiation Deal', stage: 'Negotiation' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().probability).toBe(60);
    });

    it('Closed Won gets 100% probability', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Won Deal', stage: 'Closed Won' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().probability).toBe(100);
    });

    it('Closed Lost requires lostReason', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Lost Deal', stage: 'Closed Lost' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('Closed Lost with lostReason succeeds', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Lost Deal', stage: 'Closed Lost', lostReason: 'Price too high' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().lostReason).toBe('Price too high');
    });

    it('rejects missing title with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { stage: 'Discovery' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank title with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: '   ' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid stage with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'X', stage: 'NotAStage' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'X', type: 'Competitor' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor without create permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'Blocked' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/crm/deals',
        payload: { title: 'X' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /crm/deals (with data) ────────────────────────────────────────────

  describe('GET /crm/deals (with data)', () => {
    it('returns deals with id (no _id) and companyName populated', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/deals' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.deals.length).toBeGreaterThan(0);
      const deal = body.deals.find((d: any) => d.companyId === companyId);
      expect(deal).toBeDefined();
      expect(deal.id).toBeDefined();
      expect(deal._id).toBeUndefined();
      expect(deal.companyName).toBe('Deal Corp');
    });

    it('filters by stage', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/deals?stage=Proposal',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.deals.every((d: any) => d.stage === 'Proposal')).toBe(true);
    });

    it('excludeLost=true filters out Closed Lost deals', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/deals?excludeLost=true',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.deals.every((d: any) => d.stage !== 'Closed Lost')).toBe(true);
    });

    it('respects limit and skip pagination', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/deals?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().deals).toHaveLength(1);
    });
  });

  // ── GET /crm/deals/:id ────────────────────────────────────────────────────

  describe('GET /crm/deals/:id', () => {
    it('returns the deal by id with companyName', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/deals/${dealId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(dealId);
      expect(body.title).toBe('Big Win');
      expect(body._id).toBeUndefined();
      expect(body.companyName).toBe('Deal Corp');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/deals/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/deals/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/crm/deals/${dealId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /crm/deals/:id ──────────────────────────────────────────────────

  describe('PATCH /crm/deals/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/deals/${dealId}`,
        payload: { title: 'Big Win v2', value: 75000 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/deals/${dealId}`,
      });
      const body = res.json();
      expect(body.title).toBe('Big Win v2');
      expect(body.value).toBe(75000);
    });

    it('auto-updates probability when stage changes', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/deals/${dealId}`,
        payload: { stage: 'Contract' },
      });
      expect(res.statusCode).toBe(200);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/deals/${dealId}`,
      });
      expect(get.json().probability).toBe(85);
    });

    it('explicit probability overrides stage default', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/deals/${dealId}`,
        payload: { stage: 'Discovery', probability: 42 },
      });
      expect(res.statusCode).toBe(200);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/deals/${dealId}`,
      });
      expect(get.json().probability).toBe(42);
    });

    it('rejects invalid stage with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/deals/${dealId}`,
        payload: { stage: 'SomeStage' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid type with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/deals/${dealId}`,
        payload: { type: 'NotAType' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/deals/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without update permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/crm/deals/${dealId}`,
        payload: { title: 'Blocked' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /crm/deals/:id ─────────────────────────────────────────────────

  describe('DELETE /crm/deals/:id', () => {
    it('contributor without delete permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/crm/deals/${dealId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes a deal and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/deals',
        payload: { title: 'To Delete' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/deals/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for already-deleted deal', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/deals/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
