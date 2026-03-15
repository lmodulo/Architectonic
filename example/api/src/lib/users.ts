import type { Collection } from 'mongodb';
import { ObjectId } from '@fastify/mongodb';

/**
 * Returns a conflict message if another user already has the given email or username,
 * or null if no conflict. Pass `excludeId` to skip the check for the user being updated.
 */
export async function checkDuplicateUser(
  col: Collection,
  { email, username, excludeId }: { email?: string; username?: string; excludeId?: string }
): Promise<string | null> {
  const conditions: object[] = [];
  if (email)    conditions.push({ email: email.toLowerCase() });
  if (username) conditions.push({ username });
  if (!conditions.length) return null;

  const filter: Record<string, unknown> = { $or: conditions };
  if (excludeId) filter._id = { $ne: new ObjectId(excludeId) };

  const existing = await col.findOne(filter, { projection: { email: 1, username: 1 } });
  if (!existing) return null;

  if (email && existing.email === email.toLowerCase()) return 'Email already in use';
  return 'Username already in use';
}
