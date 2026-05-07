import type { Db } from 'mongodb';

export function logAudit(db: Db, entry: {
  userId:      string;
  username:    string;
  action:      string;
  resourceId?: string | null;
  meta?:       Record<string, unknown>;
  ip?:         string | null;
}): void {
  db.collection('audit_logs')
    .insertOne({
      userId:     entry.userId,
      username:   entry.username,
      action:     entry.action,
      resourceId: entry.resourceId ?? null,
      meta:       entry.meta ?? {},
      ip:         entry.ip ?? null,
      createdAt:  new Date()
    })
    .catch(err => console.error('[audit] Failed to write log:', err));
}
