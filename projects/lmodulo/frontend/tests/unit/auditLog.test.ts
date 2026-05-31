import { describe, it, expect } from 'vitest';
import { parseAction, relativeTime } from '../../src/lib/utils/auditLog.js';

// ── parseAction ──────────────────────────────────────────────────────────────

describe('parseAction', () => {
  it('splits on the first dot: category before, verb after', () => {
    expect(parseAction('user.create')).toEqual({ category: 'user', verb: 'create' });
  });

  it('replaces underscores in the verb with spaces', () => {
    expect(parseAction('user.create_account')).toEqual({ category: 'user', verb: 'create account' });
    expect(parseAction('role.assign_user_role')).toEqual({ category: 'role', verb: 'assign user role' });
  });

  it('returns empty verb when there is no dot', () => {
    expect(parseAction('settings')).toEqual({ category: 'settings', verb: '' });
    expect(parseAction('auth')).toEqual({ category: 'auth', verb: '' });
  });

  it('handles an empty string without throwing', () => {
    expect(parseAction('')).toEqual({ category: '', verb: '' });
  });

  it('uses only the first dot — remaining dots stay in the verb', () => {
    const result = parseAction('a.b.c');
    expect(result.category).toBe('a');
    expect(result.verb).toBe('b.c');
  });

  it('does not alter the category string', () => {
    expect(parseAction('auth.login').category).toBe('auth');
    expect(parseAction('workspace.update_name').category).toBe('workspace');
  });

  it('handles a verb that is purely underscores', () => {
    expect(parseAction('x.__')).toEqual({ category: 'x', verb: '  ' });
  });

  it('handles known action categories without error', () => {
    const categories = ['auth', 'user', 'role', 'team', 'workspace', 'message', 'automation', 'event', 'settings'];
    for (const cat of categories) {
      expect(() => parseAction(`${cat}.some_action`)).not.toThrow();
    }
  });
});

// ── relativeTime ─────────────────────────────────────────────────────────────
//
// relativeTime(date, now) accepts an optional `now` timestamp so tests are
// fully deterministic without fake timers.

const NOW = new Date('2025-06-01T12:00:00Z').getTime();
const ago = (secs: number) => new Date(NOW - secs * 1000).toISOString();

describe('relativeTime', () => {
  it('returns Xs ago for times under 60 seconds', () => {
    expect(relativeTime(ago(0),  NOW)).toBe('0s ago');
    expect(relativeTime(ago(1),  NOW)).toBe('1s ago');
    expect(relativeTime(ago(30), NOW)).toBe('30s ago');
    expect(relativeTime(ago(59), NOW)).toBe('59s ago');
  });

  it('returns Xm ago for times between 60 s and 1 hour', () => {
    expect(relativeTime(ago(60),   NOW)).toBe('1m ago');
    expect(relativeTime(ago(90),   NOW)).toBe('1m ago');
    expect(relativeTime(ago(120),  NOW)).toBe('2m ago');
    expect(relativeTime(ago(3599), NOW)).toBe('59m ago');
  });

  it('returns Xh ago for times between 1 hour and 24 hours', () => {
    expect(relativeTime(ago(3600),  NOW)).toBe('1h ago');
    expect(relativeTime(ago(7200),  NOW)).toBe('2h ago');
    expect(relativeTime(ago(86399), NOW)).toBe('23h ago');
  });

  it('returns Xd ago for times 24 hours or older', () => {
    expect(relativeTime(ago(86400),  NOW)).toBe('1d ago');
    expect(relativeTime(ago(172800), NOW)).toBe('2d ago');
    expect(relativeTime(ago(604800), NOW)).toBe('7d ago');
  });

  it('accepts a Date object as well as an ISO string', () => {
    const date = new Date(NOW - 120_000); // 2 minutes ago
    expect(relativeTime(date, NOW)).toBe('2m ago');
  });

  it('boundary: exactly 60 s is 1m, not seconds', () => {
    expect(relativeTime(ago(60), NOW)).toBe('1m ago');
  });

  it('boundary: exactly 3600 s is 1h, not minutes', () => {
    expect(relativeTime(ago(3600), NOW)).toBe('1h ago');
  });

  it('boundary: exactly 86400 s is 1d, not hours', () => {
    expect(relativeTime(ago(86400), NOW)).toBe('1d ago');
  });
});
