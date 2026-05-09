import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import bcrypt from 'bcryptjs';
import { checkDuplicateUser } from '../../lib/users.js';
import { logAudit } from '../../lib/audit.js';

const COLLECTION  = 'users';
const SALT_ROUNDS = 12;

export default async function usersRoutes(app: FastifyInstance) {

  // POST /users — admin creates a new user (no auto-login)
  app.post<{ Body: { username: string; email: string; password: string; firstName?: string; lastName?: string } }>('/', {
    preHandler: app.requirePermission('users', 'create'),
    schema: {
      summary: 'Create a new user (admin)',
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username:  { type: 'string', minLength: 2, maxLength: 50 },
          email:     { type: 'string', format: 'email' },
          password:  { type: 'string', minLength: 8 },
          firstName: { type: 'string', maxLength: 50 },
          lastName:  { type: 'string', maxLength: 50 }
        }
      }
    }
  }, async (req, reply) => {
    const col = app.mongo.db!.collection(COLLECTION);
    const { username, email, password, firstName = '', lastName = '' } = req.body;

    const conflict = await checkDuplicateUser(col, { email, username });
    if (conflict) return reply.conflict(conflict);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date();
    const result = await col.insertOne({
      username, email: email.toLowerCase(), passwordHash,
      firstName, lastName, role: 'viewer', createdAt: now, updatedAt: now
    });

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'user.create', resourceId: result.insertedId.toString(), meta: { target: username }, ip: req.ip });

    reply.code(201);
    return {
      id: result.insertedId.toString(), username,
      email: email.toLowerCase(), firstName, lastName, role: 'viewer', createdAt: now
    };
  });

  // GET /users
  app.get('/', {
    preHandler: app.requirePermission('users', 'read'),
    schema: { summary: 'List all users' }
  }, async (_req, _reply) => {
    const users = await app.mongo.db!.collection(COLLECTION)
      .find({ role: { $ne: 'customer' } }, { projection: { passwordHash: 0 } })
      .toArray();
    return users.map(u => ({
      id:          u._id.toString(),
      username:    u.username,
      email:       u.email,
      firstName:   u.firstName   ?? '',
      lastName:    u.lastName    ?? '',
      role:        u.role        ?? 'viewer',
      avatarUrl:   u.avatarUrl   ?? '',
      avatarColor: u.avatarColor ?? '',
      phone:       u.phone       ?? '',
      createdAt:   u.createdAt
    }));
  });

  // GET /users/:id — single user card data (auth required, no permission gate)
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requireAuth,
    schema: { summary: 'Get a single user with team memberships' }
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: InstanceType<typeof ObjectId>;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid user ID'); }

    const user = await db.collection(COLLECTION).findOne(
      { _id: oid },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return reply.notFound('User not found');

    const teams = await db.collection('teams')
      .find({ members: oid })
      .project({ name: 1 })
      .toArray();

    return {
      id:          user._id.toString(),
      username:    user.username,
      email:       user.email,
      firstName:   user.firstName   ?? '',
      lastName:    user.lastName    ?? '',
      role:        user.role        ?? 'viewer',
      avatarUrl:   user.avatarUrl   ?? '',
      avatarColor: user.avatarColor ?? '',
      phone:       user.phone       ?? '',
      teams:       (teams as { name: string }[]).map(t => t.name),
    };
  });

  // PATCH /users/:id — update user profile fields
  app.patch<{ Params: { id: string }; Body: { username?: string; email?: string; firstName?: string; lastName?: string; phone?: string } }>('/:id', {
    preHandler: app.requirePermission('users', 'update'),
    schema: {
      summary: 'Update a user profile field',
      body: {
        type: 'object',
        properties: {
          username:  { type: 'string', minLength: 2, maxLength: 50 },
          email:     { type: 'string' },
          firstName: { type: 'string', maxLength: 50 },
          lastName:  { type: 'string', maxLength: 50 },
          phone:     { type: 'string', maxLength: 30 }
        }
      }
    }
  }, async (req, reply) => {
    const { username, email, firstName, lastName, phone } = req.body;
    const db = app.mongo.db!;
    const $set: Record<string, unknown> = { updatedAt: new Date() };
    if (username  !== undefined) $set.username  = username.trim();
    if (email     !== undefined) $set.email     = email.trim();
    if (firstName !== undefined) $set.firstName = firstName.trim();
    if (lastName  !== undefined) $set.lastName  = lastName.trim();
    if (phone     !== undefined) $set.phone     = phone.trim();

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set }
    );
    if (result.matchedCount === 0) return reply.notFound('User not found');

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'user.update', resourceId: req.params.id, ip: req.ip });

    return { updated: true };
  });

  // DELETE /users/:id — remove a user
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('users', 'delete'),
    schema: { summary: 'Delete a user' }
  }, async (req, reply) => {
    const result = await app.mongo.db!.collection(COLLECTION).deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount === 0) return reply.notFound('User not found');

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'user.delete', resourceId: req.params.id, ip: req.ip });

    return { deleted: true };
  });

  // PATCH /users/:id/role — assign a role to a user
  app.patch<{ Params: { id: string }; Body: { role: string } }>('/:id/role', {
    preHandler: app.requirePermission('users', 'update'),
    schema: {
      summary: 'Assign a role to a user',
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (req, reply) => {
    const { role } = req.body;
    const db       = app.mongo.db!;

    const roleDoc = await db.collection('roles').findOne({ name: role });
    if (!roleDoc) return reply.notFound(`Role '${role}' does not exist`);

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('User not found');

    logAudit(app.mongo.db!, { userId: req.session.userId!, username: req.session.username!, action: 'user.role_change', resourceId: req.params.id, meta: { role }, ip: req.ip });

    return { updated: true, role };
  });
}
