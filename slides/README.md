# IFIP WG 2.11 — talk

reveal.js 6 + Vite. The deck is `talk.md`; the theme is plain CSS.

```sh
npm install
npm run dev      # http://localhost:5173, hot reload
```

`AUTHORING.md` is how to write a slide. `CLAUDE.md` is what bites you.

## The stylized deck

`intro.html` is a second, separate deck: the talk in a more produced style,
tried out beside it. It began as a cold open and now runs through Palamedes
and Basalt. Its slides are written straight into `intro.html`, its look is
`src/intro.css`, and `src/voxel.js` draws its blocks with lean-mc's own
texture function. Its footage and screenshot are in `public/intro/`. It shares
the talk's Lean grammar, code marks and derivation widget, restyled.

```sh
npm run dev                     # then http://localhost:5173/intro.html
npm run snap -- --deck intro    # -> snapshots/intro/NN.png
```

`npm run build` puts it in `dist/` beside the talk; `npm run pack` and
`npm run pdf` are the talk alone.

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Dev server with hot reload. |
| `npm run build` | Static deck in `dist/`. |
| `npm run preview` | Serve the built deck. |
| `npm run pack` | Single-file offline build in `talk-offline/`. |
| `npm run snap` | Render every slide to `snapshots/NN.png` (`-- --slides 1,7` for a subset, `-- --build` against a production build). |
| `npm run pdf` | Export `talk.pdf`, one page per fragment step (`-- --out handout.pdf` for another name). |
| `npm run qr` | Regenerate the closing slide's QR codes from the targets in `scripts/qr.js`. |

## Deploying

**GitHub Pages.** `.github/workflows/pages.yml`, at the root of the repository, builds and deploys on every
push to `main`, or by hand from the Actions tab. One-time repository setup:
Settings → Pages → Build and deployment → Source: *GitHub Actions*. The deck
lives at <https://hgoldstein95.github.io/wg211-talk/>.

**Any web server.** `npm run build`, upload `dist/`. Assets are addressed
relatively, so it works at a domain root or any subpath.

**Off a USB stick.** `npm run pack` writes `talk-offline/`: one `index.html`
with JS, CSS and fonts inlined, plus the image folders. Double-click it — no
server needed. (`dist/` does *not* open from `file://`; it comes up blank.)

**PDF.** `npm run pdf` needs nothing but a PDF viewer, and it steps the way the
deck steps, so you can present from it. Always bring one.

Nothing is fetched from the network at runtime — fonts and every asset are in
the build.

## Presenting

- <kbd>S</kbd> — presenter view with notes and a timer
- <kbd>F</kbd> — fullscreen, <kbd>Esc</kbd> — slide overview
- <kbd>B</kbd> — black out the screen
- The URL carries the slide number, so a reload keeps your place
