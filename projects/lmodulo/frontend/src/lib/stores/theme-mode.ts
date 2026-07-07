import { getContext, setContext } from 'svelte';
import { APP_THEME } from '$lib/config/theme';

const KEY = Symbol('theme-mode');

export function setThemeMode(getter: () => string) {
  setContext(KEY, getter);
}

export function getThemeMode(): () => string {
  return getContext<() => string>(KEY) ?? (() => APP_THEME);
}
