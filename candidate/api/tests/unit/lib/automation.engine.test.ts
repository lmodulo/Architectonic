import { describe, it, expect } from 'vitest';
import { evaluateConditions, type Condition } from '../../../src/lib/automation/engine.js';

describe('evaluateConditions', () => {
  it('returns true for empty conditions array (always-match)', () => {
    expect(evaluateConditions([], { user: { role: 'owner' } })).toBe(true);
  });

  it('== matches exact string value', () => {
    const conditions: Condition[] = [{ field: 'user.role', op: '==', value: 'owner' }];
    expect(evaluateConditions(conditions, { user: { role: 'owner' } })).toBe(true);
    expect(evaluateConditions(conditions, { user: { role: 'viewer' } })).toBe(false);
  });

  it('== compares as strings (coerces numbers)', () => {
    const conditions: Condition[] = [{ field: 'count', op: '==', value: '5' }];
    expect(evaluateConditions(conditions, { count: 5 })).toBe(true);
  });

  it('!= excludes matching value', () => {
    const conditions: Condition[] = [{ field: 'status', op: '!=', value: 'pending' }];
    expect(evaluateConditions(conditions, { status: 'active' })).toBe(true);
    expect(evaluateConditions(conditions, { status: 'pending' })).toBe(false);
  });

  it('contains checks substring presence', () => {
    const conditions: Condition[] = [{ field: 'user.email', op: 'contains', value: '@example.com' }];
    expect(evaluateConditions(conditions, { user: { email: 'alice@example.com' } })).toBe(true);
    expect(evaluateConditions(conditions, { user: { email: 'alice@other.com' } })).toBe(false);
  });

  it('contains returns false for non-string field', () => {
    const conditions: Condition[] = [{ field: 'count', op: 'contains', value: '5' }];
    expect(evaluateConditions(conditions, { count: 5 })).toBe(false);
  });

  it('multiple conditions are ANDed', () => {
    const conditions: Condition[] = [
      { field: 'role', op: '==', value: 'admin' },
      { field: 'status', op: '==', value: 'active' },
    ];
    expect(evaluateConditions(conditions, { role: 'admin', status: 'active' })).toBe(true);
    expect(evaluateConditions(conditions, { role: 'admin', status: 'pending' })).toBe(false);
    expect(evaluateConditions(conditions, { role: 'viewer', status: 'active' })).toBe(false);
  });

  it('unknown operator returns false', () => {
    const conditions = [{ field: 'x', op: 'startsWith' as 'contains', value: 'foo' }];
    expect(evaluateConditions(conditions, { x: 'foobar' })).toBe(false);
  });

  it('missing field returns false for == and contains', () => {
    expect(evaluateConditions(
      [{ field: 'nonexistent.deeply.nested', op: '==', value: 'foo' }],
      { other: 'value' }
    )).toBe(false);
  });

  it('nested field path resolves correctly', () => {
    const conditions: Condition[] = [{ field: 'a.b.c', op: '==', value: 'deep' }];
    expect(evaluateConditions(conditions, { a: { b: { c: 'deep' } } })).toBe(true);
  });

  it('traversal stops at null without throwing', () => {
    const conditions: Condition[] = [{ field: 'a.b.c', op: '==', value: 'x' }];
    expect(evaluateConditions(conditions, { a: null })).toBe(false);
  });
});
