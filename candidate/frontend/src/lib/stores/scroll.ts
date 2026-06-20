const positions = new Map<string, number>();

export const scrollStore = {
  save(key: string, top: number) { positions.set(key, top); },
  get(key: string) { return positions.get(key) ?? 0; },
};
