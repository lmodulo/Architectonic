import { describe, it, expect } from 'vitest';
import { fmtCurrency, donutSegs, funnelPolygons } from '../../src/lib/utils/dashboard.js';

// ── fmtCurrency ─────────────────────────────────────────────────────────────

describe('fmtCurrency', () => {
  it('formats zero', () => {
    expect(fmtCurrency(0)).toBe('$0');
  });

  it('formats values under $1k as plain dollars', () => {
    expect(fmtCurrency(1)).toBe('$1');
    expect(fmtCurrency(500)).toBe('$500');
    expect(fmtCurrency(999)).toBe('$999');
  });

  it('formats values ≥ $1k as Xk', () => {
    expect(fmtCurrency(1_000)).toBe('$1k');
    expect(fmtCurrency(1_500)).toBe('$2k');   // rounds
    expect(fmtCurrency(12_345)).toBe('$12k');
    expect(fmtCurrency(999_000)).toBe('$999k');
  });

  it('formats values ≥ $1M as X.xM (one decimal)', () => {
    expect(fmtCurrency(1_000_000)).toBe('$1.0M');
    expect(fmtCurrency(1_500_000)).toBe('$1.5M');
    expect(fmtCurrency(2_000_000)).toBe('$2.0M');
    expect(fmtCurrency(10_750_000)).toBe('$10.8M');  // rounds
  });

  it('$1M boundary takes the M branch, not the k branch', () => {
    expect(fmtCurrency(1_000_000)).toBe('$1.0M');
  });
});

// ── donutSegs ────────────────────────────────────────────────────────────────

describe('donutSegs', () => {
  it('returns an empty array for empty input', () => {
    expect(donutSegs([])).toEqual([]);
  });

  it('preserves label and value on each segment', () => {
    const segs = donutSegs([{ label: 'Done', value: 8 }, { label: 'Blocked', value: 2 }]);
    expect(segs[0].label).toBe('Done');
    expect(segs[0].value).toBe(8);
    expect(segs[1].label).toBe('Blocked');
    expect(segs[1].value).toBe(2);
  });

  it('pct is rounded percentage of total', () => {
    const segs = donutSegs([{ label: 'A', value: 1 }, { label: 'B', value: 3 }]);
    expect(segs[0].pct).toBe(25);
    expect(segs[1].pct).toBe(75);
  });

  it('single segment gets pct 100', () => {
    const [seg] = donutSegs([{ label: 'All', value: 10 }]);
    expect(seg.pct).toBe(100);
  });

  it('generates a valid-looking SVG path starting with M', () => {
    const [seg] = donutSegs([{ label: 'X', value: 5 }]);
    expect(seg.path).toMatch(/^M[\d.,-]+ A[\d., ]+ \d \d 1 [\d.,-]+ L[\d.,-]+ A[\d., ]+ \d \d 0 [\d.,-]+Z$/);
  });

  it('guards against total = 0 (all zeros yields pct 0)', () => {
    const segs = donutSegs([{ label: 'Empty', value: 0 }]);
    expect(segs[0].pct).toBe(0);
  });

  it('pct values sum to ~100 for multi-segment input (rounding error ≤ 1)', () => {
    const segs = donutSegs([
      { label: 'A', value: 3 },
      { label: 'B', value: 3 },
      { label: 'C', value: 4 },
    ]);
    const sum = segs.reduce((acc, s) => acc + s.pct, 0);
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
  });

  it('accepts custom cx/cy/r/ir parameters without throwing', () => {
    expect(() => donutSegs([{ label: 'A', value: 1 }], 50, 50, 40, 20)).not.toThrow();
  });
});

// ── funnelPolygons ───────────────────────────────────────────────────────────

const stage = (s: string, count: number, value: number) =>
  ({ stage: s, count, value, color: '#fff' });

describe('funnelPolygons', () => {
  it('returns an empty array for empty input', () => {
    expect(funnelPolygons([])).toEqual([]);
  });

  it('passes through stage, count, value, color on each polygon', () => {
    const [poly] = funnelPolygons([stage('Discovery', 5, 1000)]);
    expect(poly.stage).toBe('Discovery');
    expect(poly.count).toBe(5);
    expect(poly.value).toBe(1000);
    expect(poly.color).toBe('#fff');
  });

  it('pts is a space-separated string of four coordinate pairs', () => {
    const [poly] = funnelPolygons([stage('Discovery', 3, 500)]);
    const pairs = poly.pts.split(' ');
    expect(pairs).toHaveLength(4);
    for (const pair of pairs) {
      expect(pair).toMatch(/^-?[\d.]+,-?[\d.]+$/);
    }
  });

  it('midY is the vertical midpoint of each stage band', () => {
    const H = 240;
    const polys = funnelPolygons([
      stage('Discovery', 3, 500),
      stage('Proposal',  2, 300),
    ]);
    expect(polys[0].midY).toBeCloseTo((0 / 2 * H + 1 / 2 * H) / 2, 1);
    expect(polys[1].midY).toBeCloseTo((1 / 2 * H + 2 / 2 * H) / 2, 1);
  });

  it('first stage is wider than the last stage (funnel shape)', () => {
    const polys = funnelPolygons([
      stage('Discovery',   10, 10000),
      stage('Proposal',     7, 7000),
      stage('Negotiation',  3, 3000),
    ]);
    const topWidth = (pts: string, idx: number) => {
      const pairs = pts.split(' ');
      const [lx] = pairs[idx].split(',').map(Number);
      return lx;
    };
    // left-x of top-left corner: more negative = wider
    expect(topWidth(polys[0].pts, 0)).toBeLessThan(topWidth(polys[1].pts, 0));
    expect(topWidth(polys[1].pts, 0)).toBeLessThan(topWidth(polys[2].pts, 0));
  });

  it('handles a single stage without throwing', () => {
    expect(() => funnelPolygons([stage('Discovery', 5, 1000)])).not.toThrow();
  });
});
