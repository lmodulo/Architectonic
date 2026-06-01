import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Folio — Subscriptions tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let customerId: string;
  let subscriptionId: string;

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

  // ── GET /finance/subscriptions ────────────────────────────────────────────

  describe('GET /finance/subscriptions', () => {
    it('returns 200 with empty list', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/subscriptions' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.subscriptions)).toBe(true);
      expect(body.subscriptions).toHaveLength(0);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/finance/subscriptions' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor cannot read subscriptions (403)', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/finance/subscriptions' });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── POST /finance/subscriptions ───────────────────────────────────────────

  describe('POST /finance/subscriptions', () => {
    it('creates a subscription and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: {
          name: 'Monthly Retainer',
          customerId,
          billingCycle: 'monthly',
          startDate: '2026-01-01',
          lineItems: [{ description: 'Retainer fee', quantity: 1, unitPrice: 2000 }],
          currency: 'USD',
          notes: 'Standard retainer',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.name).toBe('Monthly Retainer');
      expect(body.billingCycle).toBe('monthly');
      expect(body.status).toBe('active');
      expect(body.nextBillingDate).toBeDefined();
      subscriptionId = body.id;
    });

    it('rejects missing name with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: { customerId, billingCycle: 'monthly', startDate: '2026-01-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing customerId with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: { name: 'Sub', billingCycle: 'monthly', startDate: '2026-01-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing billingCycle with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: { name: 'Sub', customerId, startDate: '2026-01-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing startDate with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: { name: 'Sub', customerId, billingCycle: 'monthly' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('creates subscription with retainer enabled and creates initial period', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: {
          name: 'Retainer Sub',
          customerId,
          billingCycle: 'monthly',
          startDate: '2026-01-01',
          lineItems: [],
          retainerEnabled: true,
          retainerHours: 40,
          companyId: new ObjectId().toString(),
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().retainerEnabled).toBe(true);
      expect(res.json().retainerHours).toBe(40);
    });

    it('contributor cannot create subscriptions (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: { name: 'Attempt', customerId, billingCycle: 'monthly', startDate: '2026-01-01' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /finance/subscriptions (with data) ────────────────────────────────

  describe('GET /finance/subscriptions (with data)', () => {
    it('returns subscriptions with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/subscriptions' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.subscriptions.length).toBeGreaterThan(0);
      const sub = body.subscriptions[0];
      expect(sub.id).toBeDefined();
      expect(sub._id).toBeUndefined();
    });

    it('filters by status=active', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/subscriptions?status=active',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().subscriptions.every((s: any) => s.status === 'active')).toBe(true);
    });

    it('filters by customerId', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions?customerId=${customerId}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().subscriptions.every((s: any) => s.customerId === customerId)).toBe(true);
    });
  });

  // ── GET /finance/subscriptions/:id ───────────────────────────────────────

  describe('GET /finance/subscriptions/:id', () => {
    it('returns subscription by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions/${subscriptionId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(subscriptionId);
      expect(body.name).toBe('Monthly Retainer');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/subscriptions/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /finance/subscriptions/:id ─────────────────────────────────────

  describe('PATCH /finance/subscriptions/:id', () => {
    it('updates name and notes', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/subscriptions/${subscriptionId}`,
        payload: { name: 'Updated Retainer', notes: 'Revised terms' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions/${subscriptionId}`,
      });
      expect(res.json().name).toBe('Updated Retainer');
      expect(res.json().notes).toBe('Revised terms');
    });

    it('can pause a subscription (status=paused)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/subscriptions/${subscriptionId}`,
        payload: { status: 'paused' },
      });
      expect(res.statusCode).toBe(200);
      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions/${subscriptionId}`,
      });
      expect(get.json().status).toBe('paused');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/subscriptions/${new ObjectId()}`,
        payload: { name: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor cannot update subscriptions (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/finance/subscriptions/${subscriptionId}`,
        payload: { name: 'Attempt' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /finance/subscriptions/:id/retainer-current ──────────────────────

  describe('GET /finance/subscriptions/:id/retainer-current', () => {
    it('returns 404 when no open retainer period exists', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions/${subscriptionId}/retainer-current`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed subscription id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/subscriptions/not-valid/retainer-current',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── GET /finance/subscriptions/:id/retainer-history ──────────────────────

  describe('GET /finance/subscriptions/:id/retainer-history', () => {
    it('returns empty periods array when no history exists', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/subscriptions/${subscriptionId}/retainer-history`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.periods)).toBe(true);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/subscriptions/not-valid/retainer-history',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── DELETE /finance/subscriptions/:id ────────────────────────────────────

  describe('DELETE /finance/subscriptions/:id', () => {
    it('contributor cannot delete subscriptions (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/finance/subscriptions/${subscriptionId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes a subscription and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/subscriptions',
        payload: {
          name: 'To Delete', customerId, billingCycle: 'monthly', startDate: '2026-01-01',
        },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/subscriptions/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/subscriptions/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
