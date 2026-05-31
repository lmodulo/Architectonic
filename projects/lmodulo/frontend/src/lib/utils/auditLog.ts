export function parseAction(raw: string): { category: string; verb: string } {
  const dot = raw.indexOf('.');
  return dot === -1
    ? { category: raw, verb: '' }
    : { category: raw.slice(0, dot), verb: raw.slice(dot + 1).replace(/_/g, ' ') };
}

export function relativeTime(date: string | Date, now = Date.now()): string {
  const secs = Math.floor((now - new Date(date).getTime()) / 1000);
  if (secs < 60)    return `${secs}s ago`;
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}
