import type { Db } from 'mongodb';

export async function generateOrderNumber(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await db.collection('counters').findOneAndUpdate(
    { _id: 'orders' as unknown as object },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = (counter as unknown as { seq: number }).seq;
  return `ORD-${year}-${String(seq).padStart(6, '0')}`;
}
