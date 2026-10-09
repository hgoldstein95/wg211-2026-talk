import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Reveal's stock themes open with two `@import`s of Google Fonts. The talk's
// own theme overrides every typeface anyway, so the only effect of those lines
// is a network round-trip on load — and because a CSS `@import` blocks
// rendering, a venue captive portal that hangs the request can hold up first
// paint for seconds. Strip them before Vite's CSS pipeline sees the file.
// (`enforce: 'pre'` is what puts this ahead of vite:css.)
const stripRemoteFontImports = {
  name: 'strip-remote-font-imports',
  enforce: 'pre',
  transform(code, id) {
    if (!/reveal\.js\/.*\.css$/.test(id)) return
    return code.replace(/@import\s+(?:url\()?["']?https:\/\/fonts\.googleapis\.com[^;]*;/g, '')
  },
}

export default defineConfig(({ mode }) => {
  // `npm run pack` — a single-file build for presenting off a USB stick.
  // Browsers refuse to load `<script type="module">` and fonts from a
  // file:// URL (they count as cross-origin from origin "null"), so the
  // ordinary `dist/` is blank when double-clicked. Inlining the JS, CSS and
  // fonts into index.html sidesteps that; images stay as files alongside,
  // which file:// is happy to load.
  const offline = mode === 'offline'

  return {
    // Relative asset URLs so a build works from any subpath (GitHub Pages, a
    // /talks/ directory). `src/main.js` re-bases the deck's own `/…` asset
    // paths against this too.
    base: './',
    plugins: [stripRemoteFontImports, ...(offline ? [viteSingleFile()] : [])],
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 0,
    },
  }
})
