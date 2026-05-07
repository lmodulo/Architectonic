import type { FastifyInstance } from 'fastify';

export default async function auditRoutes(app: FastifyInstance) {

  // GET /audit
  app.get<{ Querystring: { limit?: string; skip?: string } }>('/', {
    preHandler: app.requirePermission('audit', 'read'),
    schema: {
      summary: 'List recent audit log entries',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string' },
          skip:  { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const skip  = Number(req.query.skip ?? 0);

    const entries = await app.mongo.db!
      .collection('audit_logs')
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return entries.map(e => ({
      id:         e._id.toString(),
      userId:     e.userId,
      username:   e.username,
      action:     e.action,
      resourceId: e.resourceId ?? null,
      meta:       e.meta ?? {},
      ip:         e.ip ?? null,
      createdAt:  e.createdAt
    }));
  });
}
