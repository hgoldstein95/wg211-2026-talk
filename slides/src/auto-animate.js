// Token-level matching for auto-animated listings, and rigid motion for the
// deck's other auto-animated pieces (the word groups of a sentence, the
// sections list).
//
// Reveal's auto-animate matches a listing's lines by their text: a line that
// says the same thing on both slides holds still, and a line that changed is
// "unmatched" — the old one vanishes and the new one fades in, whole. So when
// `let return x = fun s -> (x, s)` becomes `let return x = fun _ -> x`, the
// `let return x = fun` that didn't change blinks out and fades back in along
// with the part that did. This matcher takes over for changed lines: a token
// (a run of non-space characters) that sits at the same column on both slides
// holds still, and only the tokens that actually changed fade in. Nothing
// slides — a token that moved column counts as changed.
//
// Two things it depends on. The listing must carry line-number markup (a `[]`
// spec on the fence), because the per-line `<td>` that produces is what
// reveal — and this — lines up. And the two `<pre>`s must share a `data-id`
// *and* the same box (`.pinned` in base.css): a block that is itself moving
// or resizing can't hold anything inside it still.
//
// Installed as `autoAnimateMatcher` in src/main.js. Reveal calls it with
// `this` bound to its AutoAnimate controller, which is how it gets at the
// default matcher to start from.

const PIECE = 'aa-piece'

// A pair with these options is measured for nothing and animated for nothing:
// reveal marks both ends as targets, which is all that's needed — a target is
// not "unmatched", so it isn't faded, and it isn't moved because nothing was
// measured. That's what "holds still" means here.
const STILL = { translate: false, scale: false, styles: [] }

// A listing that travels — `class="scales"` on both <pre>s — moves and
// resizes as one piece: reveal transforms it from the old box onto the new
// one, text and all. Its own treatment of a code block is to tween the box's
// width and height around text that pops to the new size, which reads as a
// jump when the two listings are set at different sizes. A transform also
// leaves layout alone, so whatever else is arriving on the slide around the
// listing doesn't reflow underneath it while it lands.
const SCALES = { styles: [] }

// The word groups of an auto-animated sentence (`.w`) get the same treatment,
// for the second of those reasons. A span is not one of reveal's "text
// nodes", so left alone it gets the default: a transform scaled from the box
// ratio *and* a font-size tween. On the closing slide, where the sentence
// shrinks, that doubles the scale, and worse, the font-size runs through
// layout — at the cut the words are still full size inside the narrower box,
// the sentence wraps to three lines, and it reflows as it shrinks. A
// transform alone is exact: the word's box is text at a unitless line-height,
// so it scales uniformly, and the layout underneath is final from the first
// frame. (The closing slide is where this bites: it sets the recap smaller,
// so every matched word is scaling as well as travelling.)

// The sections list travels as one piece too, tiles and labels together. The
// list is shrink-wrapped (`width: fit-content`) and everything in it is in
// em, so the closing slide's smaller list is the same shape and the box
// ratio is uniform; see `.sections` in base.css. Its rows are matched by
// reveal as well (an <li> with the same text on both slides), and animated on
// their own they would fight the transform of the whole, so they're dropped.

// Fraction of the run after which an `.arrives` word — one that has no
// counterpart on the slide before — starts to fade in.
// Reveal's default for an unmatched element is to start almost at once, so
// the new word sits fully formed at its destination while the words around
// it are still travelling there. Delayed to the tail of the travel, it fills
// the gap once the line has arrived.
const ARRIVES_AT = 0.7

export function autoAnimateMatcher(fromSlide, toSlide) {
  unwrap(fromSlide)
  unwrap(toSlide)

  const duration = this.Reveal.getConfig().autoAnimateDuration
  for (const el of toSlide.querySelectorAll('.arrives')) {
    el.dataset.autoAnimateDelay = duration * ARRIVES_AT
    el.dataset.autoAnimateDuration = duration * (1 - ARRIVES_AT)
  }

  // Reveal's own pairs: data-id, headings, media, code blocks and — inside
  // code blocks — the lines whose text is the same on both sides.
  let pairs = this.getAutoAnimatePairs(fromSlide, toSlide)

  // Drop anything inside a list that travels as one piece.
  const lists = pairs.filter((p) => p.from.matches('ol.sections')).map((p) => p.to)
  pairs = pairs.filter((p) => !lists.some((list) => list !== p.to && list.contains(p.to)))

  const matched = new Set(pairs.map((p) => p.to))

  for (const pair of [...pairs]) {
    const { from, to } = pair
    if (from.classList.contains('w')) {
      pair.options = SCALES
      continue
    }
    if (from.matches('ol.sections')) {
      pair.options = SCALES
      continue
    }
    if (from.nodeName !== 'PRE') continue
    if (from.classList.contains('scales') && to.classList.contains('scales')) {
      pair.options = SCALES
      continue
    }
    const fromLines = from.querySelectorAll('.hljs-ln-code')
    const toLines = to.querySelectorAll('.hljs-ln-code')

    toLines.forEach((toLine, i) => {
      const fromLine = fromLines[i]
      if (!fromLine || matched.has(toLine)) return

      const kept = sharedTokens(fromLine.textContent, toLine.textContent)
      if (kept.length === 0) return

      const fromPieces = wrap(fromLine, kept)
      for (const piece of wrap(toLine, kept)) {
        if (piece.token < 0) continue
        // The from-side piece under this one's first column. Both sides are
        // cut at the same token edges, but highlight.js may have split the
        // text differently inside a token, so a token can be more than one
        // piece on either side.
        const counterpart = fromPieces.find(
          (p) => p.token === piece.token && p.start <= piece.start && piece.start < p.end
        )
        // Both sides are cut at the same token edges, so this shouldn't miss;
        // if it ever does, an unmatched piece just fades instead of throwing
        // mid-transition.
        if (!counterpart) continue
        pairs.push({ from: counterpart.el, to: piece.el, options: STILL })
      }
    })
  }

  return pairs
}

// Column ranges of the tokens in `to` that `from` has, character for
// character, at the same columns — and as whole tokens: `s` at column 10 is
// not shared with the `s` inside `cs` at columns 9–10.
function sharedTokens(from, to) {
  const kept = []
  for (const m of to.matchAll(/\S+/g)) {
    const start = m.index
    const end = start + m[0].length
    if (
      from.slice(start, end) === m[0] &&
      (start === 0 || /\s/.test(from[start - 1])) &&
      (end === from.length || /\s/.test(from[end]))
    ) {
      kept.push({ start, end })
    }
  }
  return kept
}

// Wraps every text node in the line into spans, cut at the edges of the kept
// ranges, so that each kept token is an element reveal can mark as a target
// and each changed stretch is an element reveal can fade. Returns the pieces
// in column order with the index of the kept token they belong to, or -1.
function wrap(line, kept) {
  const pieces = []
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)

  let col = 0
  for (const node of nodes) {
    const text = node.nodeValue
    const start = col
    const end = col + text.length
    col = end

    const cuts = new Set([start, end])
    for (const k of kept) {
      if (k.start > start && k.start < end) cuts.add(k.start)
      if (k.end > start && k.end < end) cuts.add(k.end)
    }
    const edges = [...cuts].sort((a, b) => a - b)

    const frag = document.createDocumentFragment()
    for (let i = 0; i + 1 < edges.length; i++) {
      const a = edges[i]
      const b = edges[i + 1]
      const el = document.createElement('span')
      el.className = PIECE
      el.textContent = text.slice(a - start, b - start)
      frag.append(el)
      pieces.push({ el, start: a, end: b, token: kept.findIndex((k) => k.start <= a && b <= k.end) })
    }
    node.replaceWith(frag)
  }
  return pieces
}

// Undoes `wrap` on every line of a slide, so each transition starts from
// clean markup: which tokens are shared depends on which slide is the other
// end, so the pieces are specific to one transition.
function unwrap(slide) {
  for (const line of slide.querySelectorAll('.hljs-ln-code')) {
    const pieces = line.querySelectorAll(`.${PIECE}`)
    if (pieces.length === 0) continue
    for (const piece of pieces) piece.replaceWith(...piece.childNodes)
    line.normalize()
  }
}
