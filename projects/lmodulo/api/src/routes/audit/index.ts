import type { FastifyInstance } from 'fastify';

const SORT_FIELDS = new Set(['createdAt', 'username', 'action', 'ip']);

export default async function auditRoutes(app: FastifyInstance) {

  // GET /audit
  app.get<{ Querystring: { limit?: string; skip?: string; action?: string; q?: string; sort?: string; sortDir?: string } }>('/', {
    preHandler: app.requirePermission('audit', 'read'),
    schema: {
      summary: 'List recent audit log entries',
      querystring: {
        type: 'object',
        properties: {
          limit:   { type: 'string' },
          skip:    { type: 'string' },
          action:  { type: 'string' },
          q:       { type: 'string' },
          sort:    { type: 'string' },
          sortDir: { type: 'string' }
        }
      }
    }
  }, async (req) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const skip  = Number(req.query.skip ?? 0);

    const sortField = SORT_FIELDS.has(req.query.sort ?? '') ? req.query.sort! : 'createdAt';
    const sortDir   = req.query.sortDir === 'asc' ? 1 : -1;

    const filter: Record<string, unknown> = {};
    if (req.query.action) {
      filter.action = new RegExp(`^${req.query.action}\\.`);
    }
    if (req.query.q) {
      filter.username = new RegExp(req.query.q, 'i');
    }

    const collection = app.mongo.db!.collection('audit_logs');
    const [entries, count] = await Promise.all([
      collection.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter)
    ]);

    return {
      entries: entries.map(e => ({
        id:         e._id.toString(),
        userId:     e.userId,
        username:   e.username,
        action:     e.action,
        resourceId: e.resourceId ?? null,
        meta:       e.meta ?? {},
        ip:         e.ip ?? null,
        createdAt:  e.createdAt
      })),
      count
    };
  });
}
