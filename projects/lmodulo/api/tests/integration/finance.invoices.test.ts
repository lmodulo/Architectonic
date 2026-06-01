import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Folio — Invoices tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let customerCookie: string;
  let customerId: string;
  let invoiceId: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());

    const { userId } = await createUser(getDb(), {
      username: 'alice', email: 'alice@t.com', password: 'pw123456', role: 'admin',
    });
    customerId = userId.toString();

    await createUser(getDb(), { username: 'bob',     email: 'bob@t.com',     password: 'pw123456', role: 'contributor' });
    await createUser(getDb(), { username: 'carol',   email: 'carol@t.com',   password: 'pw123456', role: 'customer' });

    adminCookie       = await loginAs(app, 'alice@t.com', 'pw123456');
    contributorCookie = await loginAs(app, 'bob@t.com',   'pw123456');
    customerCookie    = await loginAs(app, 'carol@t.com', 'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /finance/invoices ─────────────────────────────────────────────────

  describe('GET /finance/invoices', () => {
    it('returns 200 with empty list', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/invoices' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.invoices)).toBe(true);
      expect(body.invoices).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/finance/invoices' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read invoices', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/finance/invoices' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /finance/invoices ────────────────────────────────────────────────

  describe('POST /finance/invoices', () => {
    it('creates an invoice with auto-number and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/invoices',
        payload: {
          customerId,
          lineItems: [{ description: 'Dev work', quantity: 10, unitPrice: 150 }],
          taxRate: 10,
          currency: 'USD',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.invoiceNumber).toMatch(/^INV-\d{4}$/);
      expect(body.subtotal).toBe(1500);
      expect(body.taxAmount).toBe(150);
      expect(body.total).toBe(1650);
      expect(body.status).toBe('draft');
      invoiceId = body.id;
    });

    it('second invoice gets sequential number', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/invoices',
        payload: { customerId, lineItems: [] },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().invoiceNumber).toBe('INV-0002');
    });

    it('rejects missing customerId with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/invoices',
        payload: { lineItems: [] },
      });
      expect(res.statusCode).toBe(400);
    });

    it('creates invoice with recurrence enabled', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/invoices',
        payload: {
          customerId,
          lineItems: [],
          recurrence: { enabled: true, frequency: 'monthly' },
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.recurrence.enabled).toBe(true);
      expect(body.recurrence.frequency).toBe('monthly');
      expect(body.recurrence.nextDate).toBeDefined();
    });

    it('contributor cannot create invoices (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/finance/invoices',
        payload: { customerId, lineItems: [] },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /finance/invoices (with data) ─────────────────────────────────────

  describe('GET /finance/invoices (with data)', () => {
    it('returns invoices with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/invoices' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.invoices.length).toBeGreaterThan(0);
      const inv = body.invoices[0];
      expect(inv.id).toBeDefined();
      expect(inv._id).toBeUndefined();
    });

    it('filters by status', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/invoices?status=draft',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().invoices.every((i: any) => i.status === 'draft')).toBe(true);
    });

    it('respects limit and skip', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/invoices?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().invoices).toHaveLength(1);
    });

    it('total reflects count', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/invoices' });
      const body = res.json();
      expect(body.total).toBeGreaterThan(0);
    });
  });

  // ── GET /finance/invoices/:id ─────────────────────────────────────────────

  describe('GET /finance/invoices/:id', () => {
    it('returns invoice by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/invoices/${invoiceId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(invoiceId);
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/invoices/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/finance/invoices/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/finance/invoices/${invoiceId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /finance/invoices/:id ───────────────────────────────────────────

  describe('PATCH /finance/invoices/:id', () => {
    it('updates status and returns { updated: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/invoices/${invoiceId}`,
        payload: { status: 'sent', notes: 'Please pay by end of month' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/invoices/${invoiceId}`,
      });
      expect(res.json().status).toBe('sent');
      expect(res.json().notes).toBe('Please pay by end of month');
    });

    it('updates lineItems and recalculates totals', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/invoices/${invoiceId}`,
        payload: {
          lineItems: [{ description: 'Consulting', quantity: 5, unitPrice: 200 }],
          taxRate: 0,
        },
      });
      expect(res.statusCode).toBe(200);
      const inv = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/invoices/${invoiceId}`,
      });
      expect(inv.json().subtotal).toBe(1000);
      expect(inv.json().total).toBe(1000);
    });

    it('updates taxRate only and recalculates totals', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/invoices/${invoiceId}`,
        payload: { taxRate: 20 },
      });
      expect(res.statusCode).toBe(200);
      const inv = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/finance/invoices/${invoiceId}`,
      });
      expect(inv.json().taxRate).toBe(20);
      expect(inv.json().total).toBe(1200);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/finance/invoices/${new ObjectId()}`,
        payload: { status: 'paid' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor cannot update invoices (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/finance/invoices/${invoiceId}`,
        payload: { status: 'paid' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /finance/invoices/:id ──────────────────────────────────────────

  describe('DELETE /finance/invoices/:id', () => {
    it('contributor cannot delete invoices (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/finance/invoices/${invoiceId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes an invoice and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/finance/invoices',
        payload: { customerId, lineItems: [] },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/invoices/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for already-deleted invoice', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/finance/invoices/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /finance/customers ────────────────────────────────────────────────

  describe('GET /finance/customers', () => {
    it('returns customers list with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/customers' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.customers)).toBe(true);
      if (body.customers.length > 0) {
        expect(body.customers[0].id).toBeDefined();
        expect(body.customers[0]._id).toBeUndefined();
        expect(body.customers[0].passwordHash).toBeUndefined();
      }
    });

    it('only returns users with role=customer', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/finance/customers' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.customers.every((c: any) => c.role === 'customer')).toBe(true);
    });

    it('customer role cannot access customers list (403)', async () => {
      const res = await authedRequest(app, customerCookie, {
        method: 'GET', url: '/finance/customers',
      });
      expect(res.statusCode).toBe(403);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/finance/customers' });
      expect(res.statusCode).toBe(401);
    });
  });
});
