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
//       <div class="beside fragment"><pre><code>…</code></pre></div>
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
// A listing can also take its steps by itself. Make the `.steps` the fragment
// and leave its steps plain:
//
//       <div class="steps fragment">
//         <p></p>
//         <p data-swap="pick">s_pick</p>
//         <p></p>
//       </div>
//
// One press then plays the whole thing, a step every `--t-step`. A press
// before it is through takes it to the end, and going back undoes it at once.
//
// A `.beside` is optional, and is one more press after the last step. The
// built listing moves over to the left, and the `.beside` comes in on its
// right, level with its first line. The first `pre` in it is what the room is
// made for. Anything after that hangs below, and a fragment there is a press
// of its own. What is set against the built listing instead, a word over it
// or a sign in the gap, is placed in deck.css from `--built-cols` and `--gap`.
//
// The look, and all the motion, is the "A listing taken apart" section of
// deck.css. This file only says which state the slide is in.

const LAYOUTS = ['whole', 'apart', 'built']
// Columns between the built listing and what comes in beside it.
const GAP = 6

const point = (text) => text.trim().split(/\s+/).map(Number)
// Characters, not UTF-16 units: the face is monospaced, so this is its width.
const width = (el) => [...el.textContent].length
const widest = (el) => Math.max(...el.textContent.trim().split('\n').map((line) => [...line].length))

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
    // A tile does not shrink as it turns: a `to` face narrower than its
    // `from` keeps the tile's width and sits in the middle of it, so the
    // tiles around it stay as far off as they were.
    piece.style.setProperty('--slack', Math.max(0, from - to))
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

  // The built listing and what stands beside it are centered as one, so the
  // listing moves left by half of what it gains.
  const beside = root.querySelector('.beside')
  if (beside) {
    const [x, y] = centered('built', [extent.built.cols + GAP, 0])
    beside.style.setProperty('--x', x)
    beside.style.setProperty('--y', y)
    root.style.setProperty('--over', (GAP + widest(beside.querySelector('pre'))) / 2)
    root.style.setProperty('--built-cols', extent.built.cols)
    root.style.setProperty('--gap', GAP)
  }

  // Painted by the grammar every listing uses, so a piece is the same code
  // whether it is in a listing or out of one.
  for (const el of root.querySelectorAll('.from, .to, .glue')) {
    el.innerHTML = hljs.highlight(el.textContent, { language: 'lean' }).value
  }
}

// Puts the listing in the state it has after `count` of its steps.
function show(root, steps, count) {
  root.classList.toggle('is-apart', count > 0 && count < steps.length)
  root.classList.toggle('is-built', steps.length > 0 && count === steps.length)
  root.classList.toggle('is-moved', root.querySelector('.beside.visible') !== null)

  const swapped = new Set(steps.slice(0, count).map((step) => step.dataset.swap).filter(Boolean))
  for (const piece of root.querySelectorAll('.piece')) {
    piece.classList.toggle('is-swapped', swapped.has(piece.dataset.swap))
  }
  // Reveal shows the current step when the steps are fragments. When they
  // play, this does.
  steps.forEach((step, i) => step.classList.toggle('is-current', i === count - 1))
}

// The clock of a listing that is playing.
const clocks = new WeakMap()

// The steps of a listing that plays are one fragment, `run`. The press that
// shows it starts the clock. Anything else finds the listing either whole or
// built: a slide arrived at from the one after it, a print page, a capture
// (which has no durations), or a press while the clock is still running.
function play(root, run, steps, event) {
  clearTimeout(clocks.get(root))
  if (!run.classList.contains('visible')) return show(root, steps, 0)

  const beat = parseFloat(getComputedStyle(root).getPropertyValue('--t-step')) * 1000
  const pressed = event?.type === 'fragmentshown' && event.fragments?.includes(run)
  if (!pressed || !beat) return show(root, steps, steps.length)

  let count = 0
  const step = () => {
    show(root, steps, ++count)
    if (count < steps.length) clocks.set(root, setTimeout(step, beat))
  }
  step()
}

function sync(root, event) {
  const steps = [...root.querySelectorAll('.steps > p')]
  const run = root.querySelector('.steps.fragment')
  if (run) return play(root, run, steps, event)
  show(root, steps, steps.filter((step) => step.classList.contains('visible')).length)
}

export function initExploded(Reveal, hljs) {
  // Queried afresh each time: print builds one page per fragment step, each
  // with its own copy of the slide.
  const update = (event) => {
    for (const root of document.querySelectorAll('.exploded')) {
      prepare(root, hljs)
      sync(root, event)
    }
  }

  for (const event of ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready', 'pdf-ready']) {
    Reveal.on(event, update)
  }
  update()
}
