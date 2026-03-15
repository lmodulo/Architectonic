import type { FastifyInstance } from 'fastify';

export default async function notificationsRoutes(app: FastifyInstance) {

  // GET /notifications
  app.get('/', {
    preHandler: app.requirePermission('notifications', 'read'),
    schema: { summary: 'List notifications for the authenticated user' }
  }, async () => {
    return [];
  });
}
