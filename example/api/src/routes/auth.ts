import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import bcrypt from 'bcryptjs';

const COLLECTION  = 'users';
const SALT_ROUNDS = 12;

interface RegisterBody { username: string; email: string; password: string; firstName?: string; lastName?: string }
interface LoginBody    { email: string; password: string }
interface ProfileBody  { username?: string; email?: string; firstName?: string; lastName?: string }

export default async function authRoutes(app: FastifyInstance) {

  // POST /auth/register
  app.post<{ Body: RegisterBody }>('/register', {
    schema: {
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

    const existing = await col.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    if (existing) return reply.conflict('Username or email already in use');

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
  app.post('/logout', async (req, reply) => {
    await req.session.destroy();
    reply.code(204).send();
  });

  // PATCH /auth/profile
  app.patch<{ Body: ProfileBody }>('/profile', {
    schema: {
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

  // GET /auth/me — returns user with role + live permissions
  app.get('/me', async (req, reply) => {
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
