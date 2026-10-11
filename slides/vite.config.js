import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

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
    // /talks/ directory).
    base: './',
    plugins: offline ? [viteSingleFile()] : [],
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
