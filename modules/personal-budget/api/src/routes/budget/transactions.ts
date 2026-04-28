import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { applyRules } from '../../lib/rules-engine.js';

const COL = 'budget_transactions';

export default async function transactionsRoutes(app: FastifyInstance) {

  // GET /budget/transactions — paginated list with filters
  app.get('/', { preHandler: app.requirePermission('budget_transactions', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);

    const q         = req.query as Record<string, string>;
    const page      = Math.max(1, parseInt(q.page  ?? '1',  10));
    const limit     = Math.min(100, parseInt(q.limit ?? '50', 10));
    const skip      = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId: uid };

    if (q.accountId)  filter.accountId   = q.accountId;
    if (q.category)   filter.$or = [
      { userCategory: q.category },
      { category:     q.category },
    ];
    if (q.dateFrom || q.dateTo) {
      filter.date = {};
      if (q.dateFrom) (filter.date as Record<string, unknown>).$gte = new Date(q.dateFrom);
      if (q.dateTo)   (filter.date as Record<string, unknown>).$lte = new Date(q.dateTo);
    }
    if (q.search) {
      const re = { $regex: q.search.trim(), $options: 'i' };
      filter.$or = [
        { merchant_name: re },
        { description:   re },
        { userNote:      re },
        { userTags:      { $regex: q.search.trim(), $options: 'i' } },
      ];
    }
    if (q.flagged === 'true') filter.flagged = true;
    if (q.pending === 'true') filter.pending = true;

    const [transactions, total] = await Promise.all([
      db.collection(COL).find(filter).sort({ date: -1 }).skip(skip).limit(limit).toArray(),
      db.collection(COL).countDocuments(filter),
    ]);

    return {
      transactions: transactions.map(tx => ({
        id:           tx._id.toString(),
        accountId:    tx.accountId,
        merchant:     tx.merchant_name,
        description:  tx.description,
        amount:       tx.amount,
        date:         tx.date,
        category:     tx.userCategory ?? tx.category,
        subCategory:  tx.subCategory,
        pending:      tx.pending,
        currencyCode: tx.currencyCode,
        userCategory: tx.userCategory,
        userNote:     tx.userNote,
        userTags:     tx.userTags ?? [],
        flagged:      tx.flagged ?? false,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  });

  // GET /budget/transactions/:id — single transaction detail
  app.get('/:id', { preHandler: app.requirePermission('budget_transactions', 'read') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid transaction ID'); }

    const tx = await db.collection(COL).findOne({ _id: oid, userId: uid });
    if (!tx) throw app.httpErrors.notFound('Transaction not found');

    return {
      id:                   tx._id.toString(),
      accountId:            tx.accountId,
      plaidTransactionId:   tx.plaidTransactionId,
      merchant:             tx.merchant_name,
      description:          tx.description,
      amount:               tx.amount,
      date:                 tx.date,
      category:             tx.category,
      subCategory:          tx.subCategory,
      pending:              tx.pending,
      currencyCode:         tx.currencyCode,
      userCategory:         tx.userCategory ?? null,
      userNote:             tx.userNote     ?? null,
      userTags:             tx.userTags     ?? [],
      flagged:              tx.flagged      ?? false,
      createdAt:            tx.createdAt,
      updatedAt:            tx.updatedAt,
    };
  });

  // PATCH /budget/transactions/:id — update user overrides
  app.patch('/:id', { preHandler: app.requirePermission('budget_transactions', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const uid = new ObjectId(req.session.userId!);
    const { id } = req.params as { id: string };

    let oid: ObjectId;
    try { oid = new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid transaction ID'); }

    const { userCategory, userNote, userTags, flagged } = req.body as Record<string, unknown>;

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (userCategory !== undefined) patch.userCategory = userCategory;
    if (userNote      !== undefined) patch.userNote     = userNote;
    if (userTags      !== undefined) patch.userTags     = Array.isArray(userTags) ? userTags : [];
    if (flagged       !== undefined) patch.flagged      = Boolean(flagged);

    const result = await db.collection(COL).findOneAndUpdate(
      { _id: oid, userId: uid },
      { $set: patch },
      { returnDocument: 'after' }
    );

    if (!result) throw app.httpErrors.notFound('Transaction not found');

    // Re-apply rules after manual edit (suggestions only — don't overwrite user changes)
    // We run rules but only apply actions that don't conflict with explicit user overrides
    const asRecord = { ...result } as Record<string, unknown>;
    await applyRules(db, req.session.userId!, [asRecord]);

    return {
      id:           result._id.toString(),
      userCategory: result.userCategory ?? null,
      userNote:     result.userNote     ?? null,
      userTags:     result.userTags     ?? [],
      flagged:      result.flagged      ?? false,
      updatedAt:    result.updatedAt,
    };
  });
}
