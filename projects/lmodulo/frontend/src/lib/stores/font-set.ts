import { getContext, setContext } from 'svelte';
import { APP_FONTS } from '$lib/config/theme';

export type FontSelection = {
  display: string;
  body: string;
  mono: string;
};

const KEY = Symbol('font-set');

export function setFontSet(getter: () => FontSelection) {
  setContext(KEY, getter);
}

export function getFontSet(): () => FontSelection {
  return getContext<() => FontSelection>(KEY) ?? (() => ({
    display: APP_FONTS.display.family,
    body: APP_FONTS.body.family,
    mono: APP_FONTS.mono.family,
  }));
}
