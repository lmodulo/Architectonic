import type { FastifyInstance } from 'fastify';
import { REPOS_COL, CONTRIBUTIONS_COL } from '../../lib/github/collections.js';
import { syncGithub } from '../../lib/github/sync.js';

export default async function githubRoutes(app: FastifyInstance) {

  // GET /github — list repos, optional ?language= filter
  app.get<{ Querystring: { language?: string } }>('/', {
    preHandler: app.requirePermission('github', 'read'),
    schema: { summary: 'List GitHub repositories' }
  }, async (req) => {
    const db = app.mongo.db!;
    const filter: Record<string, unknown> = {};
    if (req.query.language) filter.language = req.query.language;

    const items = await db.collection(REPOS_COL)
      .find(filter)
      .sort({ stars: -1 })
      .toArray();

    return { items };
  });

  // GET /github/contributions — aggregated weekly commits, last ?weeks (default 12)
  app.get<{ Querystring: { weeks?: string } }>('/contributions', {
    preHandler: app.requirePermission('github', 'read'),
    schema: { summary: 'Get weekly contribution totals' }
  }, async (req) => {
    const db = app.mongo.db!;
    const weeks = Math.min(Math.max(parseInt(req.query.weeks ?? '12', 10) || 12, 1), 52);

    // Compute the Monday that is `weeks` weeks ago
    const cutoff = new Date();
    const dow = cutoff.getUTCDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    cutoff.setUTCDate(cutoff.getUTCDate() + diff - (weeks - 1) * 7);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const data = await db.collection(CONTRIBUTIONS_COL).aggregate([
      { $match: { weekStart: { $gte: cutoffStr } } },
      { $group: { _id: '$weekStart', commits: { $sum: '$commits' } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, weekStart: '$_id', commits: 1 } }
    ]).toArray();

    return { data };
  });

  // POST /github/sync — fetch from GitHub API and upsert into MongoDB
  app.post('/sync', {
    preHandler: app.requirePermission('github', 'update'),
    schema: { summary: 'Sync repositories from GitHub' }
  }, async (req, reply) => {
    const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_OWNER_TYPE } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_OWNER) {
      return reply.badRequest('GITHUB_TOKEN and GITHUB_OWNER must be configured');
    }

    try {
      const result = await syncGithub(app.mongo.db!, { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_OWNER_TYPE });
      return { ok: true, repos: result.repos, errors: result.errors };
    } catch (err) {
      return reply.internalServerError(err instanceof Error ? err.message : 'Sync failed');
    }
  });

  // GET /github/status — sync metadata and configuration status
  app.get('/status', {
    preHandler: app.requirePermission('github', 'read'),
    schema: { summary: 'Get GitHub sync status' }
  }, async () => {
    const db = app.mongo.db!;
    const configured = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER);

    const repoCount = await db.collection(REPOS_COL).countDocuments();

    // Latest syncedAt across all repos
    const latest = await db.collection(REPOS_COL)
      .findOne({}, { sort: { syncedAt: -1 }, projection: { syncedAt: 1 } });

    return {
      configured,
      repoCount,
      lastSync: latest?.syncedAt ?? null,
    };
  });
}
