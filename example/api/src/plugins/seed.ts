import type { FastifyInstance } from 'fastify';

const ADMIN_PERMS = {
  users:     { create: true,  read: true,  update: true,  delete: true  },
  dashboard: { create: false, read: true,  update: false, delete: false },
  roles:     { create: true,  read: true,  update: true,  delete: true  },
  messages:  { create: true,  read: true,  update: true,  delete: true  }
};

const VIEWER_PERMS = {
  users:     { create: false, read: true,  update: false, delete: false },
  dashboard: { create: false, read: true,  update: false, delete: false },
  roles:     { create: false, read: false, update: false, delete: false },
  messages:  { create: true,  read: true,  update: true,  delete: true  }
};

// Upserts default roles on every boot — idempotent.
// $setOnInsert preserves manual permission edits made after first seed.
export default async function seedPlugin(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const roles = app.mongo.db!.collection('roles');
    const now   = new Date();

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
  });
}
