import { describe, it, expect } from 'vitest';
import { normalizePhone, InvalidPhoneError } from '../../../src/lib/phone.js';

describe('normalizePhone', () => {
  it('returns null for undefined', () => {
    expect(normalizePhone(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(normalizePhone(null)).toBeNull();
  });

  it('returns null for an empty/whitespace-only string', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('   ')).toBeNull();
  });

  it('normalizes a valid US number in various E.164-prefixed input formats', () => {
    expect(normalizePhone('+1 415 555 0182')).toBe('+14155550182');
    expect(normalizePhone('+14155550182')).toBe('+14155550182');
    expect(normalizePhone('+1-415-555-0182')).toBe('+14155550182');
  });

  it('throws InvalidPhoneError for a number with no country code prefix', () => {
    expect(() => normalizePhone('(415) 555-0182')).toThrow(InvalidPhoneError);
  });

  it('normalizes a valid non-US number to E.164', () => {
    expect(normalizePhone('+34 612 345 678')).toBe('+34612345678');
    expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
  });

  it('throws InvalidPhoneError for a garbage string', () => {
    expect(() => normalizePhone('not-a-number')).toThrow(InvalidPhoneError);
  });

  it('throws InvalidPhoneError for an incomplete number', () => {
    expect(() => normalizePhone('+1 555')).toThrow(InvalidPhoneError);
  });
});
