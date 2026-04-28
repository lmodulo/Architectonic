import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';
import { plaid } from './plaid-client.js';
import { applyRules } from './rules-engine.js';
import { detectBills } from './bill-detector.js';

interface PlaidItem {
  _id:             ObjectId;
  userId:          ObjectId;
  itemId:          string;
  accessToken:     string;
  institutionId:   string;
  institutionName: string;
  cursor:          string | null;
  error:           string | null;
  updatedAt:       Date;
}

/**
 * Sync transactions for a Plaid item using the /transactions/sync endpoint.
 * Called from the TRANSACTIONS/SYNC_UPDATES_AVAILABLE webhook handler.
 */
export async function syncTransactions(db: Db, item: PlaidItem): Promise<void> {
  let cursor  = item.cursor ?? undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: item.accessToken,
      cursor,
    });

    const { added, modified, removed, next_cursor, has_more } = response.data;

    // Convert Plaid transactions to our schema
    const toDoc = (tx: typeof added[number]) => ({
      plaidTransactionId: tx.transaction_id,
      userId:             item.userId,
      accountId:          tx.account_id,
      merchant_name:      tx.merchant_name ?? tx.name ?? '',
      description:        tx.name ?? '',
      amount:             -tx.amount,          // Plaid: positive = debit; we invert
      date:               new Date(tx.date),
      category:           tx.personal_finance_category?.primary ?? tx.category?.[0] ?? '',
      subCategory:        tx.personal_finance_category?.detailed ?? tx.category?.[1] ?? '',
      pending:            tx.pending,
      currencyCode:       tx.iso_currency_code ?? 'USD',
      // user overrides (set via PATCH — preserved on re-sync)
      userCategory:       undefined as string | undefined,
      userNote:           undefined as string | undefined,
      userTags:           [] as string[],
      flagged:            false,
      updatedAt:          new Date(),
    });

    // Upsert added transactions
    if (added.length > 0) {
      const docs = added.map(toDoc);

      // Apply automation rules before persisting
      const withRules = await applyRules(db, item.userId.toString(), docs as Record<string, unknown>[]);

      for (const doc of withRules) {
        await db.collection('budget_transactions').updateOne(
          { plaidTransactionId: (doc as { plaidTransactionId: string }).plaidTransactionId },
          {
            $setOnInsert: { createdAt: new Date() },
            $set: doc,
          },
          { upsert: true }
        );
      }
    }

    // Update modified transactions (preserve user overrides)
    for (const tx of modified) {
      await db.collection('budget_transactions').updateOne(
        { plaidTransactionId: tx.transaction_id },
        {
          $set: {
            merchant_name: tx.merchant_name ?? tx.name ?? '',
            description:   tx.name ?? '',
            amount:        -tx.amount,
            date:          new Date(tx.date),
            category:      tx.personal_finance_category?.primary ?? tx.category?.[0] ?? '',
            subCategory:   tx.personal_finance_category?.detailed ?? tx.category?.[1] ?? '',
            pending:       tx.pending,
            updatedAt:     new Date(),
          },
        }
      );
    }

    // Delete removed transactions
    if (removed.length > 0) {
      const ids = removed.map(r => r.transaction_id);
      await db.collection('budget_transactions').deleteMany({
        plaidTransactionId: { $in: ids },
      });
    }

    cursor  = next_cursor;
    hasMore = has_more;
  }

  // Persist updated cursor
  await db.collection('budget_plaid_items').updateOne(
    { _id: item._id },
    { $set: { cursor, error: null, updatedAt: new Date() } }
  );

  // Refresh balances after sync
  await refreshBalances(db, item);

  // Run bill detection in background (non-blocking)
  detectBills(db, item.userId.toString()).catch(err =>
    console.error('[budget] bill-detector failed:', err)
  );
}

/**
 * Fetch live balances from Plaid and cache in budget_accounts.
 */
export async function refreshBalances(db: Db, item: PlaidItem): Promise<void> {
  const response = await plaid.accountsBalanceGet({
    access_token: item.accessToken,
  });

  const now = new Date();

  for (const acct of response.data.accounts) {
    await db.collection('budget_accounts').updateOne(
      { plaidAccountId: acct.account_id },
      {
        $set: {
          userId:          item.userId,
          itemId:          item.itemId,
          institutionName: item.institutionName,
          name:            acct.name,
          officialName:    acct.official_name ?? '',
          type:            acct.type,
          subtype:         acct.subtype ?? '',
          current:         acct.balances.current  ?? 0,
          available:       acct.balances.available ?? null,
          limit:           acct.balances.limit     ?? null,
          currencyCode:    acct.balances.iso_currency_code ?? 'USD',
          refreshedAt:     now,
          updatedAt:       now,
        },
        $setOnInsert: {
          plaidAccountId: acct.account_id,
          createdAt:      now,
        },
      },
      { upsert: true }
    );
  }
}
