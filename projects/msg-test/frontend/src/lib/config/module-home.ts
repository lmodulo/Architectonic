// Home-page components that modules ship at  src/lib/config/module-home/<key>.svelte. Each one
// receives `data` from the server loader with the same key (see $lib/server/module-home.ts, which
// documents the mechanism). Nothing here may import server-only code: this file is in the client bundle.
import type { Component } from 'svelte';

export type ModuleHomeComponent = Component<{ data: any }>;

const files = import.meta.glob<{ default: ModuleHomeComponent }>('./module-home/*.svelte', { eager: true });

export const MODULE_HOME_COMPONENTS: Record<string, ModuleHomeComponent> = Object.fromEntries(
  Object.entries(files).map(([file, mod]) => [file.replace(/^\.\/module-home\//, '').replace(/\.svelte$/, ''), mod.default])
);
