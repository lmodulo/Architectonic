export function getField(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((cur, key) => {
    if (cur !== null && cur !== undefined && typeof cur === 'object') {
      return (cur as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function interpolate(template: string, payload: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const val = getField(payload, path);
    return val !== undefined && val !== null ? String(val) : '';
  });
}
