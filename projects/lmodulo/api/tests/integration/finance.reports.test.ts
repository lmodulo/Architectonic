import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Folio — Reports tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let customerId: string;

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

  // ── GET /finance/reports (access control) ─────────────────────────────────

  describe('GET /finance/reports — access control', () => {
    it('returns 200 for admin', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/reports' });
      expect(res.statusCode).toBe(200);
    });

    it('contributor cannot read reports (403)', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/finance/reports' });
      expect(res.statusCode).toBe(403);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/finance/reports' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /finance/reports — response shape ────────────────────────────────

  describe('GET /finance/reports — response shape', () => {
    it('returns summary, periods, and expensesByCategory', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/reports' });
      expect(res.statusCode).toBe(200);
      const body = res.json();

      expect(body.summary).toBeDefined();
      expect(typeof body.summary.revenue).toBe('number');
      expect(typeof body.summary.expenses).toBe('number');
      expect(typeof body.summary.netProfit).toBe('number');
      expect(typeof body.summary.profitMargin).toBe('number');
      expect(typeof body.summary.taxCollected).toBe('number');
      expect(typeof body.summary.outstanding).toBe('number');

      expect(Array.isArray(body.periods)).toBe(true);
      expect(Array.isArray(body.expensesByCategory)).toBe(true);
    });

    it('each period has key, label, revenue, expenses, net, taxCollected', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-01-01&to=2026-03-31',
      });
      expect(res.statusCode).toBe(200);
      const { periods } = res.json();
      expect(periods.length).toBeGreaterThan(0);
      const p = periods[0];
      expect(p.key).toBeDefined();
      expect(p.label).toBeDefined();
      expect(typeof p.revenue).toBe('number');
      expect(typeof p.expenses).toBe('number');
      expect(typeof p.net).toBe('number');
      expect(typeof p.taxCollected).toBe('number');
    });
  });

  // ── GET /finance/reports — groupBy variants ───────────────────────────────

  describe('GET /finance/reports — groupBy', () => {
    it('groups by month (default)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-01-01&to=2026-03-31',
      });
      expect(res.statusCode).toBe(200);
      const { periods } = res.json();
      // monthly keys look like "2026-01"
      expect(periods[0].key).toMatch(/^\d{4}-\d{2}$/);
    });

    it('groups by quarter', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-01-01&to=2026-12-31&groupBy=quarter',
      });
      expect(res.statusCode).toBe(200);
      const { periods } = res.json();
      expect(periods.length).toBeGreaterThan(0);
      expect(periods[0].key).toMatch(/^\d{4}-Q\d$/);
    });

    it('groups by year', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2025-01-01&to=2026-12-31&groupBy=year',
      });
      expect(res.statusCode).toBe(200);
      const { periods } = res.json();
      expect(periods.length).toBeGreaterThan(0);
      expect(periods[0].key).toMatch(/^\d{4}$/);
    });

    it('falls back to monthly for unknown groupBy value', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-01-01&to=2026-02-28&groupBy=weekly',
      });
      expect(res.statusCode).toBe(200);
      const { periods } = res.json();
      expect(periods[0].key).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  // ── GET /finance/reports — with data ─────────────────────────────────────

  describe('GET /finance/reports — with data', () => {
    beforeAll(async () => {
      const db = getDb();

      // Insert a paid invoice in April 2026
      await db.collection('finance_invoices').insertOne({
        invoiceNumber: 'INV-TEST-001',
        customerId:    null,
        lineItems:     [],
        subtotal:      1000,
        taxRate:       10,
        taxAmount:     100,
        total:         1100,
        currency:      'USD',
        status:        'paid',
        paidAt:        new Date('2026-04-15'),
        dueDate:       null,
        notes:         '',
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });

      // Insert a paid expense in April 2026
      await db.collection('finance_expenses').insertOne({
        expenseNumber: 'EXP-TEST-001',
        description:   'Test expense',
        vendor:        'Vendor',
        category:      'software',
        amount:        250,
        currency:      'USD',
        expenseDate:   new Date('2026-04-10'),
        status:        'paid',
        billable:      false,
        notes:         '',
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });
    });

    it('reflects paid invoice in revenue', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-04-01&to=2026-04-30',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.summary.revenue).toBeGreaterThan(0);
      expect(body.summary.taxCollected).toBeGreaterThan(0);
    });

    it('reflects paid expense in expenses total', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-04-01&to=2026-04-30',
      });
      const body = res.json();
      expect(body.summary.expenses).toBeGreaterThan(0);
    });

    it('netProfit equals revenue minus expenses', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-04-01&to=2026-04-30',
      });
      const { summary } = res.json();
      expect(summary.netProfit).toBe(summary.revenue - summary.expenses);
    });

    it('expensesByCategory contains software category', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-04-01&to=2026-04-30',
      });
      const { expensesByCategory } = res.json();
      const sw = expensesByCategory.find((c: any) => c.category === 'software');
      expect(sw).toBeDefined();
      expect(sw.amount).toBe(250);
      expect(sw.count).toBe(1);
    });

    it('outstanding reflects sent/overdue invoices outside the date range', async () => {
      const db = getDb();
      await db.collection('finance_invoices').insertOne({
        invoiceNumber: 'INV-TEST-002',
        customerId:    null,
        lineItems:     [],
        subtotal:      500,
        taxRate:       0,
        taxAmount:     0,
        total:         500,
        currency:      'USD',
        status:        'sent',
        dueDate:       new Date('2026-05-01'),
        notes:         '',
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-04-01&to=2026-04-30',
      });
      const { summary } = res.json();
      expect(summary.outstanding).toBeGreaterThan(0);
    });
  });

  // ── GET /finance/reports — invalid date range ─────────────────────────────

  describe('GET /finance/reports — invalid date range', () => {
    it('returns 400 for invalid from date', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=not-a-date',
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for invalid to date', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/reports?from=2026-01-01&to=not-a-date',
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
