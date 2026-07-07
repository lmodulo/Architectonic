// Change this value to switch the app theme everywhere.
// Built-in DaisyUI themes: light · dark · cupcake · bumblebee · emerald · corporate ·
//   synthwave · retro · cyberpunk · valentine · halloween · garden · forest · aqua ·
//   lofi · pastel · fantasy · wireframe · black · luxury · dracula · cmyk · autumn ·
//   business · acid · lemonade · night · coffee · winter · dim · nord · sunset
// Custom themes (defined in src/app.css): lmodulo
export const APP_THEME = 'lmodulo';

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

// Change font families here — CDN links load automatically from cdnUrls.
// To use self-hosted fonts: omit cdnUrls/preconnect and add @font-face rules in app.css.
export const APP_FONTS: FontConfig = {
  display: {
    family: 'Ancizar Serif',
    fallback: 'ui-serif, Georgia, serif',
  },
  body: {
    family: 'Roboto',
    fallback: 'ui-serif, Georgia, serif',
  },
  mono: {
    family: 'JetBrains Mono',
    fallback: 'ui-monospace, SFMono-Regular, monospace',
  },
  preconnect: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  cdnUrls: [
    'https://fonts.googleapis.com/css2?family=Ancizar+Serif:ital,wght@0,300..900;1,300..900&display=swap',
    'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap'
  ],
};

// Loaded only when the "material" icon theme is active (see $lib/stores/icon-theme.ts).
// Material Symbols renders via a ligature font, not per-icon components like the other icon themes.
export const MATERIAL_SYMBOLS_CDN_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
