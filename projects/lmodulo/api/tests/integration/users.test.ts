import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUser } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

vi.mock('../../src/lib/email.js', () => ({
  sendInviteEmail:        vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordSetEmail:   vi.fn().mockResolvedValue(undefined),
  initEmailBrand:         vi.fn().mockResolvedValue(undefined),
}));

process.env.NODE_ENV = 'test';

async function setup() {
  await startDb();
  const app = await createTestApp(getUri());
  await seedRoles(getDb());
  await seedDefaultSettings(getDb());
  await createUser(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
  await createUser(getDb(), { username: 'viewer', email: 'viewer@t.com', password: 'pw123456', role: 'viewer' });
  const ownerCookie  = await loginAs(app, 'owner@t.com', 'pw123456');
  const viewerCookie = await loginAs(app, 'viewer@t.com', 'pw123456');
  return { app, ownerCookie, viewerCookie };
}

describe('POST /users/invite', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => ({ app, ownerCookie, viewerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can invite a new user', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'newuser@example.com', role: 'contributor', firstName: 'New', lastName: 'User' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.email).toBe('newuser@example.com');
    expect(body.status).toBe('pending');
    expect(body.role).toBe('contributor');
  });

  it('creates a pending user doc with an invite token in the DB', async () => {
    await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'tokencheck@example.com', role: 'viewer' },
    });
    const user = await getDb().collection('users').findOne({ email: 'tokencheck@example.com' });
    expect(user).not.toBeNull();
    expect(user!.inviteToken).toBeDefined();
    expect(user!.status).toBe('pending');
  });

  it('returns 409 for an already-invited email', async () => {
    await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'dup@example.com', role: 'viewer' },
    });
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'dup@example.com', role: 'viewer' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 404 for a non-existent role', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'norole@example.com', role: 'nonexistent-role' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('viewer gets 403 (no users:create)', async () => {
    const res = await authedRequest(app, viewerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'x@example.com', role: 'viewer' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /users/invite/accept', () => {
  let app: FastifyInstance;
  let ownerCookie: string;

  beforeAll(async () => ({ app, ownerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  async function inviteUser(email: string): Promise<string> {
    await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email, role: 'contributor' },
    });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await getDb().collection('users').updateOne({ email }, { $set: { inviteToken: hash } });
    return rawToken;
  }

  it('valid token allows accepting the invite', async () => {
    const token = await inviteUser('accept@example.com');
    const res = await app.inject({
      method: 'POST', url: '/users/invite/accept',
      payload: { token, username: 'accepted', password: 'newpassword1' },
    });
    expect(res.statusCode).toBe(204);

    const user = await getDb().collection('users').findOne({ email: 'accept@example.com' });
    expect(user!.status).toBe('active');
    expect(user!.inviteToken).toBeUndefined();
  });

  it('returns 400 for an invalid token', async () => {
    const res = await app.inject({
      method: 'POST', url: '/users/invite/accept',
      payload: { token: 'bogustoken', username: 'hacker', password: 'newpassword1' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 for a duplicate username', async () => {
    const token = await inviteUser('conflict@example.com');
    const res = await app.inject({
      method: 'POST', url: '/users/invite/accept',
      payload: { token, username: 'owner', password: 'newpassword1' },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('GET /users', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => ({ app, ownerCookie, viewerCookie } = await setup()));
  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can list users', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/users' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.users ?? body).toBeDefined();
  });

  it('viewer cannot create users (no users:create) — 403', async () => {
    const res = await authedRequest(app, viewerCookie, {
      method: 'POST', url: '/users/invite',
      payload: { email: 'block@example.com', role: 'viewer' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('response never contains passwordHash', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/users' });
    expect(res.body).not.toContain('passwordHash');
  });
});
