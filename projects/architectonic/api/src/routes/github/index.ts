import type { FastifyInstance } from 'fastify';

export default async function githubRoutes(app: FastifyInstance) {

  // GET /github
  app.get('/', {
    preHandler: app.requirePermission('github', 'read'),
    schema: { summary: 'List GitHub repositories' }
  }, async () => {
    return { items: [] };
  });
}
