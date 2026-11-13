import type { FastifyInstance } from 'fastify';
import nodesRoutes    from './nodes.js';
import pagesRoutes    from './pages.js';
import settingsRoutes from './settings.js';
import siteRoutes     from './site.js';

// Autoload mounts this file at /cms and ignores its sibling files, so they are registered here.
// There is one public site per deployment (like settings and the storefront): cms data is not
// workspace-scoped.
export default async function cmsRoutes(app: FastifyInstance) {
  const db = app.mongo.db!;

  await db.collection('cms_nodes').createIndexes([
    { key: { parentId: 1, order: 1 } },
    // Sibling slugs are unique. Links have no slug, so the index only covers string slugs.
    { key: { parentId: 1, slug: 1 }, unique: true, partialFilterExpression: { slug: { $type: 'string' } } },
  ]);
  await db.collection('cms_pages').createIndexes([
    { key: { nodeId: 1 }, unique: true },
  ]);

  app.register(nodesRoutes,    { prefix: '/nodes' });
  app.register(pagesRoutes,    { prefix: '/pages' });
  app.register(settingsRoutes, { prefix: '/settings' });
  app.register(siteRoutes,     { prefix: '/site' });
}
