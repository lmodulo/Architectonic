import type { FastifyInstance } from 'fastify';

const ADMIN_PERMS = {
  users:     { create: true,  read: true,  update: true,  delete: true  },
  dashboard: { create: false, read: true,  update: false, delete: false },
  roles:     { create: true,  read: true,  update: true,  delete: true  },
  messages:  { create: true,  read: true,  update: true,  delete: true  },
  audit:     { create: false, read: true,  update: false, delete: false },
  settings:  { create: false, read: true,  update: true,  delete: false }
};

const VIEWER_PERMS = {
  users:     { create: false, read: true,  update: false, delete: false },
  dashboard: { create: false, read: true,  update: false, delete: false },
  roles:     { create: false, read: false, update: false, delete: false },
  messages:  { create: true,  read: true,  update: true,  delete: true  },
  audit:     { create: false, read: false, update: false, delete: false },
  settings:  { create: false, read: false, update: false, delete: false }
};

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
      ['admin',  'Administrator', ADMIN_PERMS],
      ['viewer', 'Viewer',        VIEWER_PERMS]
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
