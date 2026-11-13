// Transition durations that respect prefers-reduced-motion (Svelte transitions don't on their own).
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export const ms = (duration: number) => (reducedMotion() ? 0 : duration);
