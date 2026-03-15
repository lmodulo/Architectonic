import type { FastifyInstance } from 'fastify';

// Ensures required MongoDB indexes exist at startup.
// createIndex is idempotent — safe to run on every boot.
export default async function ensureIndexes(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db = app.mongo.db!;
    await db.collection('users').createIndex({ email: 1 },    { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('roles').createIndex({ name: 1 },     { unique: true });
    // sessions TTL index is managed automatically by connect-mongo

    // messages
    await db.collection('messages').createIndex({ threadId: 1, createdAt: 1 });
    await db.collection('messages').createIndex({ from: 1, createdAt: -1 });

    // message_state
    await db.collection('message_state').createIndex({ userId: 1, deleted: 1, read: 1 });
    await db.collection('message_state').createIndex({ messageId: 1, userId: 1 }, { unique: true });

    // settings
    await db.collection('settings').createIndex({ key: 1 }, { unique: true });

    // audit_logs
    await db.collection('audit_logs').createIndex({ createdAt: -1 });
    await db.collection('audit_logs').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('audit_logs').createIndex({ action: 1, createdAt: -1 });
  });
}
