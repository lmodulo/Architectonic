import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import mongodb from '@fastify/mongodb';
import sessionPlugin from './plugins/session.js';
import ensureIndexes from './plugins/indexes.js';
import authPlugin    from './plugins/auth.js';
import seedPlugin    from './plugins/seed.js';
import healthRoutes  from './routes/health.js';
import exampleRoutes from './routes/example.js';
import authRoutes    from './routes/auth.js';
import usersRoutes   from './routes/users.js';
import rolesRoutes   from './routes/roles.js';

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

await app.register(mongodb, {
  forceClose: true,
  url: MONGO_URI
});

await app.register(sessionPlugin); // Must come after mongodb (shares MONGO_URI)
await app.register(ensureIndexes); // Creates user/roles indexes on first boot
await app.register(authPlugin);    // Decorates requireAuth + requirePermission
await app.register(seedPlugin);    // Upserts default roles on every boot

// --- Routes ---

await app.register(healthRoutes);
await app.register(exampleRoutes, { prefix: '/examples' });
await app.register(authRoutes,    { prefix: '/auth' });
await app.register(usersRoutes,   { prefix: '/users' });
await app.register(rolesRoutes,   { prefix: '/roles' });

// --- Start ---

try {
  await app.listen({ host: HOST, port: PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
