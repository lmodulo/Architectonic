import { getContext, setContext } from 'svelte';

export type IconLibrary = 'lucide' | 'material' | 'tabler' | 'phosphor' | 'heroicons';

const KEY = Symbol('icon-theme');

export function setIconTheme(getter: () => IconLibrary) {
  setContext(KEY, getter);
}

export function getIconTheme(): () => IconLibrary {
  return getContext<() => IconLibrary>(KEY) ?? (() => 'lucide');
}
