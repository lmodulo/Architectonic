import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';

export interface CashFlowBucket {
  month:               string;  // 'YYYY-MM'
  projectedIncome:     number;
  projectedExpenses:   number;
  projectedBalance:    number;
  runningBalance:      number;
}

const INCOME_CATEGORIES = new Set([
  'payroll', 'deposit', 'transfer in', 'income', 'interest earned',
]);

/**
 * Build a 12-month forward cash flow projection.
 * Strategy:
 *   - Average income and expenses from the last 3 full calendar months
 *   - Overlay known recurring bills (from budget_bills, not dismissed)
 *   - Seed each month from the rolling balance (starting from latest account balance)
 */
export async function projectCashflow(
  db:     Db,
  userId: string,
  months: number = 12
): Promise<CashFlowBucket[]> {
  const oid    = new ObjectId(userId);
  const now    = new Date();

  // ── 1. Baseline balance: sum of all connected account current balances ──
  const accounts = await db
    .collection('budget_accounts')
    .find({ userId: oid })
    .toArray();

  const baseBalance = accounts.reduce((s, a) => s + (a.current ?? 0), 0);

  // ── 2. Historical averages from last 3 months ──
  const histStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const histEnd   = new Date(now.getFullYear(), now.getMonth(), 1);

  const txns = await db
    .collection('budget_transactions')
    .find({ userId: oid, date: { $gte: histStart, $lt: histEnd } })
    .toArray();

  let totalIncome   = 0;
  let totalExpenses = 0;

  for (const tx of txns) {
    const cat = (tx.userCategory ?? tx.category ?? '').toString().toLowerCase();
    if (tx.amount > 0 || INCOME_CATEGORIES.has(cat)) {
      totalIncome += Math.abs(tx.amount);
    } else {
      totalExpenses += Math.abs(tx.amount);
    }
  }

  const avgMonthlyIncome   = totalIncome   / 3;
  const avgMonthlyExpenses = totalExpenses / 3;

  // ── 3. Known recurring bills ──
  const bills = await db
    .collection('budget_bills')
    .find({ userId: oid, dismissed: false })
    .toArray();

  // ── 4. Build monthly buckets ──
  const buckets: CashFlowBucket[] = [];
  let runningBalance = baseBalance;

  for (let i = 0; i < months; i++) {
    const d    = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0); // last day

    // Overlay bills that fall within this month
    let billTotal = 0;
    for (const bill of bills) {
      if (bill.dismissed) continue;
      // Estimate next occurrence(s) in this month
      let due = new Date(bill.nextDue);
      while (due <= mEnd) {
        if (due >= d) billTotal += bill.amount;
        due = new Date(due.getTime() + bill.frequencyDays * 86_400_000);
      }
    }

    const income   = avgMonthlyIncome;
    const expenses = Math.max(avgMonthlyExpenses, billTotal);

    runningBalance += income - expenses;

    buckets.push({
      month:             key,
      projectedIncome:   Math.round(income   * 100) / 100,
      projectedExpenses: Math.round(expenses * 100) / 100,
      projectedBalance:  Math.round((income - expenses) * 100) / 100,
      runningBalance:    Math.round(runningBalance * 100) / 100,
    });
  }

  return buckets;
}
