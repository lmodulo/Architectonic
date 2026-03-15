import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { FastifyInstance } from 'fastify';

const __dirname = dirname(fileURLToPath(import.meta.url));

const perms = JSON.parse(
  readFileSync(join(__dirname, '../data/permissions.json'), 'utf8')
) as Record<string, Record<string, Record<string, boolean>>>;

const DEFAULT_SETTINGS = [
  {
    key: 'app.name',
    value: 'Architectonic',
    type: 'string',
    label: 'Application Name',
    description: 'Display name shown in the browser title and header'
  },
  {
    key: 'app.registration_open',
    value: true,
    type: 'boolean',
    label: 'Open Registration',
    description: 'Allow new users to self-register without an invitation'
  },
  {
    key: 'theme.mode',
    value: 'light',
    type: 'select',
    label: 'Default Theme',
    description: 'Application color scheme for new sessions',
    options: ['light', 'dark']
  },
  {
    key: 'chat.enabled',
    value: true,
    type: 'boolean',
    label: 'AI Assistant',
    description: 'Show the AI chat assistant panel for authenticated users'
  }
];

// Upserts default roles on every boot — idempotent.
// $setOnInsert preserves manual permission edits made after first seed.
export default async function seedPlugin(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db   = app.mongo.db!;
    const now  = new Date();

    // Roles
    const roles = db.collection('roles');
    for (const [name, label, permissions] of [
      ['admin',  'Administrator', perms.admin],
      ['viewer', 'Viewer',        perms.viewer]
    ] as const) {
      await roles.updateOne(
        { name },
        {
          $setOnInsert: { name, createdAt: now },
          $set:         { label, permissions, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // Settings — $setOnInsert preserves user-edited values; $set keeps structural fields current
    const settings = db.collection('settings');
    for (const s of DEFAULT_SETTINGS) {
      await settings.updateOne(
        { key: s.key },
        {
          $setOnInsert: { value: s.value, createdAt: now, updatedBy: null },
          $set:         { type: s.type, label: s.label, description: s.description, options: (s as any).options ?? null, updatedAt: now }
        },
        { upsert: true }
      );
    }
  });
}
