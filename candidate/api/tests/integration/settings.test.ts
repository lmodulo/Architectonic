import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startDb, stopDb, getUri, getDb } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';
import { seedRoles, seedDefaultSettings, createUserAndWorkspace } from '../helpers/fixtures.js';
import { loginAs, authedRequest } from '../helpers/session.js';
import { buildMultipart, TINY_JPEG } from '../helpers/multipart.js';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, existsSync: vi.fn().mockReturnValue(true), mkdirSync: vi.fn(), writeFileSync: vi.fn() };
});

describe('GET /settings', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
    await createUserAndWorkspace(getDb(), { username: 'viewer', email: 'viewer@t.com', password: 'pw123456', role: 'viewer' });
    ownerCookie  = await loginAs(app, 'owner@t.com', 'pw123456');
    viewerCookie = await loginAs(app, 'viewer@t.com', 'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can list settings', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/settings' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((s: { key: string }) => s.key === 'app.registration_open')).toBe(true);
  });

  it('viewer gets 403 (no settings:read)', async () => {
    const res = await authedRequest(app, viewerCookie, { method: 'GET', url: '/settings' });
    expect(res.statusCode).toBe(403);
  });

  it('unauthenticated gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/settings' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /settings/:key', () => {
  let app: FastifyInstance;
  let ownerCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
    ownerCookie = await loginAs(app, 'owner@t.com', 'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('returns a known setting by key', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/settings/app.registration_open' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.key).toBe('app.registration_open');
    expect(body).toHaveProperty('value');
  });

  it('returns 404 for an unknown key', async () => {
    const res = await authedRequest(app, ownerCookie, { method: 'GET', url: '/settings/does.not.exist' });
    expect(res.statusCode).toBe(404);
  });

  it('unauthenticated gets 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/settings/app.registration_open' });
    expect(res.statusCode).toBe(401);
  });
});

describe('PATCH /settings/:key', () => {
  let app: FastifyInstance;
  let ownerCookie: string;
  let viewerCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
    await createUserAndWorkspace(getDb(), { username: 'viewer', email: 'viewer@t.com', password: 'pw123456', role: 'viewer' });
    ownerCookie  = await loginAs(app, 'owner@t.com', 'pw123456');
    viewerCookie = await loginAs(app, 'viewer@t.com', 'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can update a setting', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: '/settings/brand.name',
      payload: { value: 'My Brand' },
    });
    expect(res.statusCode).toBe(200);

    const setting = await getDb().collection('settings').findOne({ key: 'brand.name' });
    expect(setting!.value).toBe('My Brand');
  });

  it('returns 404 for an unknown key', async () => {
    const res = await authedRequest(app, ownerCookie, {
      method: 'PATCH', url: '/settings/unknown.key',
      payload: { value: 'x' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('viewer gets 403 (no settings:update)', async () => {
    const res = await authedRequest(app, viewerCookie, {
      method: 'PATCH', url: '/settings/brand.name',
      payload: { value: 'Hacked' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /settings/logo', () => {
  let app: FastifyInstance;
  let ownerCookie: string;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
    await seedRoles(getDb());
    await seedDefaultSettings(getDb());
    await createUserAndWorkspace(getDb(), { username: 'owner', email: 'owner@t.com', password: 'pw123456', role: 'owner' });
    ownerCookie = await loginAs(app, 'owner@t.com', 'pw123456');
  });

  afterAll(async () => { await app.close(); await stopDb(); });

  it('owner can upload a logo image', async () => {
    const { body, contentType } = buildMultipart([{
      name: 'file', filename: 'logo.jpg', content: TINY_JPEG, contentType: 'image/jpeg',
    }]);

    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/settings/logo',
      headers: { 'content-type': contentType },
      body,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().url).toMatch(/^\/uploads\/logo\//);
  });

  it('rejects non-image files', async () => {
    const { body, contentType } = buildMultipart([{
      name: 'file', filename: 'evil.txt', content: Buffer.from('not an image'), contentType: 'text/plain',
    }]);

    const res = await authedRequest(app, ownerCookie, {
      method: 'POST', url: '/settings/logo',
      headers: { 'content-type': contentType },
      body,
    });
    expect(res.statusCode).toBe(400);
  });
});
