import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Contracts — Templates tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let templateId: string;

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

  // ── GET /contracts/templates ───────────────────────────────────────────────

  describe('GET /contracts/templates', () => {
    it('returns 200 with empty list', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/contracts/templates' });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/contracts/templates' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read templates', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/contracts/templates' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /contracts/templates ──────────────────────────────────────────────

  describe('POST /contracts/templates', () => {
    it('creates a template and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts/templates',
        payload: {
          name:        'Standard NDA',
          type:        'nda',
          description: 'Non-disclosure agreement template',
          content:     '<p>Confidentiality terms.</p>',
          variables:   ['{{party_name}}', '{{date}}'],
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.name).toBe('Standard NDA');
      expect(body.type).toBe('nda');
      expect(body.isDefault).toBe(false);
      expect(body.variables).toEqual(['{{party_name}}', '{{date}}']);
      templateId = body.id;
    });

    it('defaults type to custom and content/description/variables to empty when omitted', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts/templates',
        payload: { name: 'Minimal Template' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.type).toBe('custom');
      expect(body.content).toBe('');
      expect(body.description).toBe('');
      expect(Array.isArray(body.variables)).toBe(true);
    });

    it('rejects missing name with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts/templates',
        payload: { type: 'sow', content: 'No name given' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor cannot create templates (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/contracts/templates',
        payload: { name: 'Attempt' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /contracts/templates (with data) ───────────────────────────────────

  describe('GET /contracts/templates (with data)', () => {
    it('returns templates with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/contracts/templates' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].id).toBeDefined();
      expect(body[0]._id).toBeUndefined();
    });

    it('contributor sees the same template list', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/contracts/templates' });
      expect(res.statusCode).toBe(200);
      expect(res.json().length).toBeGreaterThan(0);
    });
  });

  // ── GET /contracts/templates/:id ───────────────────────────────────────────

  describe('GET /contracts/templates/:id', () => {
    it('returns template by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/templates/${templateId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(templateId);
      expect(body.name).toBe('Standard NDA');
      expect(body._id).toBeUndefined();
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/templates/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/contracts/templates/not-an-id',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/contracts/templates/${templateId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /contracts/templates/:id ─────────────────────────────────────────

  describe('PATCH /contracts/templates/:id', () => {
    it('updates template name and content', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/templates/${templateId}`,
        payload: { name: 'Updated NDA', content: '<p>Revised confidentiality terms.</p>' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.name).toBe('Updated NDA');
      expect(body.content).toBe('<p>Revised confidentiality terms.</p>');
    });

    it('persists updated fields on GET', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/templates/${templateId}`,
      });
      expect(res.json().name).toBe('Updated NDA');
      expect(res.json().content).toBe('<p>Revised confidentiality terms.</p>');
    });

    it('updates variables array', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/templates/${templateId}`,
        payload: { variables: ['{{client_name}}', '{{effective_date}}', '{{jurisdiction}}'] },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().variables).toEqual(['{{client_name}}', '{{effective_date}}', '{{jurisdiction}}']);
    });

    it('updates description and type', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/templates/${templateId}`,
        payload: { description: 'Updated description', type: 'msa' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().description).toBe('Updated description');
      expect(res.json().type).toBe('msa');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/templates/${new ObjectId()}`,
        payload: { name: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor cannot update templates (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/contracts/templates/${templateId}`,
        payload: { name: 'Hijack' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── DELETE /contracts/templates/:id ────────────────────────────────────────

  describe('DELETE /contracts/templates/:id', () => {
    it('deletes a non-default template and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts/templates',
        payload: { name: 'Disposable Template' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/templates/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts/templates',
        payload: { name: 'Gone Template' },
      });
      const goneId = create.json().id;

      await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/templates/${goneId}`,
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/templates/${goneId}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('cannot delete a built-in (isDefault=true) template (400)', async () => {
      const result = await getDb().collection('contract_templates').insertOne({
        name:      'Built-in MSA',
        type:      'msa',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const builtInId = result.insertedId.toString();

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/templates/${builtInId}`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor cannot delete templates (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/contracts/templates/${templateId}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/templates/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
