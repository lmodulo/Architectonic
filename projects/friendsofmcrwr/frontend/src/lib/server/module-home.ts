// Lets a module take over the home page (`/`) without editing scaffold files. Server only.
//
// A module ships two files that share a key (the file name):
//
//   src/lib/server/module-home/<key>.ts      default-exports a loader:
//       (event: ServerLoadEvent) => Promise<object | null>
//     Return the data the home component needs, or null to leave `/` alone (e.g. nothing is
//     published yet). It runs on the server, so it may use $env/dynamic/private.
//   src/lib/config/module-home/<key>.svelte  the component that renders it, given `data`
//     (see $lib/config/module-home.ts).
//
// The first loader (by file name) that returns non-null wins. A loader that throws is logged and
// skipped. With no loaders, or when every loader returns null, `/` shows the scaffold home page.
import type { ServerLoadEvent } from '@sveltejs/kit';

export type ModuleHomeLoader = (event: ServerLoadEvent) => Promise<object | null>;

export interface ModuleHome {
  key: string;
  data: object;
}

const files = import.meta.glob<{ default: ModuleHomeLoader }>('./module-home/*.ts', { eager: true });

const loaders = Object.entries(files)
  .map(([file, mod]) => ({ key: file.replace(/^\.\/module-home\//, '').replace(/\.ts$/, ''), load: mod.default }))
  .sort((a, b) => a.key.localeCompare(b.key));

export async function resolveModuleHome(event: ServerLoadEvent): Promise<ModuleHome | null> {
  for (const { key, load } of loaders) {
    try {
      const data = await load(event);
      if (data) return { key, data };
    } catch (err) {
      console.error(`[module-home] loader "${key}" failed:`, err);
    }
  }
  return null;
}
