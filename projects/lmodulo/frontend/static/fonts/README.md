# Fonts

Drop licensed `.woff2` files here. The `@font-face` declarations in
`src/app.css` expect these exact filenames:

```
GT-Super-Display-Regular.woff2
GT-Super-Display-Regular-Italic.woff2
GT-Super-Display-Medium.woff2
GT-Super-Display-Bold.woff2

GT-America-Light.woff2
GT-America-Regular.woff2
GT-America-Regular-Italic.woff2
GT-America-Medium.woff2
GT-America-Bold.woff2
```

Without the files the theme falls back to Didot / Helvetica gracefully
(`font-display: swap`).
