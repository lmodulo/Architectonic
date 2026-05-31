export function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

export interface DonutSegInput {
  label: string;
  value: number;
}

export interface DonutSeg extends DonutSegInput {
  path: string;
  pct: number;
}

export function donutSegs(
  pts: DonutSegInput[],
  cx = 90, cy = 90, r = 72, ir = 48,
): DonutSeg[] {
  const total = pts.reduce((s, d) => s + d.value, 0) || 1;
  let a = -Math.PI / 2;
  return pts.map(d => {
    const sw  = (d.value / total) * Math.PI * 2;
    const gap = 0.05;
    const a0  = a + gap / 2;
    const a1  = a + sw - gap / 2;
    const lg  = (a1 - a0) > Math.PI ? 1 : 0;
    const x1  = cx + r  * Math.cos(a0); const y1  = cy + r  * Math.sin(a0);
    const x2  = cx + r  * Math.cos(a1); const y2  = cy + r  * Math.sin(a1);
    const xi1 = cx + ir * Math.cos(a1); const yi1 = cy + ir * Math.sin(a1);
    const xi2 = cx + ir * Math.cos(a0); const yi2 = cy + ir * Math.sin(a0);
    const path = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi1.toFixed(2)},${yi1.toFixed(2)} A${ir},${ir} 0 ${lg} 0 ${xi2.toFixed(2)},${yi2.toFixed(2)}Z`;
    a += sw;
    return { path, label: d.label, value: d.value, pct: Math.round(d.value / total * 100) };
  });
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  color: string;
}

export interface FunnelPolygon extends FunnelStage {
  pts: string;
  midY: number;
}

export function funnelPolygons(stages: FunnelStage[]): FunnelPolygon[] {
  const W = 200, H = 240, minW = 40, gap = 2;
  const n = stages.length || 1;
  const step = (W - minW) / n;
  return stages.map((s, i) => {
    const topW = W - i * step;
    const botW = W - (i + 1) * step;
    const topY = (i / n) * H;
    const botY = ((i + 1) / n) * H;
    const cx   = W / 2;
    const ptsStr = [
      `${(cx - topW / 2).toFixed(1)},${(topY + gap).toFixed(1)}`,
      `${(cx + topW / 2).toFixed(1)},${(topY + gap).toFixed(1)}`,
      `${(cx + botW / 2).toFixed(1)},${(botY - gap).toFixed(1)}`,
      `${(cx - botW / 2).toFixed(1)},${(botY - gap).toFixed(1)}`,
    ].join(' ');
    return { pts: ptsStr, midY: (topY + botY) / 2, ...s };
  });
}
