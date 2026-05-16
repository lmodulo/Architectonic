import crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import bcrypt from 'bcryptjs';
import { checkDuplicateUser } from '../../lib/users.js';
import { logAudit } from '../../lib/audit.js';
import { sendInviteEmail } from '../../lib/email/index.js';

const COLLECTION  = 'users';
const SALT_ROUNDS = 12;

export default async function usersRoutes(app: FastifyInstance) {

  // POST /users/invite — admin invites a new user to the current workspace
  app.post<{ Body: { email: string; role: string; firstName?: string; lastName?: string } }>('/invite', {
    preHandler: app.requirePermission('users', 'create'),
    schema: {
      summary: 'Invite a new user (admin)',
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email:     { type: 'string', format: 'email' },
          role:      { type: 'string', minLength: 1 },
          firstName: { type: 'string', maxLength: 50 },
          lastName:  { type: 'string', maxLength: 50 }
        }
      }
    }
  }, async (req, reply) => {
    const db  = app.mongo.db!;
    const col = db.collection(COLLECTION);
    const { email, role, firstName = '', lastName = '' } = req.body;

    const roleDoc = await db.collection('roles').findOne({ name: role });
    if (!roleDoc) return reply.notFound(`Role '${role}' does not exist`);

    const conflict = await checkDuplicateUser(col, { email });
    if (conflict) return reply.conflict(conflict);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash     = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now      = new Date();

    const result = await col.insertOne({
      email:              email.toLowerCase(),
      firstName,
      lastName,
      status:             'pending',
      inviteToken:        hash,
      inviteTokenExpires: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      avatarUrl:          '',
      avatarColor:        '',
      createdAt:          now,
      updatedAt:          now
    });

    // Assign role in the current workspace
    if (req.session.workspaceId) {
      await db.collection('workspace_members').insertOne({
        workspaceId: new ObjectId(req.session.workspaceId),
        userId:      result.insertedId,
        role,
        createdAt:   now,
        updatedAt:   now,
      });
    }

    const appUrl    = process.env.APP_URL ?? 'http://localhost:3000';
    const inviteUrl = `${appUrl}/accept-invite?token=${rawToken}`;
    const inviter   = req.session.username ?? undefined;

    sendInviteEmail(email.toLowerCase(), inviteUrl, inviter).catch(err =>
      console.error('[email] Failed to send invite email:', err)
    );

    logAudit(db, {
      userId:     req.session.userId!,
      username:   req.session.username!,
      action:     'user.invite',
      resourceId: result.insertedId.toString(),
      meta:       { target: email },
      ip:         req.ip
    });

    app.bus.fire('auth.user.invited', {
      user: { id: result.insertedId.toString(), email: email.toLowerCase(), firstName, lastName, role, status: 'pending' },
      invitedBy: { id: req.session.userId, username: req.session.username }
    });

    reply.code(201);
    return {
      id:        result.insertedId.toString(),
      email:     email.toLowerCase(),
      firstName,
      lastName,
      role,
      status:    'pending',
      createdAt: now
    };
  });

  // POST /users/invite/accept — public, no auth — invited user sets username + password
  app.post<{ Body: { token: string; username: string; password: string } }>('/invite/accept', {
    schema: {
      summary: 'Accept an invitation and activate account',
      body: {
        type: 'object',
        required: ['token', 'username', 'password'],
        properties: {
          token:    { type: 'string', minLength: 1 },
          username: { type: 'string', minLength: 2, maxLength: 50 },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (req, reply) => {
    const col  = app.mongo.db!.collection(COLLECTION);
    const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');

    const user = await col.findOne({
      inviteToken:        hash,
      inviteTokenExpires: { $gt: new Date() },
      status:             'pending'
    });
    if (!user) return reply.badRequest('Invalid or expired invitation');

    const conflict = await checkDuplicateUser(col, { username: req.body.username });
    if (conflict) return reply.conflict(conflict);

    const passwordHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);

    await col.updateOne(
      { _id: user._id },
      {
        $set:   { username: req.body.username, passwordHash, status: 'active', updatedAt: new Date() },
        $unset: { inviteToken: '', inviteTokenExpires: '' }
      }
    );

    logAudit(app.mongo.db!, {
      userId:   user._id.toString(),
      username: req.body.username,
      action:   'auth.invite_accept',
      ip:       req.ip
    });

    // Look up workspace membership for the role name
    const membership = await app.mongo.db!.collection('workspace_members').findOne(
      { userId: user._id },
      { projection: { role: 1 } }
    );

    app.bus.fire('auth.user.invite.accepted', {
      user: { id: user._id.toString(), username: req.body.username, email: user.email, role: membership?.role ?? 'customer' }
    });

    reply.code(204).send();
  });

  // GET /users — list non-customer members of the current workspace
  app.get('/', {
    preHandler: app.requirePermission('users', 'read'),
    schema: { summary: 'List workspace members' }
  }, async (req) => {
    const db = app.mongo.db!;
    if (!req.session.workspaceId) return [];

    const memberships = await db.collection('workspace_members')
      .find({
        workspaceId: new ObjectId(req.session.workspaceId),
        role:        { $ne: 'customer' },
      })
      .toArray();

    if (memberships.length === 0) return [];

    const userIds = memberships.map(m => m.userId as ObjectId);
    const users   = await db.collection(COLLECTION)
      .find({ _id: { $in: userIds } }, { projection: { passwordHash: 0 } })
      .toArray();

    return users.map(u => {
      const m = memberships.find(m => (m.userId as ObjectId).toString() === u._id.toString());
      return {
        id:          u._id.toString(),
        username:    u.username    ?? '',
        email:       u.email,
        firstName:   u.firstName   ?? '',
        lastName:    u.lastName    ?? '',
        role:        m?.role       ?? 'viewer',
        status:      u.status      ?? 'active',
        avatarUrl:   u.avatarUrl   ?? '',
        avatarColor: u.avatarColor ?? '',
        phone:       u.phone       ?? '',
        createdAt:   u.createdAt
      };
    });
  });

  // GET /users/:id — single user with their workspace role
  app.get<{ Params: { id: string } }>('/:id', {
    preHandler: app.requireAuth,
    schema: { summary: 'Get a single user with team memberships' }
  }, async (req, reply) => {
    const db = app.mongo.db!;
    let oid: ObjectId;
    try { oid = new ObjectId(req.params.id); }
    catch { return reply.badRequest('Invalid user ID'); }

    const user = await db.collection(COLLECTION).findOne(
      { _id: oid },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return reply.notFound('User not found');

    // Role from current workspace membership
    let role = 'viewer';
    if (req.session.workspaceId) {
      const membership = await db.collection('workspace_members').findOne(
        { workspaceId: new ObjectId(req.session.workspaceId), userId: oid },
        { projection: { role: 1 } }
      );
      if (membership) role = membership.role as string;
    }

    const teams = await db.collection('teams')
      .find({ members: oid, ...(req.session.workspaceId ? { workspaceId: new ObjectId(req.session.workspaceId) } : {}) })
      .project({ name: 1 })
      .toArray();

    return {
      id:          user._id.toString(),
      username:    user.username    ?? '',
      email:       user.email,
      firstName:   user.firstName   ?? '',
      lastName:    user.lastName    ?? '',
      role,
      status:      user.status      ?? 'active',
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

    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'user.update', resourceId: req.params.id, ip: req.ip });

    return { updated: true };
  });

  // DELETE /users/:id — remove user from the current workspace
  app.delete<{ Params: { id: string } }>('/:id', {
    preHandler: app.requirePermission('users', 'delete'),
    schema: { summary: 'Remove a user from the current workspace' }
  }, async (req, reply) => {
    const db = app.mongo.db!;
    if (!req.session.workspaceId) return reply.badRequest('No active workspace');

    const result = await db.collection('workspace_members').deleteOne({
      workspaceId: new ObjectId(req.session.workspaceId),
      userId:      new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) return reply.notFound('User not found in this workspace');

    // Remove from workspace teams too
    await db.collection('teams').updateMany(
      { workspaceId: new ObjectId(req.session.workspaceId) },
      { $pull: { members: new ObjectId(req.params.id) } as any }
    );

    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'user.delete', resourceId: req.params.id, ip: req.ip });

    return { deleted: true };
  });

  // PATCH /users/:id/role — change a user's role in the current workspace
  app.patch<{ Params: { id: string }; Body: { role: string } }>('/:id/role', {
    preHandler: app.requirePermission('users', 'update'),
    schema: {
      summary: "Change a user's workspace role",
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

    if (!req.session.workspaceId) return reply.badRequest('No active workspace');

    const result = await db.collection('workspace_members').updateOne(
      { workspaceId: new ObjectId(req.session.workspaceId), userId: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return reply.notFound('User not found in this workspace');

    logAudit(db, { userId: req.session.userId!, username: req.session.username!, action: 'user.role_change', resourceId: req.params.id, meta: { role }, ip: req.ip });

    return { updated: true, role };
  });
}
