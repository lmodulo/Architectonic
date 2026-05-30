import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUserAndWorkspace } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

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

describe('GET /roles', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => ({ app, ownerCookie, viewerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can list roles', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/roles' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('permissions');
  });

  it('viewer gets 403 (no roles:read)', async () => {
    const res = await authedRequest(app, viewerCookie, { method: 'GET', url: '/roles' });
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/roles' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /roles', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => ({ app, ownerCookie, viewerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can create a role', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'moderator', label: 'Moderator', permissions: {} },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe('moderator');
    expect(body.id).toBeDefined();
  });

  it('duplicate name returns 409', async () => {
    await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'deduped', label: 'Deduped' },
    });
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'deduped', label: 'Deduped Again' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('viewer gets 403', async () => {
    const res = await authedRequest(app, viewerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'forbidden', label: 'Forbidden' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('missing required fields returns 400', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { label: 'No name' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /roles/:id', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let roleId: string;

  beforeAll(async () => {
    ({ app, ownerCookie } = await setup());
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'testrole', label: 'Test Role' },
    });
    roleId = res.json().id;
  });
  afterAll(async () => { await app.close(); await stopDb(); });

  it('returns the role by id', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: `/roles/${roleId}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('testrole');
  });

  it('returns 404 for unknown id', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/roles/000000000000000000000000' });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /roles/:id', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let roleId: string;

  beforeAll(async () => {
    ({ app, ownerCookie } = await setup());
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'patchable', label: 'Patchable' },
    });
    roleId = res.json().id;
  });
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can update label and permissions', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: `/roles/${roleId}`,
      payload: { label: 'Updated Label', permissions: { users: { create: true, read: true, update: false, delete: false } } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().updated).toBe(true);

    const getRes = await authedRequest(app, ownerCookie, { method: 'GET', url: `/roles/${roleId}` });
    expect(getRes.json().label).toBe('Updated Label');
  });

  it('returns 400 if trying to change role name', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: `/roles/${roleId}`,
      payload: { name: 'newname' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown id', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: '/roles/000000000000000000000000',
      payload: { label: 'Ghost' },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /roles/:id', () => {
  let app: FastifyInstance;
  let ownerCookie: string;

  beforeAll(async () => ({ app, ownerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can delete a role with no users assigned', async () => {
    const createRes = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/roles',
      payload: { name: 'deletable', label: 'Deletable' },
    });
    const roleId = createRes.json().id;

    const res = await authedRequest(app, ownerCookie, { method: 'DELETE', url: `/roles/${roleId}` });
    expect(res.statusCode).toBe(204);

    const getRes = await authedRequest(app, ownerCookie, { method: 'GET', url: `/roles/${roleId}` });
    expect(getRes.statusCode).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'DELETE', url: '/roles/000000000000000000000000' });
    expect(res.statusCode).toBe(404);
  });
});
