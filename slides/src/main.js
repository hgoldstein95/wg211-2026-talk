// main.js — the entry point of the deck, `index.html`.
//
// The slides are written straight into `index.html`, and the whole look is
// `deck.css`. The rest is machinery: the Lean grammar, the marks and
// annotations inside a listing, the listing that comes apart, and the blocks.

import Reveal from 'reveal.js'
import Highlight from 'reveal.js/plugin/highlight'
import Notes from 'reveal.js/plugin/notes'

// Bundled: nothing is fetched at the venue.
import '@fontsource/jersey-15/400.css'
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/500.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-mono/400.css'
import '@fontsource/fira-mono/500.css'

import 'reveal.js/reveal.css'
import './deck.css'

import { applyCodeMarks } from './code-marks.js'
import { initExploded } from './exploded.js'
import lean from './lean-hljs.js'
import { installBlocks } from './voxel.js'

// highlight.js ships no Lean grammar. Reveal 6 exports plugins as factories,
// and this one hands back a singleton, so instantiating it here to reach
// `hljs` and then passing the same instance to `plugins` is safe.
const highlight = Highlight()
highlight.hljs.registerLanguage('lean', lean)

// Before reveal lays anything out, so every `<use href="#blk-…">` resolves.
installBlocks(document.getElementById('blocks'))

await Reveal.initialize({
  plugins: [highlight, Notes],

  // Every slide is a 1280x720 box composed in absolute coordinates, so the
  // deck's geometry is the slide's: no margin, no centring by reveal.
  width: 1280,
  height: 720,
  margin: 0,
  minScale: 0.2,
  maxScale: 2.0,
  center: false,
  display: 'flex',

  hash: true,
  history: false,
  controls: false,
  progress: false,
  slideNumber: 'c/t',
  transition: 'fade',
  backgroundTransition: 'fade',
  // A listing that two slides share travels from its place on one to its
  // place on the next (`data-auto-animate` on both). Reveal times that from
  // here and not from the stylesheet, so it is handed the token.
  autoAnimateDuration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--t-open')),
  autoAnimateEasing: 'ease',
  pdfSeparateFragments: true,
})

// After highlighting, so the spans the marks add survive it; and after the
// slides exist, so the listing that comes apart can find its pieces.
applyCodeMarks()
initExploded(Reveal, highlight.hljs)

// The footage plays once, from the top, when its slide arrives, and holds its
// last frame. That keeps the deck's rule — motion answers a key press — where
// reveal's own `data-autoplay` would pick a clip up from wherever it was left.
function playClips() {
  for (const video of document.querySelectorAll('video.plays-once')) {
    video.pause()
    if (!Reveal.getCurrentSlide().contains(video)) continue
    video.currentTime = 0
    video.play().catch(() => {})
  }
}
Reveal.on('slidechanged', playClips)
playClips()

// Exposed for the console and for scripts/snap.js.
window.Reveal = Reveal
