// exploded.js — a listing taken apart, changed a piece at a time, and put back
// together as another listing.
//
// In index.html, a `.exploded` holds the pieces, and the `.steps` at its end
// holds the steps:
//
//     <div class="exploded">
//       <span class="piece" data-swap="pick"
//             data-whole="12 1" data-apart="0 0" data-built="0 0">
//         <span class="from">∨</span><span class="to">oneOf</span>
//       </span>
//       <span class="glue" data-in="built" data-at="6 0">[</span>
//       <div class="steps">
//         <p class="fragment current-visible"></p>
//         <p class="fragment current-visible" data-swap="pick">s_pick</p>
//         <p class="fragment current-visible"></p>
//       </div>
//     </div>
//
// There are three layouts. `whole` is the first listing, `apart` is its pieces
// spread out, and `built` is the second listing. A piece says where it sits in
// each one, as `column row`, counted the way a listing's characters are: the
// layouts are written as if each were a listing of its own, and this file
// centers them on one another. A piece has two faces, what it is `from` and
// what it turns `to`. A `.glue` is text that belongs to one layout only, such
// as a bracket. A piece that `drops` is the other way round: it has no place
// in the built listing, and fades out where it lands.
//
// The steps are fragments, so reveal drives them. The first press takes the
// listing apart and the last one puts it back. A press in between turns the
// pieces whose `data-swap` matches the step's, and shows what the step holds:
// the name of its rule.
//
// The look, and all the motion, is the "A listing taken apart" section of
// deck.css. This file only says which state the slide is in.

const LAYOUTS = ['whole', 'apart', 'built']

const point = (text) => text.trim().split(/\s+/).map(Number)
// Characters, not UTF-16 units: the face is monospaced, so this is its width.
const width = (el) => [...el.textContent].length

function prepare(root, hljs) {
  // A print page is a clone of a slide, and may be a clone of one already
  // prepared.
  if (root.dataset.ready) return
  root.dataset.ready = 'true'

  const pieces = [...root.querySelectorAll('.piece')]
  const glue = [...root.querySelectorAll('.glue')]

  const extent = Object.fromEntries(LAYOUTS.map((name) => [name, { cols: 0, rows: 0 }]))
  const grow = (name, [x, y], w) => {
    extent[name].cols = Math.max(extent[name].cols, x + w)
    extent[name].rows = Math.max(extent[name].rows, y + 1)
  }

  for (const piece of pieces) {
    const from = width(piece.querySelector('.from'))
    const to = width(piece.querySelector('.to'))
    grow('whole', point(piece.dataset.whole), from)
    // Apart, a piece shows either face, so it needs room for the wider one.
    grow('apart', point(piece.dataset.apart), Math.max(from, to))
    if (!piece.classList.contains('drops')) grow('built', point(piece.dataset.built), to)
  }
  for (const el of glue) grow(el.dataset.in, point(el.dataset.at), width(el))

  const cols = Math.max(...LAYOUTS.map((name) => extent[name].cols))
  const rows = Math.max(...LAYOUTS.map((name) => extent[name].rows))
  root.style.setProperty('--cols', cols)
  root.style.setProperty('--rows', rows)

  const centered = (name, [x, y]) => [
    x + (cols - extent[name].cols) / 2,
    y + (rows - extent[name].rows) / 2,
  ]

  pieces.forEach((piece, i) => {
    piece.style.setProperty('--i', i)
    for (const name of LAYOUTS) {
      const [x, y] = centered(name, point(piece.dataset[name]))
      piece.style.setProperty(`--${name}-x`, x)
      piece.style.setProperty(`--${name}-y`, y)
    }
  })
  for (const el of glue) {
    const [x, y] = centered(el.dataset.in, point(el.dataset.at))
    el.style.setProperty('--x', x)
    el.style.setProperty('--y', y)
  }

  // Painted by the grammar every listing uses, so a piece is the same code
  // whether it is in a listing or out of one.
  for (const el of root.querySelectorAll('.from, .to, .glue')) {
    el.innerHTML = hljs.highlight(el.textContent, { language: 'lean' }).value
  }
}

function sync(root) {
  const steps = [...root.querySelectorAll('.steps > .fragment')]
  const shown = steps.filter((step) => step.classList.contains('visible'))

  root.classList.toggle('is-apart', shown.length > 0 && shown.length < steps.length)
  root.classList.toggle('is-built', steps.length > 0 && shown.length === steps.length)

  const swapped = new Set(shown.map((step) => step.dataset.swap).filter(Boolean))
  for (const piece of root.querySelectorAll('.piece')) {
    piece.classList.toggle('is-swapped', swapped.has(piece.dataset.swap))
  }
}

export function initExploded(Reveal, hljs) {
  // Queried afresh each time: print builds one page per fragment step, each
  // with its own copy of the slide.
  const update = () => {
    for (const root of document.querySelectorAll('.exploded')) {
      prepare(root, hljs)
      sync(root)
    }
  }

  for (const event of ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready', 'pdf-ready']) {
    Reveal.on(event, update)
  }
  update()
}
