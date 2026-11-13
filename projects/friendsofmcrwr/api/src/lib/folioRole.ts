import { ObjectId, type Db } from 'mongodb';

/**
 * The caller's role in the active workspace. Roles live on workspace_members (the same lookup
 * requirePermission does), not on the user document: users who registered or were invited have
 * no users.role at all. Folio's customer scoping must use this, or a customer is treated as
 * staff and sees every record. (Forked from vault's vaultRole.ts; modules don't share code.)
 */
export async function callerRole(
  db: Db,
  session: { userId?: string; workspaceId?: string },
): Promise<string | undefined> {
  if (!session.userId) return undefined;
  const userId = new ObjectId(session.userId);
  const members = db.collection('workspace_members');
  const m = (session.workspaceId
    ? await members.findOne({ workspaceId: new ObjectId(session.workspaceId), userId }, { projection: { role: 1 } })
    : null) ?? await members.findOne({ userId }, { projection: { role: 1 } });
  return (m?.role as string | undefined) ?? undefined;
}

/**
 * True when the caller may only see their own records: customers, and (failing closed) anyone
 * with no workspace role. Staff roles see everything their permissions allow.
 */
export async function ownRecordsOnly(
  db: Db,
  session: { userId?: string; workspaceId?: string },
): Promise<boolean> {
  const role = await callerRole(db, session);
  return role === undefined || role === 'customer';
}
