import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { createHash } from 'crypto';
import { importJWK, jwtVerify } from 'jose';
import { CountryCode, Products } from 'plaid';
import { plaid } from '../../lib/plaid-client.js';
import { syncTransactions, refreshBalances } from '../../lib/plaid-sync.js';
import { logAudit } from '../../lib/audit.js';

export default async function plaidRoutes(app: FastifyInstance) {

  // POST /budget/plaid/link-token — create a Plaid Link token for the current user
  app.post('/link-token', { preHandler: app.requireAuth }, async (req) => {
    const { userId } = req.session;

    const response = await plaid.linkTokenCreate({
      user:          { client_user_id: userId! },
      client_name:   'Forecast',
      products:      [Products.Transactions],
      country_codes: [CountryCode.Us],
      language:      'en',
      webhook:       process.env.PLAID_WEBHOOK_URL ?? '',
    });

    return { linkToken: response.data.link_token };
  });

  // POST /budget/plaid/exchange — exchange public_token for access_token
  app.post('/exchange', { preHandler: app.requireAuth }, async (req, reply) => {
    const db = app.mongo.db!;
    const { publicToken } = req.body as { publicToken: string };

    if (!publicToken?.trim()) throw app.httpErrors.badRequest('publicToken is required');

    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token: publicToken });
    const { access_token, item_id } = exchangeRes.data;

    // Fetch institution metadata
    const itemRes  = await plaid.itemGet({ access_token });
    const instId   = itemRes.data.item.institution_id ?? '';
    let   instName = instId;

    if (instId) {
      try {
        const instRes = await plaid.institutionsGetById({
          institution_id: instId,
          country_codes:  [CountryCode.Us],
        });
        instName = instRes.data.institution.name;
      } catch { /* non-fatal */ }
    }

    const now    = new Date();
    const userId = new ObjectId(req.session.userId!);

    const { insertedId } = await db.collection('budget_plaid_items').insertOne({
      userId,
      itemId:          item_id,
      accessToken:     access_token,
      institutionId:   instId,
      institutionName: instName,
      cursor:          null,
      error:           null,
      createdAt:       now,
      updatedAt:       now,
    });

    // Trigger initial sync — non-blocking
    const item = await db.collection('budget_plaid_items').findOne({ _id: insertedId });
    if (item) {
      syncTransactions(db, item as Parameters<typeof syncTransactions>[1])
        .catch(err => console.error('[budget] initial sync failed:', err));
    }

    logAudit(db, {
      userId:   req.session.userId!,
      username: req.session.username!,
      action:   'budget.plaid.connect',
      meta:     { institutionName: instName },
      ip:       req.ip,
    });

    reply.status(201);
    return { itemId: insertedId.toString(), institutionName: instName };
  });

  // POST /budget/plaid/webhook — Plaid webhook receiver (no session auth — verified by JWT)
  app.post('/webhook', async (req, reply) => {
    const db          = app.mongo.db!;
    const rawBody     = JSON.stringify(req.body);
    const jwtHeader   = req.headers['plaid-verification'] as string | undefined;

    if (!jwtHeader) {
      reply.status(400);
      return { error: 'Missing Plaid-Verification header' };
    }

    // Verify Plaid JWT
    try {
      // Decode header to get kid
      const [headerB64] = jwtHeader.split('.');
      const header      = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      const kid: string = header.kid;

      // Fetch Plaid's JWK for this key ID
      const keyRes  = await plaid.webhookVerificationKeyGet({ key_id: kid });
      const jwk     = keyRes.data.key;
      const pubKey  = await importJWK(jwk as Parameters<typeof importJWK>[0]);

      const { payload } = await jwtVerify(jwtHeader, pubKey, { algorithms: ['ES256'] });

      // Compare body hash
      const expectedHash = createHash('sha256').update(rawBody).digest('hex');
      if ((payload as Record<string, string>).request_body_sha256 !== expectedHash) {
        reply.status(400);
        return { error: 'Body hash mismatch' };
      }
    } catch (err) {
      app.log.warn('[budget] Webhook verification failed: %s', (err as Error).message);
      reply.status(400);
      return { error: 'Invalid webhook signature' };
    }

    const { webhook_type, webhook_code, item_id } = req.body as Record<string, string>;

    if (webhook_type === 'TRANSACTIONS' && webhook_code === 'SYNC_UPDATES_AVAILABLE') {
      const item = await db.collection('budget_plaid_items').findOne({ itemId: item_id });
      if (item) {
        syncTransactions(db, item as Parameters<typeof syncTransactions>[1])
          .catch(err => console.error('[budget] sync failed:', err));
      }
    }

    if (webhook_type === 'ITEM') {
      if (webhook_code === 'ERROR') {
        const { error } = req.body as Record<string, unknown>;
        const errMsg = typeof error === 'object' && error
          ? ((error as Record<string, string>).error_message ?? 'Unknown error')
          : String(error ?? 'Unknown error');

        await db.collection('budget_plaid_items').updateOne(
          { itemId: item_id },
          { $set: { error: errMsg, updatedAt: new Date() } }
        );
      }

      if (webhook_code === 'PENDING_EXPIRATION') {
        const item = await db.collection('budget_plaid_items').findOne({ itemId: item_id });
        if (item) {
          await app.notify({
            userId: item.userId,
            type:   'budget.plaid.expiring',
            title:  'Bank connection expiring',
            body:   `Your connection to ${item.institutionName} will expire soon. Please reconnect.`,
            link:   '/budget/accounts',
            source: { collection: 'budget_plaid_items', documentId: item._id.toString() },
          });
        }
      }
    }

    return { received: true };
  });

  // DELETE /budget/plaid/items/:itemId — disconnect a Plaid item
  app.delete('/items/:itemId', { preHandler: app.requirePermission('budget_accounts', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const { itemId } = req.params as { itemId: string };

    let oid: ObjectId;
    try { oid = new ObjectId(itemId); } catch { throw app.httpErrors.badRequest('Invalid item ID'); }

    const item = await db.collection('budget_plaid_items').findOne({
      _id:    oid,
      userId: new ObjectId(req.session.userId!),
    });
    if (!item) throw app.httpErrors.notFound('Item not found');

    // Remove from Plaid
    try { await plaid.itemRemove({ access_token: item.accessToken }); } catch { /* non-fatal */ }

    // Cascade delete accounts and transactions
    const acctIds = await db
      .collection('budget_accounts')
      .distinct('plaidAccountId', { itemId: item.itemId });

    await db.collection('budget_transactions').deleteMany({ accountId: { $in: acctIds } });
    await db.collection('budget_accounts').deleteMany({ itemId: item.itemId });
    await db.collection('budget_plaid_items').deleteOne({ _id: oid });

    logAudit(db, {
      userId:   req.session.userId!,
      username: req.session.username!,
      action:   'budget.plaid.disconnect',
      meta:     { institutionName: item.institutionName },
      ip:       req.ip,
    });

    reply.status(204);
  });
}
