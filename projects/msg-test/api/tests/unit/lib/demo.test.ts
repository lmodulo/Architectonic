import { describe, it, expect, afterEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { demoId, isDemoEnabled, daysFrom, demoRng } from '../../../src/lib/demo.js';

describe('demoId', () => {
  it('is deterministic, so modules can reference each other’s demo records without imports', () => {
    expect(demoId('crm:company:vertex').equals(demoId('crm:company:vertex'))).toBe(true);
  });

  it('gives different ids for different keys', () => {
    expect(demoId('crm:company:vertex').equals(demoId('crm:company:techfusion'))).toBe(false);
  });

  it('returns a valid ObjectId', () => {
    const id = demoId('anything');
    expect(id).toBeInstanceOf(ObjectId);
    expect(ObjectId.isValid(id.toHexString())).toBe(true);
  });
});

describe('isDemoEnabled', () => {
  const original = process.env.SEED_DEMO_DATA;
  afterEach(() => { if (original === undefined) delete process.env.SEED_DEMO_DATA; else process.env.SEED_DEMO_DATA = original; });

  it('is off unless SEED_DEMO_DATA is exactly "true"', () => {
    delete process.env.SEED_DEMO_DATA;
    expect(isDemoEnabled()).toBe(false);
    for (const v of ['false', '1', 'TRUE', 'yes', '']) {
      process.env.SEED_DEMO_DATA = v;
      expect(isDemoEnabled()).toBe(false);
    }
    process.env.SEED_DEMO_DATA = 'true';
    expect(isDemoEnabled()).toBe(true);
  });
});

describe('daysFrom / demoRng', () => {
  it('offsets by whole days', () => {
    const now = new Date('2026-01-10T12:00:00Z');
    expect(daysFrom(now, -9).toISOString()).toBe('2026-01-01T12:00:00.000Z');
  });

  it('produces the same sequence for the same seed', () => {
    const a = demoRng(42), b = demoRng(42);
    const seqA = Array.from({ length: 5 }, a), seqB = Array.from({ length: 5 }, b);
    expect(seqA).toEqual(seqB);
    expect(seqA.every(n => n >= 0 && n < 1)).toBe(true);
  });
});
