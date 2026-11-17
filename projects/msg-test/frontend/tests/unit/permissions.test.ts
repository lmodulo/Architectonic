import { describe, it, expect } from 'vitest';
import { hasPermission, type UserWithPermissions } from '../../src/lib/permissions.js';

const ownerUser: UserWithPermissions = {
  id:          'u1',
  username:    'owner',
  email:       'owner@example.com',
  role:        'owner',
  workspaceId: 'ws1',
  permissions: {
    users:   { create: true,  read: true,  update: true,  delete: true  },
    audit:   { create: false, read: true,  update: false, delete: false },
    settings:{ create: false, read: true,  update: true,  delete: false },
  },
};

const viewerUser: UserWithPermissions = {
  id:          'u2',
  username:    'viewer',
  email:       'viewer@example.com',
  role:        'viewer',
  workspaceId: 'ws1',
  permissions: {
    users:   { create: false, read: true,  update: false, delete: false },
    audit:   { create: false, read: false, update: false, delete: false },
  },
};

describe('hasPermission', () => {
  it('returns true for an explicitly granted permission', () => {
    expect(hasPermission(ownerUser, 'users', 'create')).toBe(true);
    expect(hasPermission(ownerUser, 'users', 'delete')).toBe(true);
  });

  it('returns false for an explicitly denied permission', () => {
    expect(hasPermission(ownerUser, 'audit', 'create')).toBe(false);
    expect(hasPermission(ownerUser, 'audit', 'update')).toBe(false);
  });

  it('returns false for a resource the user has no permissions for', () => {
    expect(hasPermission(ownerUser, 'messages', 'read')).toBe(false);
  });

  it('returns false for an unknown action on a known resource', () => {
    expect(hasPermission(ownerUser, 'users', 'publish' as 'create')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(hasPermission(null, 'users', 'read')).toBe(false);
  });

  it('returns false for undefined user', () => {
    expect(hasPermission(undefined, 'users', 'read')).toBe(false);
  });

  it('handles viewer with limited read access', () => {
    expect(hasPermission(viewerUser, 'users', 'read')).toBe(true);
    expect(hasPermission(viewerUser, 'users', 'create')).toBe(false);
    expect(hasPermission(viewerUser, 'audit', 'read')).toBe(false);
  });

  it('all four standard actions work correctly', () => {
    const actions = ['create', 'read', 'update', 'delete'] as const;
    for (const action of actions) {
      expect(typeof hasPermission(ownerUser, 'users', action)).toBe('boolean');
    }
  });

  it('does not coerce non-boolean values to true (strict === check)', () => {
    const userWithTruthyPerm: UserWithPermissions = {
      ...ownerUser,
      permissions: { fake: { create: 1 as unknown as boolean, read: false, update: false, delete: false } },
    };
    expect(hasPermission(userWithTruthyPerm, 'fake', 'create')).toBe(false);
  });
});
