import type { FastifyInstance } from 'fastify';

// Ensures required MongoDB indexes exist at startup.
// createIndex is idempotent — safe to run on every boot.
export default async function ensureIndexes(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db = app.mongo.db!;
    await db.collection('users').createIndex({ email: 1 },    { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    // sessions TTL index is managed automatically by connect-mongo
  });
}
