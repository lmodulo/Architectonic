import { ObjectId, type Db } from 'mongodb';

/**
 * The caller's role in the active workspace. Roles live on workspace_members (the same lookup
 * requirePermission does); nothing stores a role on the session, so vault must not read
 * req.session.role. With an unknown role, vault's visibility rules fell back to "staff" for
 * everyone: customers saw staff documents and admins never saw admin-only ones.
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
