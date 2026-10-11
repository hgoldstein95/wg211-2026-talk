import Reveal from 'reveal.js'
import Markdown from 'reveal.js/plugin/markdown'
import Highlight from 'reveal.js/plugin/highlight'
import Notes from 'reveal.js/plugin/notes'

// Bundled fonts (no CDN — the deck works offline at the venue).
// Fira Sans / Montserrat / Fira Mono are what the `nord` theme wants. Fira Sans
// and Fira Mono ship as static weights, hence the per-weight imports.
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/500.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-sans/400-italic.css'
import '@fontsource-variable/montserrat'
import '@fontsource/fira-mono/400.css'
import '@fontsource/fira-mono/500.css'
import '@fontsource/fira-mono/700.css'

// Reveal's own structure + a base theme, used purely for its layout rules;
// every colour and typeface it sets is overridden by src/themes/nord.css below.
// (`night` specifically, because it's the one stock theme that doesn't embed
// half a megabyte of base64 fonts we'd never use.) Order matters: theme last.
import 'reveal.js/reveal.css'
import 'reveal.js/theme/night.css'
import './base.css'
import './derivation.css'
import './themes/nord.css'

import deckSource from '../talk.md?raw'

import { applyCodeMarks } from './code-marks.js'
import { autoAnimateMatcher } from './auto-animate.js'
import { initDerivations } from './derivation.js'
import lean from './lean-hljs.js'
import ocaml from './ocaml-hljs.js'

// Two grammars of our own. highlight.js has no Lean grammar at all, so a
// ```lean fence would fall through to auto-detection and guess wrong; its
// OCaml grammar exists but tags neither punctuation nor lowercase type names,
// which is most of what a listing on a slide is made of — see the header of
// each file. Both are registered before reveal's highlight plugin runs over
// the slides. Any other language (`sml`, `haskell`, `rust`, `python`) still
// falls through to highlight.js's own and renders, just without that
// treatment; add another `registerLanguage` line here to override one.
//
// Reveal 6 exports plugins as factories, and this one hands back a singleton,
// so instantiating it here to reach `hljs` and then passing that same instance
// to `plugins` is safe.
const highlight = Highlight()
highlight.hljs.registerLanguage('lean', lean)
highlight.hljs.registerLanguage('ocaml', ocaml)

// Slide content. One talk, one deck, one theme — `talk.md` is it.
//
// The deck refers to `public/` files by absolute path (`src="/shot.png"`),
// which reads naturally in the Markdown and is what the dev server wants.
// Vite can't see into a `?raw` import, though, so those paths have to be
// re-based here — against `./` in a build — or the deck only works at a
// domain root: a subpath (GitHub Pages, a /talks/ directory) and the offline
// pack both 404 on every image. `BASE_URL` is `/` in dev and `./` in a build.
const base = import.meta.env.BASE_URL
const deck = deckSource.replace(/\b(src|href)="\/(?!\/)/g, `$1="${base}`)
document.getElementById('talk-source').textContent = deck

await Reveal.initialize({
  plugins: [Markdown, highlight, Notes],

  // Slides are top-anchored, not vertically centred: the heading then lands in
  // the same place on every slide instead of drifting with the content length,
  // which is what makes a deck of mixed-length slides feel calm. base.css puts
  // the centring back on the slide classes that are about one centred thing.
  center: false,

  // Reveal writes `display` inline on whichever slide is showing, which beats
  // anything base.css says. Asking for flex up front is what lets the vertical
  // centring in base.css work at all.
  display: 'flex',

  hash: true, // keeps your place across the reloads you'll do constantly
  slideNumber: 'c/t',
  history: false,
  transition: 'fade',
  backgroundTransition: 'fade',
  // Duration deliberately not set here: `transitionSpeed` only offers
  // fast/slow, and reveal's own `fade` rule outranks it anyway. The deck's two
  // speeds live in the Motion section of base.css.

  // 16:9 at a size that makes 1rem-ish type read well from the back of a room.
  width: 1280,
  height: 720,
  // No margin: a section header's stripes have to bleed to the slide edge, and
  // at 1280x720 every measurement in base.css then maps 1:1 onto the reference
  // deck's own geometry. The inset is --slide-pad-* instead.
  margin: 0,
  minScale: 0.2,
  maxScale: 2.0,

  // The PDF is the backup you present from when the laptop or the projector
  // gives up, so it has to walk the same way the deck does: a page per
  // fragment step, not one page showing each slide's finished state. It costs
  // pages — a stepped listing or a derivation is worth several — and that is
  // the point. The derivation widget needs this on (see initDerivations()),
  // and so does any slide whose motion is driven by `:has(.fragment.visible)`
  // rules; see the Print section of base.css.
  pdfSeparateFragments: true,

  // Auto-animate is opt-in, per slide, and the deck uses it for two kinds of
  // run. A **sentence** carried from one slide to the next: word groups with a
  // shared `data-id` slide into place as rigid pieces and the rest fade — the
  // same treatment carries the agenda over to the closing slide, list and all
  // (see src/auto-animate.js). And a **listing** that changes from one slide
  // to the next: both slides carry `data-auto-animate`, the two `<pre>`s share
  // a `data-id`, they carry an empty line-number spec `[]` for the per-line
  // markup reveal matches on, and they are pinned to one box (`.pinned` in
  // base.css) so the block itself can't move. The matcher then goes one level
  // finer than reveal's — within a changed line, the tokens that didn't change
  // hold still and only the ones that did fade in. `class="scales"` on a pair
  // opts out of that, handing it back to reveal as a plain translate-and-scale
  // for a listing that is *meant* to travel and resize as one piece.
  //
  // AUTHORING.md has the markup for both; CLAUDE.md has what breaks.
  autoAnimateMatcher,
  autoAnimateDuration: 0.7,
  autoAnimateEasing: 'ease',
  controls: false,
})

// Highlighting has run, so anything a slide wants marked *inside* a listing
// can be wrapped now without highlight.js throwing the spans away.
applyCodeMarks()

// Markdown slides exist by now, so the derivation widgets can find their
// mount points and claim their fragments.
initDerivations(Reveal)

// The print view injects its own slide number per page, as a bare integer:
// reveal builds it in `printview.js` and never consults `slideNumber`, so the
// deck's `c/t` format only ever reached the on-screen element. Rewrite them
// with the same markup reveal's own formatter emits, so a printed page reads
// "slide / total" like the deck does.
//
// With fragments separated a slide spans several pages, and reveal marks them
// "3.1", "3.2" and so on. That suffix goes: the number should say what the
// deck says, and on screen every step of a slide shows the same number.
// Several pages carrying the same number is the honest reading — they are one
// slide.
//
// The total has to be read *now* rather than inside the handler: reveal's
// print view moves every section into a `.pdf-page` wrapper, and `getSlides()`
// looks for `.slides>section`, which by then matches nothing. This runs before
// that — `printView.activate()` waits a frame before it touches the DOM, and
// nothing here has yielded yet.
const totalSlides = Reveal.getTotalSlides()

Reveal.on('pdf-ready', () => {
  document.querySelectorAll('.slide-number-pdf').forEach((el) => {
    const n = el.textContent.trim().replace(/\..*$/, '')
    el.innerHTML =
      `<span class="slide-number-a">${n}</span>` +
      ` <span class="slide-number-delimiter">/</span> ` +
      `<span class="slide-number-b">${totalSlides}</span>`
  })
})

// Exposed for the console and for scripts/snap.js.
window.Reveal = Reveal
