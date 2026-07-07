// Fallback theme, used before the "theme.mode" setting loads and for logged-out
// pages. Admins pick the live app theme on the Settings page (General tab),
// which is backed by the "theme.mode" setting (see api/src/plugins/seed.ts)
// and applied in real time via $lib/stores/theme-mode.
// Built-in DaisyUI themes: light · dark · cupcake · bumblebee · emerald · corporate ·
//   synthwave · retro · cyberpunk · valentine · halloween · garden · forest · aqua ·
//   lofi · pastel · fantasy · wireframe · black · luxury · dracula · cmyk · autumn ·
//   business · acid · lemonade · night · coffee · winter · dim · nord · sunset
// Custom themes (defined in src/app.css): lmodulo
export const APP_THEME = 'lmodulo';

import { DISPLAY_FONTS, BODY_FONTS, MONO_FONTS, type FontOption } from './fonts';

export type FontStack = {
  family: string;   // font name as it appears in the CDN, e.g. 'Fraunces'
  fallback: string; // CSS fallback stack, e.g. 'ui-serif, Georgia, serif'
};

export type FontConfig = {
  display: FontStack;    // h1–h6 headings
  body: FontStack;       // body copy
  mono: FontStack;       // code / monospace
  cdnUrls?: string[];    // full CDN stylesheet URLs (Google Fonts, etc.)
  preconnect?: string[]; // domains to preconnect
};

const FONT_PRECONNECT = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

function pickFont(catalog: FontOption[], name: string): FontOption {
  return catalog.find(f => f.name === name) ?? catalog[0];
}

// Builds a FontConfig from the "theme.font_display" / "theme.font_body" / "theme.font_mono"
// setting values — see $lib/config/fonts for the selectable catalogs.
export function resolveFontConfig(displayName: string, bodyName: string, monoName: string): FontConfig {
  const display = pickFont(DISPLAY_FONTS, displayName);
  const body = pickFont(BODY_FONTS, bodyName);
  const mono = pickFont(MONO_FONTS, monoName);
  return {
    display: { family: display.name, fallback: display.fallback },
    body: { family: body.name, fallback: body.fallback },
    mono: { family: mono.name, fallback: mono.fallback },
    preconnect: FONT_PRECONNECT,
    cdnUrls: [...new Set([display.cdnUrl, body.cdnUrl, mono.cdnUrl])],
  };
}

// Fallback fonts, used before the "theme.font_*" settings load and for logged-out
// pages if the fetch fails. Admins pick the live font set on the Settings page
// (General tab), backed by the theme.font_display/body/mono settings.
export const APP_FONTS: FontConfig = resolveFontConfig(
  DISPLAY_FONTS[0].name,
  BODY_FONTS[0].name,
  MONO_FONTS[0].name,
);

// Loaded only when the "material" icon theme is active (see $lib/stores/icon-theme.ts).
// Material Symbols renders via a ligature font, not per-icon components like the other icon themes.
export const MATERIAL_SYMBOLS_CDN_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
