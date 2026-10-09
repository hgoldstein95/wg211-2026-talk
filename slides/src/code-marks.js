// Marking characters *inside* a highlighted listing.
//
// highlight.js rewrites a block's innerHTML from its textContent, so any span
// you write into the Markdown is gone by the time the slide renders. When a
// slide needs to point at something the grammar has no token for — "these
// brackets are the allocation", "these zeros are what shrinking did" — the
// mark has to be applied *after* highlighting. That's this.
//
// Usage, in talk.md, on the line after a fenced block:
//
//     <!-- .element: class="mark-brackets" -->
//
// Styling is `.code-mark` in the Marks section of base.css. Pair a mark with
// `dim-rest` — `class="mark-zeros dim-rest"` — to mute everything it didn't
// catch, so the marked characters carry the slide on their own. Add
// `mark-green` alongside for a mark that means something other than emphasis.
//
// A mark is one entry here: the class the slide asks for, and the regex that
// picks the characters out. Two generic ones ship; add the talk's own beside
// them and delete these if nothing uses them.
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
  // A pair of brackets — the list literal, the array, the block delimiter.
  'mark-brackets': /[[\]]/g,
  // A standalone integer zero, not the 0 inside 10 or 0x2545F491.
  'mark-zeros': /(?<![\w.])0(?![\w.])/g,
  // The recursive calls of the running example: the predicate's
  // (`framesOK ns`) and the generator's (`← genFrames`, `← genFrames fuel`).
  'mark-rec': /\bframesOK ns\b|(?<=← )genFrames(?: fuel)?\b/g,
  // What fuel adds to a generator that had none: the counter, and the failure
  // it can now end in.
  'mark-fuel': /\b(?:fuel|failure)\b/g,
}

const ANNOTATIONS = {
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
      span.textContent = m[0]
      frag.append(span)
      last = m.index + m[0].length
    }
    if (last < text.length) frag.append(text.slice(last))
    node.replaceWith(frag)
  }
}

function annotate(pre, text, label) {
  const code = pre.querySelector('code') ?? pre
  const at = code.textContent.indexOf(text)
  // A stretch that isn't in the listing is a typo in the table or an edit to
  // the slide. Say so, rather than leave a press that shows nothing.
  if (at < 0) {
    console.warn(`code-marks: "${text}" is not in the listing`, pre)
    return
  }

  const range = document.createRange()
  range.setStart(...textPoint(code, at, false))
  range.setEnd(...textPoint(code, at + text.length, true))

  // extractContents clones any highlight.js span the range cuts through, so
  // the pieces keep their colours; the wrapper goes back where they came from.
  const wrapper = document.createElement('span')
  wrapper.className = 'code-annot'
  wrapper.append(range.extractContents())

  // The underline and its label are one *empty* element — the label is CSS
  // content — so the listing's text is unchanged. Reveal's auto-animate pairs
  // a <pre> with the one on the next slide by that text.
  const mark = document.createElement('span')
  mark.className = 'code-annot-mark fragment'
  mark.dataset.label = label
  wrapper.append(mark)
  range.insertNode(wrapper)
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
  for (const [cls, notes] of Object.entries(ANNOTATIONS)) {
    for (const pre of root.querySelectorAll(`pre.${cls}`)) {
      for (const [text, label] of notes) annotate(pre, text, label)
    }
  }
}
