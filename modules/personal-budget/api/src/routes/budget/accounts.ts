import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { refreshBalances } from '../../lib/plaid-sync.js';

export default async function accountsRoutes(app: FastifyInstance) {

  // GET /budget/accounts — return cached accounts for the session user
  app.get('/', { preHandler: app.requirePermission('budget_accounts', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);

    const accounts = await db
      .collection('budget_accounts')
      .find({ userId: uid })
      .sort({ institutionName: 1, name: 1 })
      .toArray();

    // Group by institution
    const byInstitution: Record<string, unknown[]> = {};
    for (const acct of accounts) {
      const inst = acct.institutionName as string;
      if (!byInstitution[inst]) byInstitution[inst] = [];
      byInstitution[inst].push({
        id:          acct._id.toString(),
        accountId:   acct.plaidAccountId,
        name:        acct.name,
        officialName:acct.officialName,
        type:        acct.type,
        subtype:     acct.subtype,
        current:     acct.current,
        available:   acct.available,
        limit:       acct.limit,
        currencyCode:acct.currencyCode,
        refreshedAt: acct.refreshedAt,
      });
    }

    // Also return connected items for disconnect UI
    const items = await db
      .collection('budget_plaid_items')
      .find({ userId: uid }, { projection: { accessToken: 0, cursor: 0 } })
      .toArray();

    return {
      institutions: Object.entries(byInstitution).map(([name, accts]) => ({
        name,
        accounts: accts,
      })),
      items: items.map(it => ({
        id:              it._id.toString(),
        institutionName: it.institutionName,
        error:           it.error,
        updatedAt:       it.updatedAt,
      })),
    };
  });

  // POST /budget/accounts/refresh — on-demand balance refresh (user-initiated, not polling)
  app.post('/refresh', { preHandler: app.requirePermission('budget_accounts', 'read') }, async (_req, reply) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(_req.session.userId!);

    const items = await db
      .collection('budget_plaid_items')
      .find({ userId: uid, error: null })
      .toArray();

    await Promise.all(
      items.map(item =>
        refreshBalances(db, item as Parameters<typeof refreshBalances>[1])
          .catch(err => app.log.warn('[budget] balance refresh failed for %s: %s', item.itemId, err.message))
      )
    );

    reply.status(204);
  });
}
