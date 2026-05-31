import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { startDb, stopDb, getUri } from '../helpers/db.js';
import { createTestApp } from '../helpers/createApp.js';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await startDb();
    app = await createTestApp(getUri());
  });

  afterAll(async () => {
    await app.close();
    await stopDb();
  });

  it('returns status ok with mongo connected', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.mongo).toBe('connected');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });
});
