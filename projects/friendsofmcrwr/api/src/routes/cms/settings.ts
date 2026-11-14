import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';
import { CmsTree, getSiteSettings, type FooterLink, type SiteSettingsDoc } from '../../lib/cmsTree.js';
import { sanitizeLinkRef } from '../../lib/cmsSanitize.js';

const OID = '^[a-f0-9]{24}$';

function settingsJson(s: SiteSettingsDoc) {
  return {
    homeNodeId:    s.homeNodeId?.toString() ?? null,
    footer:        s.footer,
    mediaFolderId: s.mediaFolderId?.toString() ?? null,
    updatedAt:     s.updatedAt ?? null,
  };
}

export default async function settingsRoutes(app: FastifyInstance) {
  const db = () => app.mongo.db!;

  // GET /cms/settings — home page, footer, Website Media folder
  app.get('/', {
    preHandler: app.requirePermission('cms_nodes', 'read'),
    schema: { summary: 'Get site settings' },
  }, async () => settingsJson(await getSiteSettings(db())));

  // PATCH /cms/settings — any subset of the fields
  app.patch<{
    Body: {
      homeNodeId?: string | null;
      footer?: { text?: string; links?: { label?: string; link?: unknown; newTab?: boolean }[] };
      mediaFolderId?: string | null;
    };
  }>('/', {
    preHandler: app.requirePermission('cms_nodes', 'update'),
    schema: {
      summary: 'Update site settings',
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {
          homeNodeId:    { type: ['string', 'null'], pattern: OID },
          mediaFolderId: { type: ['string', 'null'], pattern: OID },
          footer: {
            type: 'object',
            additionalProperties: false,
            properties: {
              text:  { type: 'string', maxLength: 1000 },
              links: { type: 'array', maxItems: 20, items: { type: 'object' } },
            },
          },
        },
      },
    },
  }, async (req, reply) => {
    const b = req.body;
    const current = await getSiteSettings(db());
    const $set: Partial<SiteSettingsDoc> = { updatedAt: new Date(), updatedBy: new ObjectId(req.session.userId!) };

    if (b.homeNodeId !== undefined) {
      if (b.homeNodeId) {
        const tree = await CmsTree.load(db());
        const home = tree.get(b.homeNodeId);
        if (!home) return reply.notFound('Home page not found');
        if (home.doc.type !== 'page') return reply.badRequest('The home page must be a page');
        $set.homeNodeId = home.doc._id;
      } else {
        $set.homeNodeId = null;
      }
    }
    if (b.mediaFolderId !== undefined) $set.mediaFolderId = b.mediaFolderId ? new ObjectId(b.mediaFolderId) : null;
    if (b.footer) {
      const links: FooterLink[] = [];
      for (const l of b.footer.links ?? current.footer.links) {
        const label = typeof l.label === 'string' ? l.label.trim().slice(0, 80) : '';
        const link = sanitizeLinkRef(l.link);
        if (!label || !link) return reply.badRequest('Each footer link needs a label and a URL or page');
        links.push(l.newTab ? { label, link, newTab: true } : { label, link });
      }
      $set.footer = { text: (b.footer.text ?? current.footer.text).trim(), links };
    }

    await db().collection<SiteSettingsDoc>('cms_settings').updateOne({ _id: 'site' }, { $set }, { upsert: true });
    logAudit(db(), {
      userId: req.session.userId!, username: req.session.username!, action: 'cms_settings.update',
      resourceId: 'site', meta: { fields: Object.keys(b) }, ip: req.ip,
    });
    return settingsJson(await getSiteSettings(db()));
  });
}
