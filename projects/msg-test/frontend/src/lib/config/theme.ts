// The active theme is chosen at runtime in Settings → Theme (the `theme.mode` setting).
// APP_THEME is only the fallback, used when that setting is missing or the API is unreachable.
// Built-in DaisyUI themes: light · dark · cupcake · bumblebee · emerald · corporate ·
//   synthwave · retro · cyberpunk · valentine · halloween · garden · forest · aqua ·
//   lofi · pastel · fantasy · wireframe · black · luxury · dracula · cmyk · autumn ·
//   acid · lemonade · night · coffee · winter · dim · nord · sunset
// Custom themes (defined in lmodulo-theme.css): business. To add a theme, enable it in the
// @plugin "daisyui" list in app.css and add it to the theme.mode options in api/src/plugins/seed.ts.
export const APP_THEME = 'business';

// Validates a theme name before it is written into HTML; anything unexpected falls back to APP_THEME.
export function resolveTheme(value: unknown): string {
  return typeof value === 'string' && /^[a-z0-9-]{1,40}$/.test(value) ? value : APP_THEME;
}

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
    family:   'ui-serif',
    fallback: 'ui-serif, Georgia, serif',
  },
  body: {
    family:   'ui-sans-serif',
    fallback: 'ui-sans-serif, system-ui, sans-serif',
  },
  mono: {
    family:   'ui-monospace',
    fallback: 'ui-monospace, SFMono-Regular, monospace',
  },
  // No cdnUrls/preconnect — system fonts by default.
  // Add Google Fonts per project, e.g.:
  // preconnect: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  // cdnUrls: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'],
};
