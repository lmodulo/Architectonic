// Font catalogs for the "Font Set" setting (Settings → General). Each entry is a
// Google Fonts family with a CSS fallback stack and a ready-to-use CDN stylesheet URL.
// Keep the `name` values in sync with the `options` arrays in api/src/plugins/seed.ts.
export type FontOption = {
  name:     string; // font family name, as registered with Google Fonts
  fallback: string; // CSS fallback stack
  cdnUrl:   string; // Google Fonts css2 stylesheet URL
};

const GF = 'https://fonts.googleapis.com/css2?family=';

// display: headings (h1–h6)
export const DISPLAY_FONTS: FontOption[] = [
  { name: 'Ancizar Serif',      fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Ancizar+Serif:ital,wght@0,300..900;1,300..900&display=swap` },
  { name: 'Playfair Display',   fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Playfair+Display:wght@400;500;600;700;800;900&display=swap` },
  { name: 'Merriweather',       fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Merriweather:wght@300;400;700;900&display=swap` },
  { name: 'Lora',                fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Lora:wght@400;500;600;700&display=swap` },
  { name: 'Fraunces',            fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Fraunces:wght@400;500;600;700;800;900&display=swap` },
  { name: 'Libre Baskerville',   fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Libre+Baskerville:wght@400;700&display=swap` },
  { name: 'Cormorant Garamond',  fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Cormorant+Garamond:wght@400;500;600;700&display=swap` },
  { name: 'Bitter',              fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Bitter:wght@400;500;600;700;800;900&display=swap` },
  { name: 'PT Serif',            fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}PT+Serif:wght@400;700&display=swap` },
  { name: 'Spectral',            fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Spectral:wght@400;500;600;700;800&display=swap` },
  { name: 'Crimson Pro',         fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Crimson+Pro:wght@400;500;600;700;800&display=swap` },
  { name: 'Source Serif 4',      fallback: 'ui-serif, Georgia, serif', cdnUrl: `${GF}Source+Serif+4:wght@400;500;600;700&display=swap` },
];

// body: paragraph / UI copy
export const BODY_FONTS: FontOption[] = [
  { name: 'Roboto',        fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Roboto:ital,wght@0,100..900;1,100..900&display=swap` },
  { name: 'Inter',         fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Inter:wght@400;500;600;700;800&display=swap` },
  { name: 'Open Sans',     fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Open+Sans:wght@400;500;600;700;800&display=swap` },
  { name: 'Lato',          fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Lato:wght@400;700;900&display=swap` },
  { name: 'Nunito Sans',   fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Nunito+Sans:wght@400;500;600;700;800&display=swap` },
  { name: 'Work Sans',     fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Work+Sans:wght@400;500;600;700;800&display=swap` },
  { name: 'Source Sans 3', fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Source+Sans+3:wght@400;500;600;700&display=swap` },
  { name: 'IBM Plex Sans', fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}IBM+Plex+Sans:wght@400;500;600;700&display=swap` },
  { name: 'Noto Sans',     fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Noto+Sans:wght@400;500;600;700&display=swap` },
  { name: 'Mulish',        fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Mulish:wght@400;500;600;700;800&display=swap` },
  { name: 'Manrope',       fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Manrope:wght@400;500;600;700;800&display=swap` },
  { name: 'Karla',         fallback: 'ui-sans-serif, system-ui, sans-serif', cdnUrl: `${GF}Karla:wght@400;500;600;700;800&display=swap` },
];

// mono: code / monospace
export const MONO_FONTS: FontOption[] = [
  { name: 'JetBrains Mono',  fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}JetBrains+Mono:wght@400;500;600;700&display=swap` },
  { name: 'Fira Code',       fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Fira+Code:wght@400;500;600;700&display=swap` },
  { name: 'Source Code Pro', fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Source+Code+Pro:wght@400;500;600;700&display=swap` },
  { name: 'IBM Plex Mono',   fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}IBM+Plex+Mono:wght@400;500;600;700&display=swap` },
  { name: 'Roboto Mono',     fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Roboto+Mono:wght@400;500;600;700&display=swap` },
  { name: 'Space Mono',      fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Space+Mono:wght@400;700&display=swap` },
  { name: 'Inconsolata',     fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Inconsolata:wght@400;500;600;700&display=swap` },
  { name: 'Ubuntu Mono',     fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Ubuntu+Mono:wght@400;700&display=swap` },
  { name: 'Courier Prime',   fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Courier+Prime:wght@400;700&display=swap` },
  { name: 'Red Hat Mono',    fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Red+Hat+Mono:wght@400;500;600;700&display=swap` },
  { name: 'Overpass Mono',   fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}Overpass+Mono:wght@400;700&display=swap` },
  { name: 'DM Mono',         fallback: 'ui-monospace, SFMono-Regular, monospace', cdnUrl: `${GF}DM+Mono:wght@400;500&display=swap` },
];
