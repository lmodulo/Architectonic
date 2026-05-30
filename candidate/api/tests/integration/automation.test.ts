import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUserAndWorkspace } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

vi.mock('../../src/lib/email.js', () => ({
  sendInviteEmail:        vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

async function setup() {
  await startDb();
  const app = await createTestApp(getUri());
  await seedRoles(getDb());
  await seedDefaultSettings(getDb());
  await createUserAndWorkspace(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
  await createUserAndWorkspace(getDb(), { username: 'viewer', email: 'viewer@t.com', password: 'pw123456', role: 'viewer' });
  const ownerCookie  = await loginAs(app, 'owner@t.com', 'pw123456');
  const viewerCookie = await loginAs(app, 'viewer@t.com', 'pw123456');
  return { app, ownerCookie, viewerCookie };
}

const validRulePayload = {
  name:    'Welcome notification',
  trigger: { event: 'auth.user.registered', conditions: [] },
  actions: [{ type: 'notification.send', params: { title: 'Welcome {{user.username}}!' } }],
};

describe('GET /automation', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => ({ app, ownerCookie, viewerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can list rules', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/automation' });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json())).toBe(true);
  });

  it('viewer gets 403', async () => {
    const res = await authedRequest(app, viewerCookie, { method: 'GET', url: '/automation' });
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/automation' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /automation/meta', () => {
  let app: FastifyInstance;
  let ownerCookie: string;

  beforeAll(async () => ({ app, ownerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('returns available trigger events and action types', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/automation/meta' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.triggerEvents)).toBe(true);
    expect(Array.isArray(body.actionTypes)).toBe(true);
    expect(body.triggerEvents).toContain('auth.user.registered');
  });
});

describe('POST /automation', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => ({ app, ownerCookie, viewerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can create a rule', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/automation',
      payload: validRulePayload,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeDefined();
  });

  it('returns 400 for unknown trigger event', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/automation',
      payload: { ...validRulePayload, trigger: { event: 'totally.fake.event', conditions: [] } },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for empty actions array', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/automation',
      payload: { ...validRulePayload, actions: [] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('viewer gets 403', async () => {
    const res = await authedRequest(app, viewerCookie, {
      method: 'POST', url: '/automation',
      payload: validRulePayload,
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('PATCH /automation/:id', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let ruleId: string;

  beforeAll(async () => {
    ({ app, ownerCookie } = await setup());
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/automation',
      payload: validRulePayload,
    });
    ruleId = res.json().id;
  });
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can disable a rule', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: `/automation/${ruleId}`,
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(200);

    const rule = await getDb().collection('automation_rules').findOne({});
    expect(rule!.enabled).toBe(false);
  });

  it('returns 404 for unknown id', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: '/automation/000000000000000000000000',
      payload: { enabled: false },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /automation/:id', () => {
  let app: FastifyInstance;
  let ownerCookie: string;

  beforeAll(async () => ({ app, ownerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can delete a rule', async () => {
    const create = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/automation',
      payload: validRulePayload,
    });
    const ruleId = create.json().id;

    const res = await authedRequest(app, ownerCookie, { method: 'DELETE', url: `/automation/${ruleId}` });
    expect(res.statusCode).toBe(200);

    const rule = await getDb().collection('automation_rules').findOne({});
    expect(rule).toBeNull();
  });
});

describe('GET /automation/:id/logs', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let ruleId: string;

  beforeAll(async () => {
    ({ app, ownerCookie } = await setup());
    const create = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/automation',
      payload: validRulePayload,
    });
    ruleId = create.json().id;

    // Seed a log entry
    const { ObjectId } = await import('mongodb');
    await getDb().collection('automation_logs').insertOne({
      ruleId:    new ObjectId(ruleId),
      ruleName:  'test',
      event:     'auth.user.registered',
      payload:   {},
      success:   true,
      error:     null,
      executedAt: new Date(),
    });
  });
  afterAll(async () => { await app.close(); await stopDb(); });

  it('returns execution logs for a rule', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: `/automation/${ruleId}/logs` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.logs)).toBe(true);
    expect(body.logs.length).toBeGreaterThan(0);
    expect(body.logs[0]).toHaveProperty('success');
  });
});
