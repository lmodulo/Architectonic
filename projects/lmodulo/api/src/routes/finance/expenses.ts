import type { FastifyInstance } from 'fastify';
import { ObjectId } from '@fastify/mongodb';
import { logAudit } from '../../lib/audit.js';

const EXP_COL = 'finance_expenses';

type ExpenseStatus   = 'draft' | 'pending' | 'paid';
type ExpenseCategory = 'hosting' | 'software' | 'contractor' | 'travel' | 'meals' | 'equipment' | 'other';

function parseOid(id: string, app: FastifyInstance): ObjectId {
  try { return new ObjectId(id); } catch { throw app.httpErrors.badRequest('Invalid ID'); }
}

function mapExpense(doc: Record<string, unknown>) {
  return {
    ...doc,
    id:          (doc._id as ObjectId).toString(),
    _id:         undefined,
    companyId:   doc.companyId   ? (doc.companyId   as ObjectId).toString() : null,
    milestoneId: doc.milestoneId ? (doc.milestoneId as ObjectId).toString() : null,
    createdBy:   doc.createdBy   ? (doc.createdBy   as ObjectId).toString() : null,
  };
}

export default async function expensesRoutes(app: FastifyInstance) {

  // GET /finance/expenses
  app.get('/expenses', { preHandler: app.requirePermission('finance_expenses', 'read') }, async (req) => {
    const db = app.mongo.db!;

    const {
      status, category, companyId, milestoneId,
      dateFrom, dateTo,
      limit = '50', skip = '0',
      sort = 'expenseDate', sortDir = 'desc',
    } = req.query as Record<string, string>;

    const match: Record<string, unknown> = {};
    if (status)      match.status      = status;
    if (category)    match.category    = category;
    if (companyId)   match.companyId   = parseOid(companyId, app);
    if (milestoneId) match.milestoneId = parseOid(milestoneId, app);
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.$gte = new Date(dateFrom);
      if (dateTo)   range.$lte = new Date(dateTo);
      match.expenseDate = range;
    }

    const SORTABLE  = new Set(['expenseDate', 'amount', 'vendor', 'category', 'createdAt']);
    const sortField = SORTABLE.has(sort) ? sort : 'expenseDate';
    const sortOrder = sortDir === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      db.collection(EXP_COL)
        .find(match)
        .sort({ [sortField]: sortOrder })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray(),
      db.collection(EXP_COL).countDocuments(match),
    ]);

    return { expenses: docs.map(d => mapExpense(d as Record<string, unknown>)), total };
  });

  // POST /finance/expenses
  app.post('/expenses', { preHandler: app.requirePermission('finance_expenses', 'create') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const now = new Date();
    const {
      description, vendor, category, amount, currency = 'USD',
      expenseDate, status = 'draft', companyId, milestoneId,
      billable = false, notes = '', receiptUrl = null,
    } = req.body as Record<string, unknown>;

    if (!description) throw app.httpErrors.badRequest('description is required');
    if (!vendor)      throw app.httpErrors.badRequest('vendor is required');
    if (!expenseDate) throw app.httpErrors.badRequest('expenseDate is required');
    if (!amount || Number(amount) <= 0) throw app.httpErrors.badRequest('amount must be > 0');

    // Auto-increment expense number
    const lastExp = await db.collection(EXP_COL)
      .find({})
      .sort({ expenseNumber: -1 })
      .limit(1)
      .toArray();
    const lastNum = lastExp.length > 0
      ? parseInt((lastExp[0].expenseNumber as string).replace('EXP-', ''), 10)
      : 0;
    const expenseNumber = `EXP-${String(lastNum + 1).padStart(4, '0')}`;

    const doc = {
      expenseNumber,
      description:  String(description),
      vendor:       String(vendor),
      category:     String(category ?? 'other') as ExpenseCategory,
      amount:       Number(amount),
      currency:     String(currency),
      expenseDate:  new Date(expenseDate as string),
      status:       String(status) as ExpenseStatus,
      companyId:    companyId   ? parseOid(companyId   as string, app) : null,
      milestoneId:  milestoneId ? parseOid(milestoneId as string, app) : null,
      billable:     Boolean(billable),
      notes:        String(notes),
      receiptUrl:   receiptUrl ? String(receiptUrl) : null,
      createdBy:    new ObjectId(req.session.userId!),
      createdAt:    now,
      updatedAt:    now,
    };

    const result = await db.collection(EXP_COL).insertOne(doc);

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_expense.create', resourceId: result.insertedId.toString(),
      meta: { expenseNumber, amount: doc.amount }, ip: req.ip,
    });

    reply.status(201);
    return mapExpense({ ...doc, _id: result.insertedId } as Record<string, unknown>);
  });

  // GET /finance/expenses/:id
  app.get('/expenses/:id', { preHandler: app.requirePermission('finance_expenses', 'read') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const doc = await db.collection(EXP_COL).findOne({ _id: oid });
    if (!doc) { reply.status(404); return { message: 'Expense not found' }; }
    return mapExpense(doc as Record<string, unknown>);
  });

  // PATCH /finance/expenses/:id
  app.patch('/expenses/:id', { preHandler: app.requirePermission('finance_expenses', 'update') }, async (req) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    const {
      description, vendor, category, amount, currency,
      expenseDate, status, companyId, milestoneId,
      billable, notes, receiptUrl,
    } = req.body as Record<string, unknown>;

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (description !== undefined) set.description  = String(description);
    if (vendor      !== undefined) set.vendor        = String(vendor);
    if (category    !== undefined) set.category      = String(category);
    if (amount      !== undefined) set.amount        = Number(amount);
    if (currency    !== undefined) set.currency      = String(currency);
    if (expenseDate !== undefined) set.expenseDate   = new Date(expenseDate as string);
    if (status      !== undefined) set.status        = String(status);
    if (billable    !== undefined) set.billable      = Boolean(billable);
    if (notes       !== undefined) set.notes         = String(notes);
    if (receiptUrl  !== undefined) set.receiptUrl    = receiptUrl ? String(receiptUrl) : null;
    if (companyId   !== undefined) set.companyId     = companyId   ? parseOid(companyId   as string, app) : null;
    if (milestoneId !== undefined) set.milestoneId   = milestoneId ? parseOid(milestoneId as string, app) : null;

    await db.collection(EXP_COL).updateOne({ _id: oid }, { $set: set });
    return { updated: true };
  });

  // DELETE /finance/expenses/:id
  app.delete('/expenses/:id', { preHandler: app.requirePermission('finance_expenses', 'delete') }, async (req, reply) => {
    const db  = app.mongo.db!;
    const oid = parseOid((req.params as { id: string }).id, app);
    await db.collection(EXP_COL).deleteOne({ _id: oid });

    logAudit(db, {
      userId: req.session.userId!, username: req.session.username!,
      action: 'finance_expense.delete', resourceId: oid.toString(),
      meta: {}, ip: req.ip,
    });

    reply.status(204);
  });
}
