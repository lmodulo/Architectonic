import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Folio — Estimates tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let customerId: string;
  let estimateId: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    const { userId } = await createUser(getDb(), {
      username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'admin',
    });
    customerId = userId.toString();

    await createUser(getDb(), { username: 'bob', email: 'bob@t.com', password: 'pw123456', role: 'contributor' });

    adminCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /finance/estimates ────────────────────────────────────────────────

  describe('GET /finance/estimates', () => {
    it('returns 200 with empty list', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/estimates' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.estimates)).toBe(true);
      expect(body.estimates).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/finance/estimates' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read estimates', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/finance/estimates' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /finance/estimates ───────────────────────────────────────────────

  describe('POST /finance/estimates', () => {
    it('creates an estimate with auto-number and returns 201', async () => {
      const validUntil = new Date(Date.now() + 30 * 86400000).toISOString();
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: {
          customerId,
          title: 'Website redesign',
          lineItems: [{ description: 'Design', quantity: 5, unitPrice: 200 }],
          taxRate: 10,
          validUntil,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.estimateNumber).toMatch(/^EST-\d{4}$/);
      expect(body.subtotal).toBe(1000);
      expect(body.taxAmount).toBe(100);
      expect(body.total).toBe(1100);
      expect(body.status).toBe('draft');
      estimateId = body.id;
    });

    it('second estimate gets sequential number', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { customerId, lineItems: [] },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().estimateNumber).toBe('EST-0002');
    });

    it('rejects missing customerId with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { title: 'No customer', lineItems: [] },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor cannot create estimates (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { customerId, lineItems: [] },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /finance/estimates (with data) ────────────────────────────────────

  describe('GET /finance/estimates (with data)', () => {
    it('returns estimates with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/estimates' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.estimates.length).toBeGreaterThan(0);
      const est = body.estimates[0];
      expect(est.id).toBeDefined();
      expect(est._id).toBeUndefined();
    });

    it('filters by status=draft', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/estimates?status=draft',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().estimates.every((e: any) => e.status === 'draft')).toBe(true);
    });

    it('respects limit and skip', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/estimates?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().estimates).toHaveLength(1);
    });
  });

  // ── GET /finance/estimates/:id ────────────────────────────────────────────

  describe('GET /finance/estimates/:id', () => {
    it('returns estimate by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${estimateId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(estimateId);
      expect(body.title).toBe('Website redesign');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/estimates/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/finance/estimates/${estimateId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /finance/estimates/:id ──────────────────────────────────────────

  describe('PATCH /finance/estimates/:id', () => {
    it('updates title and notes', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${estimateId}`,
        payload: { title: 'Updated redesign', notes: 'Revised scope' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${estimateId}`,
      });
      expect(res.json().title).toBe('Updated redesign');
      expect(res.json().notes).toBe('Revised scope');
    });

    it('updates lineItems and recalculates totals', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${estimateId}`,
        payload: {
          lineItems: [{ description: 'Dev', quantity: 8, unitPrice: 100 }],
          taxRate: 0,
        },
      });
      expect(res.statusCode).toBe(200);
      const est = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${estimateId}`,
      });
      expect(est.json().subtotal).toBe(800);
      expect(est.json().total).toBe(800);
    });

    it('updates taxRate only and recalculates totals', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${estimateId}`,
        payload: { taxRate: 15 },
      });
      expect(res.statusCode).toBe(200);
      const est = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${estimateId}`,
      });
      expect(est.json().taxRate).toBe(15);
      expect(est.json().total).toBe(920);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor cannot update estimates (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/finance/estimates/${estimateId}`,
        payload: { title: 'Attempt' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── POST /finance/estimates/:id/accept ────────────────────────────────────

  describe('POST /finance/estimates/:id/accept', () => {
    it('rejects accepting a draft estimate (400)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${estimateId}/accept`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('accepts a sent estimate → status becomes accepted', async () => {
      // first mark as sent
      await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${estimateId}`,
        payload: { status: 'sent' },
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${estimateId}/accept`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${estimateId}`,
      });
      expect(get.json().status).toBe('accepted');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${new ObjectId()}/accept`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /finance/estimates/:id/decline ───────────────────────────────────

  describe('POST /finance/estimates/:id/decline', () => {
    let sentEstimateId: string;

    it('creates a sent estimate for decline test', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { customerId, lineItems: [] },
      });
      sentEstimateId = create.json().id;
      await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${sentEstimateId}`,
        payload: { status: 'sent' },
      });
    });

    it('declines a sent estimate → status becomes declined', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${sentEstimateId}/decline`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/estimates/${sentEstimateId}`,
      });
      expect(get.json().status).toBe('declined');
    });

    it('rejects declining a non-sent estimate (400)', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { customerId, lineItems: [] },
      });
      const draftId = create.json().id;
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${draftId}/decline`,
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── POST /finance/estimates/:id/convert ───────────────────────────────────

  describe('POST /finance/estimates/:id/convert', () => {
    let convertEstimateId: string;

    it('creates a draft estimate and converts it to an invoice', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: {
          customerId,
          lineItems: [{ description: 'Phase 1', quantity: 2, unitPrice: 500 }],
          currency: 'USD',
        },
      });
      convertEstimateId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${convertEstimateId}/convert`,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.invoiceId).toBeDefined();
    });

    it('cannot convert the same estimate twice (409)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${convertEstimateId}/convert`,
      });
      expect(res.statusCode).toBe(409);
    });

    it('cannot convert a declined estimate (400)', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { customerId, lineItems: [] },
      });
      const declinedId = create.json().id;

      await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/estimates/${declinedId}`,
        payload: { status: 'declined' },
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${declinedId}/convert`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown estimate id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/finance/estimates/${new ObjectId()}/convert`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /finance/estimates/:id ─────────────────────────────────────────

  describe('DELETE /finance/estimates/:id', () => {
    it('contributor cannot delete estimates (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/finance/estimates/${estimateId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes an estimate and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/estimates',
        payload: { customerId, lineItems: [] },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/estimates/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/estimates/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
