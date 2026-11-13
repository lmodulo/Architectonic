import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Db } from 'mongodb';
import { logAudit } from '../../../src/lib/audit.js';

function makeDb(insertOne: ReturnType<typeof vi.fn>): Db {
  return {
    collection: () => ({ insertOne }),
  } as unknown as Db;
}

describe('logAudit', () => {
  let insertOne: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    insertOne = vi.fn().mockResolvedValue({ insertedId: 'fake-id' });
  });

  it('calls insertOne on audit_logs with correct fields', async () => {
    const db = makeDb(insertOne);
    logAudit(db, {
      userId:     'user1',
      username:   'alice',
      action:     'auth.login',
      resourceId: 'res1',
      meta:       { key: 'val' },
      ip:         '127.0.0.1',
    });

    // insertOne is fire-and-forget; yield to microtask queue
    await Promise.resolve();

    expect(insertOne).toHaveBeenCalledOnce();
    const doc = insertOne.mock.calls[0][0];
    expect(doc.userId).toBe('user1');
    expect(doc.username).toBe('alice');
    expect(doc.action).toBe('auth.login');
    expect(doc.resourceId).toBe('res1');
    expect(doc.meta).toEqual({ key: 'val' });
    expect(doc.ip).toBe('127.0.0.1');
    expect(doc.createdAt).toBeInstanceOf(Date);
  });

  it('defaults resourceId, meta, and ip to null/{} when omitted', async () => {
    const db = makeDb(insertOne);
    logAudit(db, { userId: 'u', username: 'bob', action: 'auth.logout' });
    await Promise.resolve();

    const doc = insertOne.mock.calls[0][0];
    expect(doc.resourceId).toBeNull();
    expect(doc.meta).toEqual({});
    expect(doc.ip).toBeNull();
  });

  it('does not propagate an insertOne error (fire-and-forget)', async () => {
    const failInsert = vi.fn().mockRejectedValue(new Error('DB error'));
    const db = makeDb(failInsert);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logAudit(db, { userId: 'u', username: 'bob', action: 'auth.logout' });

    // Should not throw even after error resolves
    await new Promise(r => setTimeout(r, 10));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[audit]'),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
