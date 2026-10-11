// intro.js — the entry point of the stylized deck, `intro.html`.
//
// A second deck beside the talk: the slides are written straight into
// `intro.html`, and the whole look is `intro.css`. What it shares with the
// talk is machinery, not style: the Lean grammar, the marks and annotations
// inside a listing, and the derivation widget, each restyled from `intro.css`.

import Reveal from 'reveal.js'
import Highlight from 'reveal.js/plugin/highlight'
import Notes from 'reveal.js/plugin/notes'

// Bundled, like the talk's: nothing is fetched at the venue.
import '@fontsource/jersey-15/400.css'
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/500.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-mono/400.css'
import '@fontsource/fira-mono/500.css'

import 'reveal.js/reveal.css'
import './derivation.css'
import './intro.css'

import { applyCodeMarks } from './code-marks.js'
import { initDerivations } from './derivation.js'
import lean from './lean-hljs.js'
import { installBlocks } from './voxel.js'

// highlight.js ships no Lean grammar; see main.js for why the plugin is
// instantiated here rather than in `plugins`.
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
  pdfSeparateFragments: true,
})

// After highlighting, so the spans these add survive it; and after the slides
// exist, so the widget can find its mount point and claim its fragments.
applyCodeMarks()
initDerivations(Reveal)

// The footage plays once, from the top, when its slide arrives, and holds its
// last frame. That keeps the talk's rule — motion answers a key press — where
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
