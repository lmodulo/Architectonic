import { describe, it, expect } from 'vitest';
import { toSlug } from '../../../src/lib/slug.js';

describe('toSlug', () => {
  it('lowercases the string', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(toSlug('foo bar baz')).toBe('foo-bar-baz');
  });

  it('replaces non-alphanumeric sequences with a single hyphen', () => {
    expect(toSlug('hello   world')).toBe('hello-world');
    expect(toSlug('hello---world')).toBe('hello-world');
    expect(toSlug('hello!@#world')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toSlug('  hello  ')).toBe('hello');
    expect(toSlug('!hello!')).toBe('hello');
  });

  it('handles an already-valid slug unchanged', () => {
    expect(toSlug('my-slug-123')).toBe('my-slug-123');
  });

  it('handles numbers', () => {
    expect(toSlug('Product 42')).toBe('product-42');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(toSlug('   ')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(toSlug('')).toBe('');
  });

  it('collapses unicode and special chars', () => {
    expect(toSlug('café & résumé')).toBe('caf-r-sum');
  });
});
