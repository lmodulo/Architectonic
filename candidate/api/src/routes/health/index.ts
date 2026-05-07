import type { FastifyInstance } from 'fastify';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/', {
    schema: {
      summary: 'Server health check',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            mongo: { type: 'string' },
            uptime: { type: 'number' }
          }
        }
      }
    }
  }, async () => {
    // Check MongoDB connection
    let mongo = 'disconnected';
    try {
      const db = app.mongo.db;
      if (db) {
        await db.command({ ping: 1 });
        mongo = 'connected';
      }
    } catch {
      mongo = 'error';
    }

    return {
      status: 'ok',
      mongo,
      uptime: process.uptime()
    };
  });
}
