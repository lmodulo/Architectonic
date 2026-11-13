import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUserAndWorkspace } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';

vi.mock('../../src/lib/email.js', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendInviteEmail:        vi.fn().mockResolvedValue(undefined),
}));

// NODE_ENV=test so SALT_ROUNDS=1 in auth routes
process.env.NODE_ENV = 'test';

describe('POST /auth/register', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('first user gets owner role and 201', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'firstuser', email: 'first@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.role).toBe('owner');
    expect(body.username).toBe('firstuser');
    expect(body.email).toBe('first@example.com');
  });

  it('subsequent user gets customer role', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'customer1', email: 'customer@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().role).toBe('customer');
  });

  it('duplicate email returns 409', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'another', email: 'first@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('duplicate username returns 409', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'firstuser', email: 'other@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(409);
  });

  it('returns 403 when registration is closed', async () => {
    await getDb().collection('settings').updateOne(
      { key: 'app.registration_open' },
      { $set: { value: false } }
    );

    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'blocked', email: 'blocked@example.com', password: 'password123' },
    });
    expect(res.statusCode).toBe(403);

    await getDb().collection('settings').updateOne(
      { key: 'app.registration_open' },
      { $set: { value: true } }
    );
  });

  it('returns 400 for short password', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'shortpw', email: 'shortpw@example.com', password: 'short' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('response never contains passwordHash', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/register',
      payload: { username: 'nohash', email: 'nohash@example.com', password: 'password123' },
    });
    expect(res.body).not.toContain('passwordHash');
  });
});

describe('POST /auth/login', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), {
      username: 'loginuser', email: 'login@test.com', password: 'pass1234', role: 'admin',
    });
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('successful login returns user data and sets session cookie', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/login',
      payload: { email: 'login@test.com', password: 'pass1234' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe('login@test.com');
    expect(body.role).toBe('admin');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('wrong password returns generic 401 (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/login',
      payload: { email: 'login@test.com', password: 'wrongpassword' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().message).toBe('Invalid credentials');
  });

  it('unknown email returns generic 401 (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/login',
      payload: { email: 'nobody@test.com', password: 'pass1234' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().message).toBe('Invalid credentials');
  });

  it('response never contains passwordHash', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/login',
      payload: { email: 'login@test.com', password: 'pass1234' },
    });
    expect(res.body).not.toContain('passwordHash');
  });
});

describe('POST /auth/logout', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), {
      username: 'logoutuser', email: 'logout@test.com', password: 'pass1234', role: 'owner',
    });
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('returns 204 and session is invalidated', async () => {
    const cookie = await loginAs(app, 'logout@test.com', 'pass1234');

    const logout = await app.inject({
      method: 'POST', url: '/auth/logout',
      headers: { cookie },
    });
    expect(logout.statusCode).toBe(204);

    // Session cookie no longer authenticates
    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(401);
  });
});

describe('GET /auth/me', () => {
  let app: FastifyInstance;
  let sessionCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), {
      username: 'meuser', email: 'me@test.com', password: 'pass1234', role: 'owner',
    });
    sessionCookie = await loginAs(app, 'me@test.com', 'pass1234');
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('returns user with permissions when authenticated', async () => {
    const res = await authedRequest(app, sessionCookie, { method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.email).toBe('me@test.com');
    expect(body.role).toBe('owner');
    expect(body.permissions).toBeDefined();
    expect(typeof body.permissions).toBe('object');
  });

  it('passwordHash is never included in the response', async () => {
    const res = await authedRequest(app, sessionCookie, { method: 'GET', url: '/auth/me' });
    expect(res.body).not.toContain('passwordHash');
  });

  it('unauthenticated request returns 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /auth/config', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedDefaultSettings(getDb());
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('returns registrationOpen: true by default', async () => {
    const res = await app.inject({ method: 'GET', url: '/auth/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json().registrationOpen).toBe(true);
  });

  it('reflects the current registration setting', async () => {
    await getDb().collection('settings').updateOne(
      { key: 'app.registration_open' }, { $set: { value: false } }
    );
    const res = await app.inject({ method: 'GET', url: '/auth/config' });
    expect(res.json().registrationOpen).toBe(false);
  });
});

describe('POST /auth/forgot-password', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), {
      username: 'resetuser', email: 'reset@test.com', password: 'pass1234', role: 'owner',
    });
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('always returns 204 for a known email', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/forgot-password',
      payload: { email: 'reset@test.com' },
    });
    expect(res.statusCode).toBe(204);
  });

  it('always returns 204 for an unknown email (no enumeration)', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/forgot-password',
      payload: { email: 'nobody@test.com' },
    });
    expect(res.statusCode).toBe(204);
  });

  it('writes a reset token for a known user', async () => {
    await app.inject({
      method: 'POST', url: '/auth/forgot-password',
      payload: { email: 'reset@test.com' },
    });

    const user = await getDb().collection('users').findOne({ email: 'reset@test.com' });
    expect(user!.resetToken).toBeDefined();
    expect(user!.resetTokenExpires).toBeInstanceOf(Date);
  });

  it('does NOT write a reset token for an unknown email', async () => {
    const before = await getDb().collection('users').countDocuments({ resetToken: { $exists: true } });
    await app.inject({
      method: 'POST', url: '/auth/forgot-password',
      payload: { email: 'nobody@test.com' },
    });
    const after = await getDb().collection('users').countDocuments({ resetToken: { $exists: true } });
    expect(after).toBe(before);
  });
});

describe('POST /auth/reset-password', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), {
      username: 'pwreset', email: 'pwreset@test.com', password: 'oldpassword', role: 'owner',
    });
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  async function plantToken(email: string, expiresSoon = false) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await getDb().collection('users').updateOne(
      { email },
      { $set: { resetToken: hash, resetTokenExpires: new Date(Date.now() + (expiresSoon ? -1000 : 3_600_000)) } }
    );
    return rawToken;
  }

  it('returns 204 and clears the token on valid reset', async () => {
    const token = await plantToken('pwreset@test.com');
    const res = await app.inject({
      method: 'POST', url: '/auth/reset-password',
      payload: { token, password: 'newpassword1' },
    });
    expect(res.statusCode).toBe(204);

    const user = await getDb().collection('users').findOne({ email: 'pwreset@test.com' });
    expect(user!.resetToken).toBeUndefined();
    expect(user!.resetTokenExpires).toBeUndefined();
  });

  it('returns 400 for an expired token', async () => {
    const token = await plantToken('pwreset@test.com', true);
    const res = await app.inject({
      method: 'POST', url: '/auth/reset-password',
      payload: { token, password: 'newpassword2' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for an invalid/unknown token', async () => {
    const res = await app.inject({
      method: 'POST', url: '/auth/reset-password',
      payload: { token: 'totallyfaketoken', password: 'newpassword3' },
    });
    expect(res.statusCode).toBe(400);
  });
});
