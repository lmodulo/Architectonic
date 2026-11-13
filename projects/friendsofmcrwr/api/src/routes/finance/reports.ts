import type { FastifyInstance } from 'fastify';

type GroupBy = 'month' | 'quarter' | 'year';

function periodExpression(field: string, groupBy: GroupBy) {
  if (groupBy === 'year') {
    return { $dateToString: { format: '%Y', date: field } };
  }
  if (groupBy === 'quarter') {
    return {
      $concat: [
        { $toString: { $year: field } },
        '-Q',
        { $toString: { $ceil: { $divide: [{ $month: field }, 3] } } },
      ],
    };
  }
  // month (default)
  return { $dateToString: { format: '%Y-%m', date: field } };
}

function periodLabel(key: string, groupBy: GroupBy): string {
  if (groupBy === 'year') return key;
  if (groupBy === 'quarter') return key.replace('-', ' ');
  // month: "2026-01" → "Jan 2026"
  const [y, m] = key.split('-');
  const month = new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('en-US', { month: 'short' });
  return `${month} ${y}`;
}

function allPeriodKeys(from: Date, to: Date, groupBy: GroupBy): string[] {
  const keys: string[] = [];
  const cur = new Date(from);
  cur.setDate(1);
  cur.setHours(0, 0, 0, 0);

  while (cur <= to) {
    if (groupBy === 'year') {
      const key = String(cur.getFullYear());
      if (!keys.includes(key)) keys.push(key);
      cur.setFullYear(cur.getFullYear() + 1);
    } else if (groupBy === 'quarter') {
      const q = Math.ceil((cur.getMonth() + 1) / 3);
      const key = `${cur.getFullYear()}-Q${q}`;
      if (!keys.includes(key)) keys.push(key);
      cur.setMonth(cur.getMonth() + 3);
    } else {
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      keys.push(`${cur.getFullYear()}-${mm}`);
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return keys;
}

export default async function reportsRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: app.requirePermission('finance_reports', 'read') }, async (req, reply) => {
    const db = app.mongo.db!;
    const q  = req.query as Record<string, string>;

    const groupBy: GroupBy = (['month', 'quarter', 'year'].includes(q.groupBy) ? q.groupBy : 'month') as GroupBy;

    const now  = new Date();
    const from = q.from ? new Date(q.from) : new Date(now.getFullYear(), 0, 1);
    const to   = q.to   ? new Date(q.to)   : now;

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return reply.badRequest('Invalid date range');
    }

    to.setHours(23, 59, 59, 999);

    const periodExpr = periodExpression('$paidAt', groupBy);
    const expPeriodExpr = periodExpression('$expenseDate', groupBy);

    const [revRows, expRows, catRows, outstandingRows] = await Promise.all([
      // Revenue by period (paid invoices)
      db.collection('finance_invoices').aggregate([
        { $match: { status: 'paid', paidAt: { $gte: from, $lte: to } } },
        { $group: {
          _id:          periodExpr,
          revenue:      { $sum: '$total' },
          taxCollected: { $sum: '$taxAmount' },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      // Expenses by period (paid expenses)
      db.collection('finance_expenses').aggregate([
        { $match: { status: 'paid', expenseDate: { $gte: from, $lte: to } } },
        { $group: {
          _id:      expPeriodExpr,
          expenses: { $sum: '$amount' },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      // Expenses by category
      db.collection('finance_expenses').aggregate([
        { $match: { status: 'paid', expenseDate: { $gte: from, $lte: to } } },
        { $group: {
          _id:    '$category',
          amount: { $sum: '$amount' },
          count:  { $sum: 1 },
        }},
        { $sort: { amount: -1 } },
      ]).toArray(),

      // Outstanding invoices (sent + overdue)
      db.collection('finance_invoices').aggregate([
        { $match: { status: { $in: ['sent', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]).toArray(),
    ]);

    const revMap  = new Map(revRows.map(r  => [r._id as string, r]));
    const expMap  = new Map(expRows.map(r  => [r._id as string, r]));

    const periodKeys = allPeriodKeys(from, to, groupBy);

    const periods = periodKeys.map(key => {
      const rev  = revMap.get(key);
      const exp  = expMap.get(key);
      const revenue      = (rev?.revenue      as number) ?? 0;
      const taxCollected = (rev?.taxCollected as number) ?? 0;
      const expenses     = (exp?.expenses     as number) ?? 0;
      return {
        key,
        label:        periodLabel(key, groupBy),
        revenue,
        expenses,
        net:          revenue - expenses,
        taxCollected,
      };
    });

    const totRevenue      = periods.reduce((s, p) => s + p.revenue, 0);
    const totExpenses     = periods.reduce((s, p) => s + p.expenses, 0);
    const totTaxCollected = periods.reduce((s, p) => s + p.taxCollected, 0);
    const netProfit       = totRevenue - totExpenses;
    const profitMargin    = totRevenue > 0 ? (netProfit / totRevenue) * 100 : 0;
    const outstanding     = (outstandingRows[0]?.total as number) ?? 0;

    return {
      summary: {
        revenue:      totRevenue,
        expenses:     totExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        taxCollected: totTaxCollected,
        outstanding,
      },
      periods,
      expensesByCategory: catRows.map(r => ({
        category: r._id as string,
        amount:   r.amount as number,
        count:    r.count  as number,
      })),
    };
  });
}
