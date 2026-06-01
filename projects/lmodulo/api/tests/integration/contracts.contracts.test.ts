import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

describe('Contracts — All Contracts tab', () => {
  let app: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
  let contractId: string;

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

  // ── GET /contracts ─────────────────────────────────────────────────────────

  describe('GET /contracts', () => {
    it('returns 200 with empty list', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/contracts' });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
      expect(res.json()).toHaveLength(0);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: '/contracts' });
      expect(res.statusCode).toBe(401);
    });

    it('contributor can read contracts', async () => {
      const res = await authedRequest(app, contributorCookie, { method: 'GET', url: '/contracts' });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── POST /contracts ────────────────────────────────────────────────────────

  describe('POST /contracts', () => {
    it('creates a contract with defaults and returns 201', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'Service Agreement', type: 'msa' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body._id).toBeUndefined();
      expect(body.title).toBe('Service Agreement');
      expect(body.type).toBe('msa');
      expect(body.status).toBe('draft');
      expect(Array.isArray(body.signers)).toBe(true);
      expect(body.signers).toHaveLength(0);
      contractId = body.id;
    });

    it('creates with optional fields: value, currency, dates, content', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: {
          title:         'SOW Project Alpha',
          type:          'sow',
          value:         50000,
          currency:      'USD',
          effectiveDate: '2026-07-01',
          expiryDate:    '2027-06-30',
          content:       '<p>Scope of work details.</p>',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.value).toBe(50000);
      expect(body.currency).toBe('USD');
      expect(body.content).toBe('<p>Scope of work details.</p>');
    });

    it('rejects missing title with 400', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { type: 'nda' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor cannot create contracts (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'Attempt' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /contracts (with data) ─────────────────────────────────────────────

  describe('GET /contracts (with data)', () => {
    it('returns contracts with id and no _id', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/contracts' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].id).toBeDefined();
      expect(body[0]._id).toBeUndefined();
    });

    it('filters by status=draft', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/contracts?status=draft' });
      expect(res.statusCode).toBe(200);
      expect(res.json().every((c: any) => c.status === 'draft')).toBe(true);
    });

    it('filters by type=msa', async () => {
      const res = await authedRequest(app, adminCookie, { method: 'GET', url: '/contracts?type=msa' });
      expect(res.statusCode).toBe(200);
      expect(res.json().every((c: any) => c.type === 'msa')).toBe(true);
    });
  });

  // ── GET /contracts/:id ─────────────────────────────────────────────────────

  describe('GET /contracts/:id', () => {
    it('returns contract by id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/${contractId}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(contractId);
      expect(body._id).toBeUndefined();
      expect(Array.isArray(body.signerDetails)).toBe(true);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for malformed id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: '/contracts/not-valid',
      });
      expect(res.statusCode).toBe(400);
    });

    it('unauthenticated returns 401', async () => {
      const res = await app.inject({ method: 'GET', url: `/contracts/${contractId}` });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── PATCH /contracts/:id ───────────────────────────────────────────────────

  describe('PATCH /contracts/:id', () => {
    it('updates title and content', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/${contractId}`,
        payload: { title: 'Updated Agreement', content: '<p>Revised terms.</p>' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.title).toBe('Updated Agreement');
      expect(body.content).toBe('<p>Revised terms.</p>');
    });

    it('persists updated fields on GET', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/${contractId}`,
      });
      expect(res.json().title).toBe('Updated Agreement');
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/${new ObjectId()}`,
        payload: { title: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('contributor cannot update contracts (403)', async () => {
      const res = await authedRequest(app, contributorCookie, {
        method: 'PATCH', url: `/contracts/${contractId}`,
        payload: { title: 'Hijack' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── POST /contracts/:id/void ───────────────────────────────────────────────

  describe('POST /contracts/:id/void', () => {
    let voidContractId: string;

    it('creates a draft contract to void', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'To Be Voided' },
      });
      expect(res.statusCode).toBe(201);
      voidContractId = res.json().id;
    });

    it('voids a contract and returns { ok: true }', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${voidContractId}/void`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/${voidContractId}`,
      });
      expect(get.json().status).toBe('voided');
    });

    it('cannot void an already-voided contract (400)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${voidContractId}/void`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${new ObjectId()}/void`,
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH voided contract is rejected ─────────────────────────────────────

  describe('PATCH /contracts/:id — status guards', () => {
    it('cannot edit a voided contract (400)', async () => {
      // void the main contractId
      await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${contractId}/void`,
      });

      const res = await authedRequest(app, adminCookie, {
        method: 'PATCH', url: `/contracts/${contractId}`,
        payload: { title: 'Should fail' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── POST /contracts/:id/send ───────────────────────────────────────────────

  describe('POST /contracts/:id/send', () => {
    let sendContractId: string;

    it('creates a fresh draft contract', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'NDA for Signing', type: 'nda' },
      });
      expect(res.statusCode).toBe(201);
      sendContractId = res.json().id;
    });

    it('rejects send with no signers (400)', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${sendContractId}/send`,
        payload: { signers: [] },
      });
      expect(res.statusCode).toBe(400);
    });

    it('sends for signature and returns signerCount', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${sendContractId}/send`,
        payload: {
          signers: [{ name: 'Jane Doe', email: 'jane@client.com', role: 'client' }],
        },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);
      expect(res.json().signerCount).toBe(1);

      const get = await authedRequest(app, adminCookie, {
        method: 'GET', url: `/contracts/${sendContractId}`,
      });
      expect(get.json().status).toBe('pending_signature');
      expect(get.json().signers).toHaveLength(1);
      expect(get.json().signers[0].email).toBe('jane@client.com');
    });

    it('cannot re-send from pending_signature status (400)', async () => {
      // contract is now in pending_signature — route only allows draft or active
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${sendContractId}/send`,
        payload: {
          signers: [{ name: 'John A', email: 'john@client.com' }],
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${new ObjectId()}/send`,
        payload: { signers: [{ name: 'X', email: 'x@t.com' }] },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── Public signing flow ────────────────────────────────────────────────────

  describe('Public signing flow', () => {
    let signContractId: string;
    let signerToken: string;

    it('sets up a contract in pending_signature state', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'Sign Me', content: '<p>Terms here.</p>', type: 'custom' },
      });
      signContractId = create.json().id;

      await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${signContractId}/send`,
        payload: { signers: [{ name: 'Tester', email: 'tester@example.com', role: 'client' }] },
      });

      const signer = await getDb().collection('contract_signers').findOne({ email: 'tester@example.com' });
      signerToken = (signer as any).token;
    });

    it('GET /contracts/sign/:token returns contract and signer info', async () => {
      const res = await app.inject({ method: 'GET', url: `/contracts/sign/${signerToken}` });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.contract.title).toBe('Sign Me');
      expect(body.signer.email).toBe('tester@example.com');
      expect(body.signer.status).toBe('pending');
      expect(body.brand).toBeDefined();
    });

    it('GET /contracts/sign/:token with bad token returns 404', async () => {
      const res = await app.inject({ method: 'GET', url: '/contracts/sign/no-such-token' });
      expect(res.statusCode).toBe(404);
    });

    it('POST /contracts/sign/:token requires signatureData', async () => {
      const res = await app.inject({
        method: 'POST', url: `/contracts/sign/${signerToken}`,
        payload: { consent: true },
      });
      expect(res.statusCode).toBe(400);
    });

    it('POST /contracts/sign/:token requires consent', async () => {
      const res = await app.inject({
        method: 'POST', url: `/contracts/sign/${signerToken}`,
        payload: { signatureData: 'data:image/png;base64,abc' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('signs the contract and marks it fully executed', async () => {
      const res = await app.inject({
        method: 'POST', url: `/contracts/sign/${signerToken}`,
        payload: { signatureData: 'data:image/png;base64,abc123', consent: true },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);
      expect(res.json().fullyExecuted).toBe(true);

      const signer = await getDb().collection('contract_signers').findOne({ token: signerToken });
      expect((signer as any).status).toBe('signed');
    });

    it('cannot sign twice (400)', async () => {
      const res = await app.inject({
        method: 'POST', url: `/contracts/sign/${signerToken}`,
        payload: { signatureData: 'data:image/png;base64,def', consent: true },
      });
      expect(res.statusCode).toBe(400);
    });

    it('GET signed token returns alreadySigned=true', async () => {
      const res = await app.inject({ method: 'GET', url: `/contracts/sign/${signerToken}` });
      expect(res.statusCode).toBe(200);
      expect(res.json().alreadySigned).toBe(true);
    });
  });

  // ── Decline signing flow ───────────────────────────────────────────────────

  describe('Decline signing flow', () => {
    let declineToken: string;

    it('sets up a contract to decline', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'Decline Me', type: 'custom' },
      });
      const declineContractId = create.json().id;

      await authedRequest(app, adminCookie, {
        method: 'POST', url: `/contracts/${declineContractId}/send`,
        payload: { signers: [{ name: 'Decliner', email: 'decliner@example.com' }] },
      });

      const signer = await getDb().collection('contract_signers').findOne({ email: 'decliner@example.com' });
      declineToken = (signer as any).token;
    });

    it('declines the contract with a reason', async () => {
      const res = await app.inject({
        method: 'POST', url: `/contracts/sign/${declineToken}/decline`,
        payload: { reason: 'Not interested' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().ok).toBe(true);

      const signer = await getDb().collection('contract_signers').findOne({ token: declineToken });
      expect((signer as any).status).toBe('declined');
      expect((signer as any).declinedReason).toBe('Not interested');
    });

    it('cannot decline again after declining (400)', async () => {
      const res = await app.inject({
        method: 'POST', url: `/contracts/sign/${declineToken}/decline`,
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('GET declined token returns declined=true', async () => {
      const res = await app.inject({ method: 'GET', url: `/contracts/sign/${declineToken}` });
      expect(res.statusCode).toBe(200);
      expect(res.json().declined).toBe(true);
    });
  });

  // ── DELETE /contracts/:id ──────────────────────────────────────────────────

  describe('DELETE /contracts/:id', () => {
    it('deletes a draft contract and returns 204', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'Draft to Delete' },
      });
      const deleteId = create.json().id;

      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/${deleteId}`,
      });
      expect(res.statusCode).toBe(204);
    });

    it('cannot delete a non-draft (voided) contract (400)', async () => {
      // contractId is now voided
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/${contractId}`,
      });
      expect(res.statusCode).toBe(400);
    });

    it('contributor cannot delete contracts (403)', async () => {
      const create = await authedRequest(app, adminCookie, {
        method: 'POST', url: '/contracts',
        payload: { title: 'Protected Draft' },
      });
      const id = create.json().id;

      const res = await authedRequest(app, contributorCookie, {
        method: 'DELETE', url: `/contracts/${id}`,
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 404 for unknown id', async () => {
      const res = await authedRequest(app, adminCookie, {
        method: 'DELETE', url: `/contracts/${new ObjectId()}`,
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
