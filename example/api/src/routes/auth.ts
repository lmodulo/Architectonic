import crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import bcrypt from 'bcryptjs';
import { checkDuplicateUser } from '../lib/users.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const COLLECTION  = 'users';
const SALT_ROUNDS = 12;

interface RegisterBody      { username: string; email: string; password: string; firstName?: string; lastName?: string }
interface LoginBody         { email: string; password: string }
interface ProfileBody       { username?: string; email?: string; firstName?: string; lastName?: string }
interface ForgotPasswordBody { email: string }
interface ResetPasswordBody  { token: string; password: string }

export default async function authRoutes(app: FastifyInstance) {

  // POST /auth/register
  app.post<{ Body: RegisterBody }>('/register', {
    schema: {
      summary: 'Register a new user account',
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
    const { username, email, password, firstName, lastName } = req.body;

    const conflict = await checkDuplicateUser(col, { email, username });
    if (conflict) return reply.conflict(conflict);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now       = new Date();
    const userCount = await col.countDocuments({});
    const role      = userCount === 0 ? 'admin' : 'viewer';
    const result    = await col.insertOne({
      username,
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName ?? '',
      lastName:  lastName  ?? '',
      role,
      createdAt: now,
      updatedAt: now
    });

    req.session.userId   = result.insertedId.toString();
    req.session.username = username;
    req.session.email    = email.toLowerCase();
    await req.session.save();

    reply.code(201);
    return { id: result.insertedId.toString(), username, email: email.toLowerCase(), role };
  });

  // POST /auth/login
  app.post<{ Body: LoginBody }>('/login', {
    schema: {
      summary: 'Authenticate and create a session',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (req, reply) => {
    const col = app.mongo.db!.collection(COLLECTION);
    const { email, password } = req.body;

    const user = await col.findOne({ email: email.toLowerCase() });
    // Generic message prevents user enumeration
    if (!user || !(await bcrypt.compare(password, user.passwordHash as string))) {
      return reply.unauthorized('Invalid credentials');
    }

    req.session.userId   = user._id.toString();
    req.session.username = user.username as string;
    req.session.email    = user.email    as string;
    await req.session.save();

    return { id: user._id.toString(), username: user.username, email: user.email };
  });

  // POST /auth/logout
  app.post('/logout', { schema: { summary: 'Destroy the current session' } }, async (req, reply) => {
    await req.session.destroy();
    reply.code(204).send();
  });

  // PATCH /auth/profile
  app.patch<{ Body: ProfileBody }>('/profile', {
    schema: {
      summary: "Update the authenticated user's profile",
      body: {
        type: 'object',
        properties: {
          username:  { type: 'string', minLength: 2, maxLength: 50 },
          email:     { type: 'string', format: 'email' },
          firstName: { type: 'string', maxLength: 50 },
          lastName:  { type: 'string', maxLength: 50 }
        }
      }
    }
  }, async (req, reply) => {
    if (!req.session.userId) return reply.unauthorized('Not authenticated');
    const col = app.mongo.db!.collection(COLLECTION);
    const { username, email, firstName, lastName } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (username)             updates.username  = username;
    if (email)                updates.email     = email.toLowerCase();
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName  !== undefined) updates.lastName  = lastName;

    if (username || email) {
      const conflict = await col.findOne({
        _id: { $ne: new ObjectId(req.session.userId) },
        $or: [
          ...(email    ? [{ email: email.toLowerCase() }] : []),
          ...(username ? [{ username }]                   : [])
        ]
      });
      if (conflict) return reply.conflict('Username or email already in use');
    }

    await col.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: updates }
    );

    if (username) req.session.username = username;
    if (email)    req.session.email    = email.toLowerCase();
    await req.session.save();

    return {
      id:       req.session.userId,
      username: req.session.username,
      email:    req.session.email
    };
  });

  // POST /auth/forgot-password
  app.post<{ Body: ForgotPasswordBody }>('/forgot-password', {
    schema: {
      summary: 'Request a password reset email',
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } }
      }
    }
  }, async (req, reply) => {
    const col  = app.mongo.db!.collection(COLLECTION);
    const user = await col.findOne({ email: req.body.email.toLowerCase() });

    // Always 204 — prevents email enumeration
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hash     = crypto.createHash('sha256').update(rawToken).digest('hex');
      await col.updateOne(
        { _id: user._id },
        { $set: { resetToken: hash, resetTokenExpires: new Date(Date.now() + 3_600_000) } }
      );
      const appUrl   = process.env.APP_URL ?? 'http://localhost:3000';
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
      sendPasswordResetEmail(user.email as string, resetUrl).catch(err =>
        console.error('[email] Failed to send password reset email:', err)
      );
    }

    reply.code(204).send();
  });

  // POST /auth/reset-password
  app.post<{ Body: ResetPasswordBody }>('/reset-password', {
    schema: {
      summary: 'Set a new password using a reset token',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token:    { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (req, reply) => {
    const col  = app.mongo.db!.collection(COLLECTION);
    const hash = crypto.createHash('sha256').update(req.body.token).digest('hex');

    const user = await col.findOne({
      resetToken:        hash,
      resetTokenExpires: { $gt: new Date() }
    });
    if (!user) return reply.badRequest('Invalid or expired token');

    const passwordHash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    await col.updateOne(
      { _id: user._id },
      {
        $set:   { passwordHash, updatedAt: new Date() },
        $unset: { resetToken: '', resetTokenExpires: '' }
      }
    );

    reply.code(204).send();
  });

  // GET /auth/me — returns user with role + live permissions
  app.get('/me', { schema: { summary: 'Get authenticated user with role and permissions' } }, async (req, reply) => {
    if (!req.session.userId) return reply.unauthorized('Not authenticated');

    const db   = app.mongo.db!;
    const user = await db.collection(COLLECTION).findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return reply.unauthorized('User not found');

    const roleDoc     = await db.collection('roles').findOne({ name: user.role });
    const permissions = roleDoc?.permissions ?? {};

    return {
      id:          user._id.toString(),
      username:    user.username,
      email:       user.email,
      firstName:   user.firstName ?? '',
      lastName:    user.lastName  ?? '',
      role:        user.role ?? 'viewer',
      permissions
    };
  });
}
