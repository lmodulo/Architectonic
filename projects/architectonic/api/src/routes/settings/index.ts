import type { FastifyInstance } from 'fastify';
import { logAudit } from '../../lib/audit.js';

export default async function settingsRoutes(app: FastifyInstance) {

  // GET /settings
  app.get('/', {
    preHandler: app.requirePermission('settings', 'read'),
    schema: { summary: 'List all application settings' }
  }, async () => {
    const settings = await app.mongo.db!.collection('settings')
      .find({})
      .sort({ key: 1 })
      .toArray();
    return settings.map(s => ({
      key:         s.key,
      value:       s.value,
      type:        s.type,
      label:       s.label,
      description: s.description,
      options:     s.options ?? null,
      updatedAt:   s.updatedAt,
      updatedBy:   s.updatedBy ?? null
    }));
  });

  // GET /settings/:key — requireAuth only: individual settings readable by all authenticated users
  app.get<{ Params: { key: string } }>('/:key', {
    preHandler: app.requireAuth,
    schema: { summary: 'Get a single setting by key' }
  }, async (req, reply) => {
    const s = await app.mongo.db!.collection('settings').findOne({ key: req.params.key });
    if (!s) return reply.notFound('Setting not found');
    return { key: s.key, value: s.value, type: s.type, label: s.label, description: s.description, options: s.options ?? null };
  });

  // PATCH /settings/:key
  app.patch<{ Params: { key: string }; Body: { value: unknown } }>('/:key', {
    preHandler: app.requirePermission('settings', 'update'),
    schema: {
      summary: 'Update a setting value',
      body: {
        type: 'object',
        required: ['value'],
        properties: { value: {} }
      }
    }
  }, async (req, reply) => {
    const result = await app.mongo.db!.collection('settings').updateOne(
      { key: req.params.key },
      { $set: { value: req.body.value, updatedAt: new Date(), updatedBy: req.session.userId ?? null } }
    );
    if (result.matchedCount === 0) return reply.notFound('Setting not found');

    logAudit(app.mongo.db!, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'setting.update',
      resourceId: req.params.key,
      meta:       { value: req.body.value },
      ip:         req.ip
    });

    return { updated: true };
  });
}
