import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Folio — Expenses tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let expenseId: string;

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

  // ── GET /finance/expenses ─────────────────────────────────────────────────

  describe('GET /finance/expenses', () => {
    it('returns 200 with empty list', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/expenses' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.expenses)).toBe(true);
      expect(body.expenses).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/finance/expenses' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read expenses', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/finance/expenses' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /finance/expenses ────────────────────────────────────────────────

  describe('POST /finance/expenses', () => {
    it('creates an expense with auto-number and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: {
          description: 'AWS hosting',
          vendor: 'Amazon',
          category: 'hosting',
          amount: 299.99,
          currency: 'USD',
          expenseDate: '2026-04-01',
          status: 'paid',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.expenseNumber).toMatch(/^EXP-\d{4}$/);
      expect(body.amount).toBe(299.99);
      expect(body.vendor).toBe('Amazon');
      expect(body.category).toBe('hosting');
      expenseId = body.id;
    });

    it('second expense gets sequential number', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: {
          description: 'GitHub subscription',
          vendor: 'GitHub',
          amount: 50,
          expenseDate: '2026-04-02',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().expenseNumber).toBe('EXP-0002');
    });

    it('rejects missing description with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { vendor: 'Vendor', amount: 10, expenseDate: '2026-04-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing vendor with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'Desc', amount: 10, expenseDate: '2026-04-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing expenseDate with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'Desc', vendor: 'Vendor', amount: 10 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects zero or negative amount with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'Desc', vendor: 'Vendor', amount: 0, expenseDate: '2026-04-01' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('defaults category to "other" when omitted', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'Misc', vendor: 'Misc vendor', amount: 25, expenseDate: '2026-04-03' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().category).toBe('other');
    });

    it('contributor cannot create expenses (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'Attempt', vendor: 'V', amount: 10, expenseDate: '2026-04-01' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /finance/expenses (with data) ─────────────────────────────────────

  describe('GET /finance/expenses (with data)', () => {
    it('returns expenses with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/expenses' });
      const body = res.json();
      expect(body.expenses.length).toBeGreaterThan(0);
      const exp = body.expenses[0];
      expect(exp.id).toBeDefined();
      expect(exp._id).toBeUndefined();
    });

    it('filters by status=paid', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/expenses?status=paid',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().expenses.every((e: any) => e.status === 'paid')).toBe(true);
    });

    it('filters by category=hosting', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/expenses?category=hosting',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().expenses.every((e: any) => e.category === 'hosting')).toBe(true);
    });

    it('filters by dateFrom and dateTo', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/expenses?dateFrom=2026-04-01&dateTo=2026-04-01',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.expenses.length).toBeGreaterThan(0);
    });

    it('respects limit and skip', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/expenses?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().expenses).toHaveLength(1);
    });
  });

  // ── GET /finance/expenses/:id ─────────────────────────────────────────────

  describe('GET /finance/expenses/:id', () => {
    it('returns expense by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/expenses/${expenseId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(expenseId);
      expect(body.description).toBe('AWS hosting');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/expenses/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/expenses/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── PATCH /finance/expenses/:id ───────────────────────────────────────────

  describe('PATCH /finance/expenses/:id', () => {
    it('updates fields and returns { updated: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/expenses/${expenseId}`,
        payload: { notes: 'Approved by finance', status: 'paid' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/expenses/${expenseId}`,
      });
      expect(res.json().notes).toBe('Approved by finance');
      expect(res.json().status).toBe('paid');
    });

    it('updates billable flag', async () => {
      await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/expenses/${expenseId}`,
        payload: { billable: true },
      });
      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/expenses/${expenseId}`,
      });
      expect(get.json().billable).toBe(true);
    });

    it('contributor cannot update expenses (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/finance/expenses/${expenseId}`,
        payload: { notes: 'Attempt' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /finance/expenses/:id ──────────────────────────────────────────

  describe('DELETE /finance/expenses/:id', () => {
    it('contributor cannot delete expenses (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/finance/expenses/${expenseId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes an expense and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'To delete', vendor: 'V', amount: 10, expenseDate: '2026-05-01' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/expenses/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('deleted expense is no longer retrievable', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/expenses',
        payload: { description: 'Gone', vendor: 'V2', amount: 15, expenseDate: '2026-05-02' },
      });
      const goneId = create.json().id;

      await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/expenses/${goneId}`,
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/expenses/${goneId}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
