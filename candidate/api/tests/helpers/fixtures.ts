import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Db } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const perms = JSON.parse(
  readFileSync(join(__dirname, '../../src/data/permissions.json'), 'utf8')
) as Record<string, Record<string, Record<string, boolean>>>;

export async function seedRoles(db: Db): Promise<void> {
  const roles = [
    ['owner', 'Owner'],
    ['admin', 'Administrator'],
    ['lead', 'Lead'],
    ['contributor', 'Contributor'],
    ['viewer', 'Viewer'],
    ['customer', 'Customer'],
  ] as const;

  for (const [name, label] of roles) {
    await db.collection('roles').updateOne(
      { name },
      { $set: { name, label, permissions: perms[name] ?? {}, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

export async function seedDefaultSettings(db: Db): Promise<void> {
  const settings = [
    { key: 'app.registration_open', value: true,  type: 'boolean' },
    { key: 'brand.name',            value: '',    type: 'string'  },
    { key: 'brand.logo',            value: '',    type: 'string'  },
  ];
  for (const s of settings) {
    await db.collection('settings').updateOne({ key: s.key }, { $setOnInsert: s }, { upsert: true });
  }
}

export async function getOrCreateWorkspace(db: Db, ownerId?: ObjectId): Promise<ObjectId> {
  const existing = await db.collection('workspaces').findOne({ slug: 'default' });
  if (existing) return existing._id as ObjectId;

  const wsId = new ObjectId();
  await db.collection('workspaces').insertOne({
    _id: wsId,
    name: 'Default',
    slug: 'default',
    description: '',
    logoUrl: '',
    ownerId: ownerId ?? new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return wsId;
}

export async function createUserAndWorkspace(
  db: Db,
  opts: { username: string; email: string; password: string; role: string }
): Promise<{ userId: ObjectId; workspaceId: ObjectId }> {
  const passwordHash = await bcrypt.hash(opts.password, 1);
  const userId = new ObjectId();

  await db.collection('users').insertOne({
    _id: userId,
    username:     opts.username,
    email:        opts.email.toLowerCase(),
    passwordHash,
    firstName:    '',
    lastName:     '',
    avatarUrl:    '',
    avatarColor:  '',
    phone:        '',
    createdAt:    new Date(),
    updatedAt:    new Date(),
  });

  const workspaceId = await getOrCreateWorkspace(db, userId);

  await db.collection('workspace_members').updateOne(
    { workspaceId, userId },
    {
      $set:       { role: opts.role, updatedAt: new Date() },
      $setOnInsert: { workspaceId, userId, createdAt: new Date() },
    },
    { upsert: true }
  );

  return { userId, workspaceId };
}
