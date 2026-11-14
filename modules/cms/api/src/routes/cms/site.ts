import type { FastifyInstance } from 'fastify';
import { CmsTree, getSiteSettings, pageView, type PageContent } from '../../lib/cmsTree.js';
import { pageImageIds, resolveMedia } from '../../lib/cmsMedia.js';

// Public endpoints (no session needed): they only ever return published, visible content.

export default async function siteRoutes(app: FastifyInstance) {
  const db = () => app.mongo.db!;

  // GET /cms/site/menu — the published menu tree (showInMenu items) and the footer
  app.get('/menu', {
    schema: { summary: 'Public site menu and footer' },
  }, async () => {
    const [tree, settings] = await Promise.all([CmsTree.load(db()), getSiteSettings(db())]);
    const footerLinks = settings.footer.links.flatMap(l => {
      const href = 'nodeId' in l.link ? tree.linkMap([l.link.nodeId])[l.link.nodeId] : l.link.url;
      return href ? [{ label: l.label, href, ...(l.newTab ? { newTab: true } : {}) }] : [];
    });
    return { items: tree.menu(), footer: { text: settings.footer.text, links: footerLinks } };
  });

  // GET /cms/site/tree — every published page, nested (menu-hidden ones flagged), for sitemaps
  app.get('/tree', {
    schema: { summary: 'Public site tree for sitemaps' },
  }, async () => ({ items: (await CmsTree.load(db())).publicTree() }));

  // GET /cms/site/resolve?path=/about/team — one public page, a redirect, or 404
  app.get<{ Querystring: { path: string } }>('/resolve', {
    schema: {
      summary: 'Resolve a public URL to its published content',
      querystring: {
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string', minLength: 1, maxLength: 1024 } },
      },
    },
  }, async (req, reply) => {
    const tree = await CmsTree.load(db());
    const r = tree.resolve(req.query.path);
    if (r.kind === 'notFound') return reply.notFound('Page not found');
    if (r.kind === 'redirect') return { redirect: r.to };

    const { node, rest } = r;
    let content: PageContent | null = null;
    if (node.doc.type === 'page') {
      const page = await db().collection<{ published: PageContent | null }>('cms_pages')
        .findOne({ nodeId: node.doc._id }, { projection: { published: 1 } });
      if (!page?.published) return reply.notFound('Page not found');
      content = page.published;
    }
    const media = await resolveMedia(db(), pageImageIds(content));
    return pageView(tree, node, content, { rest, media });
  });
}
