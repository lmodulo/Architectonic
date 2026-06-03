import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

// Resolves the x-workspace-slug request header to a workspaceId and stamps it onto the session.
// This runs on every authenticated request so the frontend only needs to send the subdomain slug
// via hooks.server.ts — no changes needed in individual proxy routes.
export default fp(async function workspacePlugin(app: FastifyInstance) {
  app.addHook('onRequest', async (req) => {
    const slug = req.headers['x-workspace-slug'];
    if (!slug || typeof slug !== 'string' || !req.session.userId) return;

    const db = app.mongo.db!;
    const workspace = await db.collection('workspaces').findOne({ slug });
    if (!workspace) return;

    const newId = String(workspace._id);
    if (req.session.workspaceId !== newId) {
      req.session.workspaceId = newId;
      await req.session.save();
    }
  });
});
