import { describe, it, expect } from 'vitest';
import { interpolate, getField } from '../../../src/lib/automation/template.js';

describe('getField', () => {
  it('returns top-level field', () => {
    expect(getField({ name: 'Alice' }, 'name')).toBe('Alice');
  });

  it('resolves nested dot-path', () => {
    expect(getField({ user: { email: 'a@b.com' } }, 'user.email')).toBe('a@b.com');
  });

  it('returns undefined for missing path', () => {
    expect(getField({ a: 1 }, 'b.c')).toBeUndefined();
  });

  it('stops traversal at null without throwing', () => {
    expect(getField({ a: null }, 'a.b')).toBeUndefined();
  });

  it('stops traversal at primitive without throwing', () => {
    expect(getField({ a: 42 }, 'a.b')).toBeUndefined();
  });
});

describe('interpolate', () => {
  it('replaces a simple {{field}} token', () => {
    expect(interpolate('Hello {{name}}!', { name: 'Alice' })).toBe('Hello Alice!');
  });

  it('replaces nested {{user.email}} token', () => {
    expect(interpolate('Email: {{user.email}}', { user: { email: 'a@b.com' } })).toBe('Email: a@b.com');
  });

  it('replaces multiple tokens', () => {
    expect(interpolate('{{greeting}} {{name}}', { greeting: 'Hi', name: 'Bob' })).toBe('Hi Bob');
  });

  it('replaces missing key with empty string', () => {
    expect(interpolate('{{missing}}', {})).toBe('');
  });

  it('handles whitespace inside {{ }}', () => {
    expect(interpolate('{{ name }}', { name: 'Alice' })).toBe('Alice');
  });

  it('leaves non-template text unchanged', () => {
    expect(interpolate('no tokens here', { a: 1 })).toBe('no tokens here');
  });

  it('coerces number values to string', () => {
    expect(interpolate('Count: {{count}}', { count: 42 })).toBe('Count: 42');
  });
});
