/**
 * pdf.js — export the deck to a PDF, one slide per page.
 *
 *   npm run pdf                    # -> talk.pdf
 *   npm run pdf -- --out handout.pdf
 *
 * Uses the dev server if one is running, otherwise builds first.
 */

import { chromium } from 'playwright'
import { join } from 'node:path'

import { root, resolveOrigin } from './serve.js'

const argv = process.argv.slice(2)
const value = (name) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}

const out = join(root, value('out') ?? 'talk.pdf')
const WIDTH = Number(value('width') ?? 1280)
const HEIGHT = Number(value('height') ?? 720)

const { origin, close } = await resolveOrigin({ origin: value('origin') ?? undefined })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } })

await page.goto(`${origin}/?print-pdf`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.Reveal?.isReady?.())
await page.evaluate(() => document.fonts.ready)

// Same reason as in snap.js: the deck's fragment-driven CSS transitions would
// otherwise be caught mid-move, since print-pdf shows every fragment at once
// and nothing here waits for them to settle.
await page.addStyleTag({
  content: ':root { --t-fade: 0s !important; --t-open: 0s !important; }',
})

await page.pdf({
  path: out,
  width: `${WIDTH}px`,
  height: `${HEIGHT}px`,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  preferCSSPageSize: false,
})

await browser.close()
await close()

console.log(out)
