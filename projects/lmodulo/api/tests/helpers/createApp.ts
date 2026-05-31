import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import mongodb from '@fastify/mongodb';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';

import sessionPlugin from '../../src/plugins/session.js';
import ensureIndexes from '../../src/plugins/indexes.js';
import authPlugin    from '../../src/plugins/auth.js';

import { dispatch } from '../../src/lib/notifications/dispatch.js';

// Routes — imported directly so Vitest's transform handles TypeScript correctly
import authRoutes          from '../../src/routes/auth/index.js';
import auditRoutes         from '../../src/routes/audit/index.js';
import healthRoutes        from '../../src/routes/health/index.js';
import messagesRoutes      from '../../src/routes/messages/index.js';
import notificationsRoutes from '../../src/routes/notifications/index.js';
import rolesRoutes         from '../../src/routes/roles/index.js';
import settingsRoutes      from '../../src/routes/settings/index.js';
import usersRoutes         from '../../src/routes/users/index.js';
import agileRoutes         from '../../src/routes/agile/index.js';

export async function createTestApp(mongoUri: string) {
  process.env.SESSION_SECRET = 'test-secret-minimum-32-chars-long!!';
  process.env.MONGO_URI = mongoUri;

  const app = Fastify({ logger: false });

  await app.register(cookie);
  await app.register(cors, { origin: true, credentials: true });
  await app.register(sensible);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await app.register(mongodb, { forceClose: true, url: mongoUri });
  await app.register(sessionPlugin);
  await app.register(ensureIndexes);
  await app.register(authPlugin);
  await app.register(websocket);

  app.decorate('wsConnections', new Map<string, Set<WebSocket>>());
  app.decorate('notify', (payload: Parameters<typeof dispatch>[1]) =>
    dispatch(app, payload)
  );

  await app.register(authRoutes,          { prefix: '/auth' });
  await app.register(auditRoutes,         { prefix: '/audit' });
  await app.register(healthRoutes,        { prefix: '/health' });
  await app.register(messagesRoutes,      { prefix: '/messages' });
  await app.register(notificationsRoutes, { prefix: '/notifications' });
  await app.register(rolesRoutes,         { prefix: '/roles' });
  await app.register(settingsRoutes,      { prefix: '/settings' });
  await app.register(usersRoutes,         { prefix: '/users' });
  await app.register(agileRoutes,         { prefix: '/agile' });

  await app.ready();
  return app;
}
