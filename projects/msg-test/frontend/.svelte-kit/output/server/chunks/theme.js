const APP_THEME = "business";
const APP_FONTS = {
  display: {
    family: "ui-serif",
    fallback: "ui-serif, Georgia, serif"
  },
  body: {
    family: "ui-sans-serif",
    fallback: "ui-sans-serif, system-ui, sans-serif"
  },
  mono: {
    family: "ui-monospace",
    fallback: "ui-monospace, SFMono-Regular, monospace"
  }
  // No cdnUrls/preconnect — system fonts by default.
  // Add Google Fonts per project, e.g.:
  // preconnect: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  // cdnUrls: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'],
};
export {
  APP_THEME as A,
  APP_FONTS as a
};
