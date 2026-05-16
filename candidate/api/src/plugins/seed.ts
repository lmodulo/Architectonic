import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fp from 'fastify-plugin';

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

const ROLES: [string, string][] = [
  ['owner',       'Owner'],
  ['admin',       'Administrator'],
  ['lead',        'Lead'],
  ['contributor', 'Contributor'],
  ['viewer',      'Viewer'],
  ['customer',    'Customer'],
];

interface SeedUser {
  username:  string;
  email:     string;
  password:  string;
  firstName: string;
  lastName:  string;
  role:      string;
}

const SEED_USERS: SeedUser[] = [
  { username: 'jnicora', email: 'joenicora@me.com',   password: 'j-password',      firstName: 'Joe',    lastName: 'Nicora', role: 'owner'       },
  { username: 'knicora', email: 'kylenicora@me.com',  password: 'k-password',      firstName: 'Kyle',   lastName: 'Nicora', role: 'admin'       },
  { username: 'owner',   email: 'owner@example.com',  password: 'owner-password',  firstName: 'Owner',  lastName: '',       role: 'owner'       },
  { username: 'admin',   email: 'admin@example.com',  password: 'admin-password',  firstName: 'Admin',  lastName: '',       role: 'admin'       },
  { username: 'alex',    email: 'alex@example.com',   password: 'alex-password',   firstName: 'Alex',   lastName: 'Chen',   role: 'lead'        },
  { username: 'jordan',  email: 'jordan@example.com', password: 'jordan-password', firstName: 'Jordan', lastName: 'Rivera', role: 'contributor' },
  { username: 'sam',     email: 'sam@example.com',    password: 'sam-password',    firstName: 'Sam',    lastName: 'Park',   role: 'contributor' },
  { username: 'riley',   email: 'riley@example.com',  password: 'riley-password',  firstName: 'Riley',  lastName: 'Morgan', role: 'contributor' },
];

export default fp(async function seedPlugin(app: any) {
  app.addHook('onReady', async () => {
    const db  = app.mongo.db!;
    const now = new Date();

    // ── Roles ─────────────────────────────────────────────────────────
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

    // ── Users (no role field — role lives in workspace_members) ───────
    const users = db.collection('users');
    for (const u of SEED_USERS) {
      const existing = await users.findOne({ username: u.username });
      if (!existing) {
        const passwordHash = await bcrypt.hash(u.password, 12);
        await users.insertOne({
          username:    u.username,
          email:       u.email,
          passwordHash,
          firstName:   u.firstName,
          lastName:    u.lastName,
          avatarUrl:   '',
          avatarColor: '',
          createdAt:   now,
          updatedAt:   now,
        });
      }
    }

    // ── Default workspace ─────────────────────────────────────────────
    const workspacesColl = db.collection('workspaces');
    const ownerUser = await users.findOne({ username: 'jnicora' });
    await workspacesColl.updateOne(
      { slug: 'default' },
      {
        $setOnInsert: { slug: 'default', createdAt: now },
        $set: {
          name:        'Default',
          description: 'Default workspace',
          logoUrl:     '',
          ownerId:     ownerUser?._id ?? null,
          updatedAt:   now,
        }
      },
      { upsert: true }
    );
    const defaultWorkspace = await workspacesColl.findOne({ slug: 'default' });

    // ── Workspace members ─────────────────────────────────────────────
    const membersColl = db.collection('workspace_members');
    for (const u of SEED_USERS) {
      const user = await users.findOne({ username: u.username });
      if (!user || !defaultWorkspace) continue;
      await membersColl.updateOne(
        { workspaceId: defaultWorkspace._id, userId: user._id },
        {
          $setOnInsert: { workspaceId: defaultWorkspace._id, userId: user._id, createdAt: now },
          $set:         { role: u.role, updatedAt: now }
        },
        { upsert: true }
      );
    }

    // ── Settings ──────────────────────────────────────────────────────
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

    // ── Teams (scoped to default workspace) ───────────────────────────
    const allUsers = await db.collection('users')
      .find({ username: { $in: ['jnicora', 'knicora', 'owner', 'admin', 'alex', 'jordan', 'sam', 'riley'] } })
      .toArray();
    const uid = (name: string) => allUsers.find((u: any) => u.username === name)?._id;

    const teamsColl = db.collection('teams');
    const SEED_TEAMS = [
      {
        name:        'Product',
        description: 'Product strategy, design, and go-to-market',
        members:     ['jnicora', 'owner', 'alex', 'jordan'].map(uid).filter(Boolean),
      },
      {
        name:        'Engineering',
        description: 'Platform, infrastructure, and delivery',
        members:     ['knicora', 'admin', 'sam', 'riley'].map(uid).filter(Boolean),
      },
    ];
    for (const t of SEED_TEAMS) {
      const existing = await teamsColl.findOne({ workspaceId: defaultWorkspace?._id, name: t.name });
      if (!existing) {
        await teamsColl.insertOne({ ...t, workspaceId: defaultWorkspace?._id, createdAt: now, updatedAt: now });
      }
    }
  });
});
