import { createHash } from 'crypto';
import { ObjectId, type Db } from 'mongodb';

// Opt-in demo data. Modules ship `api/src/seeds/<module>.ts` with a default export
// `(ctx: DemoContext) => Promise<void>`. The seed plugin runs them on boot only when
// SEED_DEMO_DATA=true; each seed must insert only when its collections are empty.

export interface DemoContext {
  db: Db;
  now: Date;
  /** Default workspace (for workspace-scoped modules such as vault). */
  workspaceId: ObjectId | null;
  /** Seeded users by username: jnicora, knicora, owner, admin, alex, jordan, sam, riley. */
  users: Record<string, ObjectId>;
}

export type DemoSeed = (ctx: DemoContext) => Promise<void>;

export const isDemoEnabled = () => process.env.SEED_DEMO_DATA === 'true';

/**
 * Deterministic ObjectId for a demo record, e.g. demoId('crm:company:vertex').
 * Modules reference each other's demo records by key without importing each other,
 * so a module's demo data still works (with dangling refs) when a sibling isn't installed.
 */
export function demoId(key: string): ObjectId {
  return new ObjectId(createHash('sha1').update(`demo:${key}`).digest('hex').slice(0, 24));
}

/** Date offset from `now` by whole days (negative = past). Time of day is kept. */
export function daysFrom(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

/** Small deterministic RNG so demo data is identical on every machine. */
export function demoRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}
