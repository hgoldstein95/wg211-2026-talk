// Renders the thank-you slide's QR codes to public/qr/*.svg.
//
// Nothing in the deck loads from the network at runtime (see CLAUDE.md), so
// the codes are generated here, once, and committed as static SVGs. Re-run
// `npm run qr` after changing a target below.
//
// The paths come out `fill="currentColor"` against a transparent ground, so a
// code takes the deck's ink colour like any other mark on a slide.

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import QRCode from 'qrcode'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'qr')

const TARGETS = {
  site: 'https://harrisongoldste.in',
  email: 'mailto:hgoldste@buffalo.edu',
  slides: 'https://harrisongoldste.in/wg211-talk/',
  fpbt: 'https://popl27.sigplan.org/home/fpbt-2027',
}

await mkdir(out, { recursive: true })

for (const [name, data] of Object.entries(TARGETS)) {
  // `margin: 0` because the slide's own spacing is the quiet zone; the
  // wrapper in base.css pads the code back out to the four modules the spec
  // asks for. Medium correction is the default and is plenty for a projected
  // code nobody is scanning off a crumpled page.
  const svg = (await QRCode.toString(data, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }))
    .replace(/#ffffff/gi, 'none')
    .replace(/#000000/gi, 'currentColor')
    .replace(/<svg /, '<svg role="img" aria-label="QR code" ')
  await writeFile(join(out, `${name}.svg`), svg)
  console.log(`${name}.svg  ${data}`)
}
