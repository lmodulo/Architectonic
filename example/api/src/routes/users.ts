import type { FastifyInstance } from 'fastify';

const COLLECTION = 'users';

export default async function usersRoutes(app: FastifyInstance) {

  // GET /users
  app.get('/', async (req, reply) => {
    if (!req.session.userId) return reply.unauthorized('Not authenticated');
    const col = app.mongo.db!.collection(COLLECTION);
    const users = await col.find({}, {
      projection: { passwordHash: 0 }
    }).toArray();
    return users.map(u => ({
      id:        u._id.toString(),
      username:  u.username,
      email:     u.email,
      createdAt: u.createdAt
    }));
  });
}
