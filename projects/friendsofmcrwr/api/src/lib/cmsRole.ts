import { ObjectId, type Db } from 'mongodb';

// The caller's workspace role and permissions, for checks a preHandler can't express (the media
// routes need cms_pages.update AND vault_documents.read). Copied from Vault's vaultRole.ts rather
// than imported: modules never import each other's code.

/** The caller's role in the active workspace (roles live on workspace_members, not the session). */
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

/** Same rule as the auth plugin's requirePermission, without replying. */
export async function callerCan(
  db: Db,
  session: { userId?: string; workspaceId?: string },
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
): Promise<boolean> {
  const role = await callerRole(db, session);
  if (!role) return false;
  const doc = await db.collection('roles').findOne({ name: role }, { projection: { permissions: 1 } });
  return doc?.permissions?.[resource]?.[action] === true;
}
