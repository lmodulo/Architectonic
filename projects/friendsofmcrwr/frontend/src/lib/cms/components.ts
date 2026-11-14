// The custom component registry: every $lib/config/cms-components/<key>.ts file default-exports a
// CmsComponentEntry (see types.ts). Entries run on the server (their `load`, from +page.server.ts)
// and on the client (their `component`), so they must never import $env/dynamic/private.
import type { CmsComponentEntry } from './types';

const files = import.meta.glob<{ default: CmsComponentEntry }>('../config/cms-components/*.ts', { eager: true });

export const CMS_COMPONENTS: Record<string, CmsComponentEntry> = Object.fromEntries(
  Object.values(files).map(f => [f.default.key, f.default]),
);

/** The entry for `key` if it exists and supports `mode`; unknown keys render nothing publicly. */
export function componentFor(key: string | undefined, mode: 'page' | 'block'): CmsComponentEntry | undefined {
  const entry = key ? CMS_COMPONENTS[key] : undefined;
  return entry && entry.modes.includes(mode) ? entry : undefined;
}
