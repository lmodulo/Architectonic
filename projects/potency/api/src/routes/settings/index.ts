import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { FastifyInstance } from 'fastify';
import { logAudit } from '../../lib/audit.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  // POST /settings/logo — upload a logo image
  app.post('/logo', {
    preHandler: app.requirePermission('settings', 'update')
  }, async (req, reply) => {
    const file = await req.file();
    if (!file) return reply.badRequest('No file uploaded');
    if (!file.mimetype.startsWith('image/')) return reply.badRequest('File must be an image');

    const buf = await file.toBuffer();
    const ext = (file.filename.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const filename = `logo.${ext}`;
    const logoDir = join(__dirname, '../../../uploads/logo');

    if (!existsSync(logoDir)) mkdirSync(logoDir, { recursive: true });
    writeFileSync(join(logoDir, filename), buf);

    const url = `/uploads/logo/${filename}`;

    await app.mongo.db!.collection('settings').updateOne(
      { key: 'app.logo' },
      { $set: { value: url, updatedAt: new Date(), updatedBy: req.session.userId ?? null } }
    );

    logAudit(app.mongo.db!, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'setting.update',
      resourceId: 'app.logo',
      meta:       { url },
      ip:         req.ip
    });

    return { url };
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
