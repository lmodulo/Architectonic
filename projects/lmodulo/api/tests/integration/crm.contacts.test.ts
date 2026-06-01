import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('CRM — Contacts tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let contactId: string;
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

    // Seed a company for convert-to-client tests
    const coRes = await authedRequest(app, adminCookie, {
      method: 'POST', url: '/crm/companies',
      payload: { name: 'Acme Corp' },
    });
    companyId = coRes.json().id;
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  // ── GET /crm/contacts ─────────────────────────────────────────────────────

  describe('GET /crm/contacts', () => {
    it('returns 200 with empty list when no contacts exist', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/contacts' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.contacts)).toBe(true);
      expect(body.contacts).toHaveLength(0);
      expect(typeof body.total).toBe('number');
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/crm/contacts' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read contacts', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/crm/contacts' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /crm/contacts ────────────────────────────────────────────────────

  describe('POST /crm/contacts', () => {
    it('creates a contact and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'Champion', status: 'Active' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.firstName).toBe('Jane');
      expect(body.lastName).toBe('Smith');
      expect(body.email).toBe('jane@example.com');
      expect(body.role).toBe('Champion');
      expect(body.status).toBe('Active');
      contactId = body.id;
    });

    it('defaults role to Other and status to Prospect', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.role).toBe('Other');
      expect(body.status).toBe('Prospect');
    });

    it('trims whitespace from firstName and lastName', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: '  Trimmed  ', lastName: '  Name  ', email: 'trim@example.com' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.firstName).toBe('Trimmed');
      expect(body.lastName).toBe('Name');
    });

    it('rejects missing firstName with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { lastName: 'Smith' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects blank firstName with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: '   ', lastName: 'Smith' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing lastName with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'Jane' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid role with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'X', lastName: 'Y', role: 'NotARole' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'X', lastName: 'Y', status: 'Unknown' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor without create permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'X', lastName: 'Y' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'X', lastName: 'Y' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /crm/contacts (with data) ─────────────────────────────────────────

  describe('GET /crm/contacts (with data)', () => {
    it('returns contacts list with id (no _id)', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/crm/contacts' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.contacts.length).toBeGreaterThan(0);
      const c = body.contacts[0];
      expect(c.id).toBeDefined();
      expect(c._id).toBeUndefined();
      expect(typeof c.isUser).toBe('boolean');
    });

    it('filters by status', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/contacts?status=Active',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.contacts.every((c: any) => c.status === 'Active')).toBe(true);
    });

    it('filters by role', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/contacts?role=Champion',
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.contacts.every((c: any) => c.role === 'Champion')).toBe(true);
    });

    it('respects limit and skip pagination', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/contacts?limit=1&skip=0',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().contacts).toHaveLength(1);
    });
  });

  // ── GET /crm/contacts/:id ─────────────────────────────────────────────────

  describe('GET /crm/contacts/:id', () => {
    it('returns the contact by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/contacts/${contactId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(contactId);
      expect(body.firstName).toBe('Jane');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/contacts/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/crm/contacts/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/crm/contacts/${contactId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /crm/contacts/:id ───────────────────────────────────────────────

  describe('PATCH /crm/contacts/:id', () => {
    it('partial update returns { updated: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/contacts/${contactId}`,
        payload: { firstName: 'Janet', status: 'Churned' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().updated).toBe(true);
    });

    it('persists updated fields', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/crm/contacts/${contactId}`,
      });
      const body = res.json();
      expect(body.firstName).toBe('Janet');
      expect(body.status).toBe('Churned');
    });

    it('rejects invalid role with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/contacts/${contactId}`,
        payload: { role: 'Ghost' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid status with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/contacts/${contactId}`,
        payload: { status: 'Pending' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/crm/contacts/${new ObjectId()}`,
        payload: { firstName: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor without update permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/crm/contacts/${contactId}`,
        payload: { firstName: 'Blocked' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── POST /crm/contacts/:id/convert-to-client ──────────────────────────────

  describe('POST /crm/contacts/:id/convert-to-client', () => {
    let convertableId: string;

    beforeAll(async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: {
          firstName: 'Convert',
          lastName:  'Me',
          email:     'convert@example.com',
          companyId,
        },
      });
      convertableId = res.json().id;
    });

    it('creates a user account and returns 201 with userId', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/crm/contacts/${convertableId}/convert-to-client`,
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.userId).toBeDefined();
      expect(typeof body.userId).toBe('string');
    });

    it('returns 409 if the email already has a user account', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/crm/contacts/${convertableId}/convert-to-client`,
      });
      expect(res.statusCode).toBe(409);
    });

    it('returns 400 if contact has no email', async () => {
      const noEmail = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'No', lastName: 'Email', companyId },
      });
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/crm/contacts/${noEmail.json().id}/convert-to-client`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 if contact has no companyId', async () => {
      const noCompany = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'No', lastName: 'Company', email: 'nocompany@example.com' },
      });
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/crm/contacts/${noCompany.json().id}/convert-to-client`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown contact', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/crm/contacts/${new ObjectId()}/convert-to-client`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /crm/contacts/:id ──────────────────────────────────────────────

  describe('DELETE /crm/contacts/:id', () => {
    it('contributor without delete permission returns 403', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/crm/contacts/${contactId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('deletes a contact and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/crm/contacts',
        payload: { firstName: 'To', lastName: 'Delete', email: 'del@example.com' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/contacts/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for already-deleted contact', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/crm/contacts/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
