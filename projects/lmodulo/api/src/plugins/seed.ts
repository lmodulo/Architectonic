import bcrypt from 'bcryptjs';
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
    key: 'brand.name',
    value: '',
    type: 'string',
    label: 'Brand Name',
    description: 'Text shown in the app header (mutually exclusive with Brand Logo)'
  },
  {
    key: 'brand.logo',
    value: '',
    type: 'string',
    label: 'Brand Logo',
    description: 'Logo image URL shown in the header (managed via the logo upload UI; mutually exclusive with Brand Name)'
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

// Roles to seed: [name, label]
const ROLES: [string, string][] = [
  ['owner',       'Owner'],
  ['admin',       'Administrator'],
  ['lead',        'Lead'],
  ['contributor', 'Contributor'],
  ['viewer',      'Viewer'],
  ['customer',    'Customer'],
];

// Seed users for each agile role: [username, firstName, role]
const SEED_USERS: [string, string, string][] = [
  ['owner',       'Owner',       'owner'],
  ['admin',       'Admin',       'admin'],
  ['lead',        'Lead',        'lead'],
  ['contributor', 'Contributor', 'contributor'],
];

// Upserts default roles on every boot — idempotent.
// $setOnInsert preserves manual permission edits made after first seed.
export default async function seedPlugin(app: FastifyInstance) {
  app.addHook('onReady', async () => {
    const db   = app.mongo.db!;
    const now  = new Date();

    // ── Roles ────────────────────────────────────────────────────────
    const roles = db.collection('roles');
    for (const [name, label] of ROLES) {
      const permissions = perms[name] ?? {};
      await roles.updateOne(
        { name },
        {
          $setOnInsert: { name, createdAt: now },
          $set:         { label, permissions, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // ── Seed users (username = password = role name) ──────────────────
    const users = db.collection('users');
    for (const [username, firstName, role] of SEED_USERS) {
      const existing = await users.findOne({ username });
      if (!existing) {
        const passwordHash = await bcrypt.hash(username, 12);
        await users.insertOne({
          username,
          email:     `${username}@example.com`,
          passwordHash,
          firstName,
          lastName:  '',
          role,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // ── Settings — $setOnInsert preserves user-edited values ──────────
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
