// Marking characters *inside* a highlighted listing.
//
// highlight.js rewrites a block's innerHTML from its textContent, so any span
// you write into the Markdown is gone by the time the slide renders. When a
// slide needs to point at something the grammar has no token for — "these
// brackets are the allocation", "these zeros are what shrinking did" — the
// mark has to be applied *after* highlighting. That's this.
//
// Usage, in index.html, on the listing's `<pre>`:
//
//     <pre class="mark-hole"><code class="language-lean">…</code></pre>
//
// Add `mark-step` and the listing arrives plain; the marks come on a press.
//
// Styling is `.code-mark` in deck.css.
//
// A mark is one entry here: the class the slide asks for, and the regex that
// picks the characters out.
//
// Match whole tokens, not substrings. An identifier regex wants a guard on
// both edges — ML identifiers carry digits, `_` and `'`, so a bare /s/ lights
// up the `s` in `split`, `sample` and `Leaf` too.
//
// A listing can also carry *annotations*: an underline under a stretch of it
// with a short label hanging below, arriving one press at a time. Those are
// ANNOTATIONS — the class the slide asks for, then each stretch's exact text
// and its label, in the order they arrive. A stretch may cross highlight.js's
// token spans (`μ : α → ℝ≥0∞` is several), which a regex run over one text
// node at a time can't reach, so it is cut out as a DOM range instead.

const MARKS = {
  // A standalone integer zero, not the 0 inside 10 or 0x2545F491.
  'mark-zeros': /(?<![\w.])0(?![\w.])/g,
  // The recursive calls of the running example: the predicate's
  // (`framesOK ns`) and the generator's (`← genFrames`, `← genFrames fuel`).
  'mark-rec': /\bframesOK ns\b|(?<=← )genFrames(?: fuel)?\b/g,
  // The fold a predicate is written as, and the unfold that undoes it.
  'mark-fold': /\bList\.(?:un)?fold\b/g,
  // What fuel adds to a generator that had none: the counter, and the failure
  // it can now end in.
  'mark-fuel': /\b(?:fuel|failure)\b/g,
  // What lets a generator call itself with nothing decreasing.
  'mark-fixpoint': /\bpartial_fixpoint\b/g,
  // What makes a generator's body a proof: the keyword that opens one.
  'mark-by': /\bby\b/g,
  // The edges of the hole in `genElapsed`: 451 to 899 is never made.
  'mark-hole': /\b(?:450|900)\b/g,
}

// A mark that crosses highlight.js's token spans, which a regex cannot reach:
// the class the slide asks for, and the stretch's exact text.
const STRETCHES = {
  // The branch of the synthesized generator that stops.
  'mark-nil': 'return .nilF',
}

// A mark picked out by what is around it, in other token spans: the class the
// slide asks for, and a regex run over the listing's whole text.
const CONTEXT_MARKS = {
  // The weight of each branch of a `frequency`: `(9, …)`, not `chooseNat 1 64`.
  'mark-weights': /(?<=\()\d+(?=,)/g,
  // The brackets of a list that is built. Not `[]`, which is no allocation,
  // and not `[Gen G]`, which is no list.
  'mark-brackets': /\[(?!\]|Gen\b)|(?<!\[|\bGen G)\]/g,
}

const ANNOTATIONS = {
  // The two halves of Palamedes's goal: a generator, and what it must make.
  'annotate-exists': [
    ['∃ g : G α', 'A Generator'],
    ['∀ a, a ∈ g.support ↔ P a', 'That Samples Exactly P'],
  ],
  // The two halves of the SPMF subtype, named in turn.
  'annotate-spmf': [
    ['μ : α → ℝ≥0∞', 'Mass Function'],
    ["(∑' a, μ a) ≤ 1", 'Total Mass at Most One'],
  ],
}

function wrapMatches(pre, re) {
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
  const texts = []
  while (walker.nextNode()) texts.push(walker.currentNode)

  for (const node of texts) {
    const text = node.nodeValue
    re.lastIndex = 0
    if (!re.test(text)) continue

    re.lastIndex = 0
    const frag = document.createDocumentFragment()
    let last = 0
    let m
    while ((m = re.exec(text))) {
      if (m.index > last) frag.append(text.slice(last, m.index))
      const span = document.createElement('span')
      span.className = 'code-mark'
      // `mark-step` beside the mark's class: the marks wait for a press, and
      // all arrive on the same one.
      if (pre.classList.contains('mark-step')) {
        span.classList.add('fragment')
        span.dataset.fragmentIndex = 0
      }
      span.textContent = m[0]
      frag.append(span)
      last = m.index + m[0].length
    }
    if (last < text.length) frag.append(text.slice(last))
    node.replaceWith(frag)
  }
}

// Cuts `text` out of the listing as a DOM range and puts it back inside one
// span of class `cls`, which is returned.
function wrapStretch(pre, text, cls) {
  const code = pre.querySelector('code') ?? pre
  const at = code.textContent.indexOf(text)
  // A stretch that isn't in the listing is a typo in the table or an edit to
  // the slide. Say so, rather than leave a press that shows nothing.
  if (at < 0) {
    console.warn(`code-marks: "${text}" is not in the listing`, pre)
    return null
  }
  return wrapRange(code, at, text.length, cls)
}

// Cuts `length` characters at `at` out of the listing and puts them back
// inside one span of class `cls`, which is returned.
function wrapRange(code, at, length, cls) {
  const range = document.createRange()
  range.setStart(...textPoint(code, at, false))
  range.setEnd(...textPoint(code, at + length, true))

  // extractContents clones any highlight.js span the range cuts through, so
  // the pieces keep their colours; the wrapper goes back where they came from.
  const wrapper = document.createElement('span')
  wrapper.className = cls
  wrapper.append(range.extractContents())
  range.insertNode(wrapper)
  return wrapper
}

function annotate(pre, text, label) {
  const wrapper = wrapStretch(pre, text, 'code-annot')
  if (!wrapper) return

  // The underline and its label are one *empty* element — the label is CSS
  // content — so the listing's text is unchanged. Reveal's auto-animate pairs
  // a <pre> with the one on the next slide by that text.
  const mark = document.createElement('span')
  mark.className = 'code-annot-mark fragment'
  mark.dataset.label = label
  wrapper.append(mark)
}

// Reveal numbered the slide's fragments before the annotations were there, and
// a fragment with no number arrives after every numbered one. A listing is
// named before the rest of its slide is shown, so its annotations take the
// first numbers and the slide's other fragments move up to make room.
function annotationsFirst(pre) {
  const marks = [...pre.querySelectorAll('.code-annot-mark')]
  const slide = pre.closest('section')
  for (const el of slide.querySelectorAll('.fragment[data-fragment-index]')) {
    el.dataset.fragmentIndex = Number(el.dataset.fragmentIndex) + marks.length
  }
  marks.forEach((mark, i) => (mark.dataset.fragmentIndex = i))
}

// The text node and offset `offset` characters into `root`. A start on the
// seam between two nodes goes to the later one and an end to the earlier, so
// the range never reaches into a neighbouring span for nothing.
function textPoint(root, offset, isEnd) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let seen = 0
  while (walker.nextNode()) {
    const node = walker.currentNode
    const end = seen + node.nodeValue.length
    if (isEnd ? offset <= end : offset < end) return [node, offset - seen]
    seen = end
  }
}

export function applyCodeMarks(root = document) {
  for (const [cls, re] of Object.entries(MARKS)) {
    for (const pre of root.querySelectorAll(`pre.${cls}`)) wrapMatches(pre, re)
  }
  for (const [cls, text] of Object.entries(STRETCHES)) {
    for (const pre of root.querySelectorAll(`pre.${cls}`)) wrapStretch(pre, text, 'code-mark')
  }
  for (const [cls, re] of Object.entries(CONTEXT_MARKS)) {
    for (const pre of root.querySelectorAll(`pre.${cls}`)) {
      const code = pre.querySelector('code') ?? pre
      // Wrapping leaves the text as it was, so the offsets found here hold.
      for (const m of [...code.textContent.matchAll(re)]) {
        wrapRange(code, m.index, m[0].length, 'code-mark')
      }
    }
  }
  for (const [cls, notes] of Object.entries(ANNOTATIONS)) {
    for (const pre of root.querySelectorAll(`pre.${cls}`)) {
      for (const [text, label] of notes) annotate(pre, text, label)
      annotationsFirst(pre)
    }
  }
}
