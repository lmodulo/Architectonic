import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectId } from 'mongodb';
import { startDb, stopDb, getDb } from '../../helpers/db.js';
import { checkDuplicateUser } from '../../../src/lib/users.js';

describe('checkDuplicateUser', () => {
  beforeAll(async () => {
    await startDb();
    await getDb().collection('users').insertOne({
      _id: new ObjectId(),
      email: 'alice@example.com',
      username: 'alice',
    });
    await getDb().collection('users').insertOne({
      _id: new ObjectId(),
      email: 'bob@example.com',
      username: 'bob',
    });
  });

  afterAll(stopDb);

  it('returns null when no email or username is provided', async () => {
    const result = await checkDuplicateUser(getDb().collection('users'), {});
    expect(result).toBeNull();
  });

  it('detects a duplicate email', async () => {
    const result = await checkDuplicateUser(getDb().collection('users'), { email: 'alice@example.com' });
    expect(result).toBe('Email already in use');
  });

  it('is case-insensitive for email comparison', async () => {
    const result = await checkDuplicateUser(getDb().collection('users'), { email: 'ALICE@EXAMPLE.COM' });
    expect(result).toBe('Email already in use');
  });

  it('detects a duplicate username', async () => {
    const result = await checkDuplicateUser(getDb().collection('users'), { username: 'bob' });
    expect(result).toBe('Username already in use');
  });

  it('returns null for a non-conflicting email', async () => {
    const result = await checkDuplicateUser(getDb().collection('users'), { email: 'new@example.com' });
    expect(result).toBeNull();
  });

  it('excludeId skips the user being updated (self-update)', async () => {
    const alice = await getDb().collection('users').findOne({ username: 'alice' });
    const result = await checkDuplicateUser(getDb().collection('users'), {
      email: 'alice@example.com',
      excludeId: alice!._id.toString(),
    });
    expect(result).toBeNull();
  });

  it('still detects conflict when excludeId is a different user', async () => {
    const bob = await getDb().collection('users').findOne({ username: 'bob' });
    const result = await checkDuplicateUser(getDb().collection('users'), {
      email: 'alice@example.com',
      excludeId: bob!._id.toString(),
    });
    expect(result).toBe('Email already in use');
  });
});
