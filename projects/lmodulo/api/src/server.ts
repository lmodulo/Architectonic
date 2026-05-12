import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import mongodb from '@fastify/mongodb';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import autoload from '@fastify/autoload';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import sessionPlugin   from './plugins/session.js';
import ensureIndexes  from './plugins/indexes.js';
import authPlugin     from './plugins/auth.js';
import seedPlugin     from './plugins/seed.js';
import schedulerPlugin from './plugins/scheduler.js';
import { dispatch }  from './lib/notifications/dispatch.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST      = process.env.HOST      ?? '0.0.0.0';
const PORT      = Number(process.env.PORT ?? 4000);
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/appdb';

const app = Fastify({
  logger: {
    level: 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined
  }
});

// --- Plugins ---

await app.register(cookie);

await app.register(cors, {
  origin: process.env.FRONTEND_ORIGIN ?? true,
  credentials: true // Required: allows session cookies to be sent cross-origin
});

await app.register(sensible); // Adds httpErrors, to, assert helpers

await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB cap

await app.register(fastifyStatic, {
  root: join(__dirname, '../uploads'),
  prefix: '/uploads/'
});

await app.register(mongodb, {
  forceClose: true,
  url: MONGO_URI
});

await app.register(sessionPlugin); // Must come after mongodb (shares MONGO_URI)
await app.register(ensureIndexes);   // Creates user/roles indexes on first boot
await app.register(authPlugin);      // Decorates requireAuth + requirePermission
await app.register(seedPlugin);      // Upserts default roles on every boot
await app.register(schedulerPlugin); // Recurring invoice + subscription billing runner

// WebSocket support — must register before autoload so WS routes work
await app.register(websocket);

// Connection registry: userId → Set of active WebSocket connections
app.decorate('wsConnections', new Map<string, Set<WebSocket>>());

// Notification dispatcher — available to all routes via app.notify()
app.decorate('notify', (payload: Parameters<typeof dispatch>[1]) =>
  dispatch(app, payload)
);

// API docs — dev only: GET /docs/yaml  GET /docs/json
if (process.env.NODE_ENV !== 'production') {
  await app.register(swagger, {
    openapi: {
      info: { title: 'Architectonic API', version: '1.0.0' },
      components: {
        securitySchemes: {
          session: { type: 'apiKey', in: 'cookie', name: 'session' }
        }
      }
    }
  });
}

// --- Routes ---

await app.register(autoload, {
  dir: join(__dirname, 'routes'),
  dirNameRoutePrefix: true
});

// --- Start ---

try {
  await app.listen({ host: HOST, port: PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
