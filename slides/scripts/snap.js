/**
 * snap.js — render every slide to a PNG for reviewing the deck.
 *
 *   npm run snap                  # all slides
 *   npm run snap -- --slides 1,4  # just those slides (1-based)
 *   npm run snap -- --build       # snapshot a production build
 *   npm run snap -- --deck intro  # another deck: intro.html -> snapshots/intro/
 *
 * Output: snapshots/NN.png. Uses the dev server if one is running.
 */

import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

import { root, resolveOrigin } from './serve.js'

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const value = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}

const WIDTH = Number(value('width') ?? 1280)
const HEIGHT = Number(value('height') ?? 720)
const SCALE = Number(value('scale') ?? 2)
const deck = value('deck')
const only = value('slides')
  ?.split(',')
  .map((n) => Number(n.trim()))

const { origin, close } = await resolveOrigin({
  build: flag('build'),
  origin: value('origin') ?? undefined,
})

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
})

// A full run starts from an empty directory so renumbered or removed slides
// don't leave stale files behind; a `--slides` subset only overwrites the
// files it captures and leaves the rest of the set alone.
const outDir = deck ? join(root, 'snapshots', deck) : join(root, 'snapshots')
if (!only) await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

await page.goto(`${origin}/${deck ? `${deck}.html` : ''}#/0`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.Reveal?.isReady?.())
await page.evaluate(() => document.fonts.ready)

// Cross-fades leave the outgoing slide visible in the capture, and the
// auto-animated listings would be photographed mid-morph, so both go off. A
// per-slide `data-transition` beats Reveal.configure, so strip those too —
// otherwise any slide that opts into a custom transition gets photographed
// mid-move, with the outgoing slide still on screen.
await page.evaluate(() => {
  Reveal.configure({
    transition: 'none',
    backgroundTransition: 'none',
    controls: false,
    autoAnimate: false,
  })
  for (const slide of Reveal.getSlides()) {
    slide.removeAttribute('data-transition')
    slide.removeAttribute('data-transition-speed')
  }
  Reveal.sync()
})

// The deck's own motion — the arc slide's travel, the unfolding triangle —
// runs on CSS transitions keyed off fragments, which Reveal.configure knows
// nothing about, so a 120ms wait would photograph them mid-move. Zeroing the
// durations lands every one of them on its finished state.
await page.addStyleTag({
  content: ':root { --t-fade: 0s !important; --t-open: 0s !important; }',
})

const indices = await page.evaluate(() =>
  Reveal.getSlides().map((slide) => {
    const { h, v } = Reveal.getIndices(slide)
    return { h, v: v ?? 0 }
  })
)

for (const [i, { h, v }] of indices.entries()) {
  const n = i + 1
  if (only && !only.includes(n)) continue

  await page.evaluate(
    ({ h, v }) => {
      Reveal.slide(h, v)
      // Fire every fragment so the finished state of the slide is captured.
      while (Reveal.nextFragment()) {}
    },
    { h, v }
  )
  await page.waitForTimeout(120)

  const name = `${String(n).padStart(2, '0')}${v ? `-${v}` : ''}.png`
  await page.screenshot({ path: join(outDir, name) })
  process.stdout.write(`snapshots/${deck ? `${deck}/` : ''}${name}\n`)
}

await browser.close()
await close()
