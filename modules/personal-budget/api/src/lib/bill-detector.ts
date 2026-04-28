import type { Db } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';

interface TxSample {
  date:   Date;
  amount: number;
}

interface DetectedBill {
  userId:       ObjectId;
  merchant:     string;
  amount:       number;
  frequencyDays: number;
  lastPaid:     Date;
  nextDue:      Date;
  confirmed:    boolean;
  dismissed:    boolean;
  detectedAt:   Date;
  updatedAt:    Date;
}

/**
 * Scan the user's transaction history for recurring merchants.
 * A merchant qualifies if it appears ≥2 times and the interval between
 * occurrences is consistent (within ±5 days of the mean interval).
 * Upserts results into budget_bills.
 */
export async function detectBills(db: Db, userId: string): Promise<void> {
  const oid     = new ObjectId(userId);
  const cutoff  = new Date();
  cutoff.setMonth(cutoff.getMonth() - 13); // look back 13 months

  // Group transactions by merchant
  const rows = await db
    .collection('budget_transactions')
    .aggregate<{ _id: string; samples: TxSample[] }>([
      { $match: { userId: oid, date: { $gte: cutoff }, amount: { $lt: 0 } } },
      { $sort:  { date: 1 } },
      { $group: {
        _id:     '$merchant_name',
        samples: { $push: { date: '$date', amount: '$amount' } },
      }},
      { $match: { 'samples.1': { $exists: true } } }, // at least 2 occurrences
    ])
    .toArray();

  const now = new Date();

  for (const { _id: merchant, samples } of rows) {
    if (samples.length < 2) continue;

    // Compute intervals in days between consecutive occurrences
    const intervals: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      const diff = (samples[i].date.getTime() - samples[i - 1].date.getTime()) / 86_400_000;
      intervals.push(diff);
    }

    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const consistent = intervals.every(v => Math.abs(v - mean) <= 5);
    if (!consistent || mean < 6) continue; // skip non-recurring or daily noise

    const lastSample = samples[samples.length - 1];
    const nextDue    = new Date(lastSample.date.getTime() + mean * 86_400_000);
    const avgAmount  = Math.abs(
      samples.reduce((s, v) => s + v.amount, 0) / samples.length
    );

    await db.collection<DetectedBill>('budget_bills').updateOne(
      { userId: oid, merchant },
      {
        $set: {
          amount:        Math.round(avgAmount * 100) / 100,
          frequencyDays: Math.round(mean),
          lastPaid:      lastSample.date,
          nextDue,
          updatedAt:     now,
        },
        $setOnInsert: {
          userId:      oid,
          merchant,
          confirmed:   false,
          dismissed:   false,
          detectedAt:  now,
        },
      },
      { upsert: true }
    );
  }
}
