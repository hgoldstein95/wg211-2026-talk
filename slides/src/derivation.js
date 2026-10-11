/* ===========================================================================
   derivation.js — steps a Lean tactic proof forward, one fragment at a time.

   Drop this into a slide:

     <div class="derivation" data-derivation="pick"></div>

   and the widget looks up `pick` in src/derivations.js, renders its three
   panes (tactic script / goals / synthesised term) and wires itself to
   reveal's fragment machinery, so space and shift-space walk the derivation
   forwards and backwards like any other build.

   Why not just paste screenshots of the Lean editor, as the PowerPoint did?
   Because the term pane — which the screenshots never showed — makes the point
   of the whole section visible: every tactic fills a hole in a program.

   Three panes and that's all: the `note` on each step is *not* drawn. What
   Harrison says out loud lives in the slide's speaker notes in
   talk.md; the notes in src/derivations.js only document the steps.

   Both panes reconcile rather than rebuild. The goal list is keyed by id, and
   the tactic script by line position, so anything that survives a step keeps
   its DOM node — which is what lets a goal transition to `closed` and a line
   settle back into `is-past` instead of being redrawn already dim. Only what
   actually arrived on this step is new, and only that fades in.

   By default the widget's motion is a cross-fade and nothing more. Add
   `animated` to its class list and things travel as well: a new tactic line
   slides in, an arriving goal rises into place, and a goal that persists
   slides to wherever the step moved it — see derivation.css. (A goal's `from`
   names the goal it was split out of. It once drove a flight out of the
   parent's box; that put two goals on top of each other at the start of every
   branch, and it is gone. The field is kept as documentation of the tree.)
   =========================================================================== */

import { derivations } from './derivations.js'

// --- Lean-ish tokenising ----------------------------------------------------

const KEYWORDS = new Set([
  'example',
  'theorem',
  'def',
  'fun',
  'by',
  'apply',
  'exact',
  'refine',
  'intro',
  'intros',
  'ext',
  'case',
  'aesop',
  'constructor',
  'generator_search',
  'do',
  'match',
  'with',
  'return',
  'let',
])

// Split out in the same two groups src/lean-hljs.js uses, and for the same
// reason: the connectives are the argument and the delimiters are furniture.
// `⊢` goes with the delimiters — it is the frame a goal is written in, not
// part of the proposition.
const OPERATORS = '∀∃λΣΠ→←↔↑↓∧∨¬≠≤≥∈∉⊆∅×∘'
const DELIMITERS = '()[]{}⟨⟩⦃⦄,;:|⊢'

const SCANNER = new RegExp(
  [
    "(\\?[A-Za-z][\\w']*)", // ?g — a metavariable
    "([A-Z][\\w']*(?:\\.[A-Za-z][\\w']*)*)", // Nat, CorrectGen.pick
    "([a-z_][\\w']*)", // an ordinary identifier or a tactic
    '(\\d+)',
    '(:=|::)', // before the bare `:` below
    `(<->|->|=>|<-|=|[${OPERATORS}])`,
    `([${DELIMITERS.replace(/[[\]]/g, '\\$&')}])`,
    '(\\s+)',
    '([\\s\\S])',
  ].join('|'),
  'g'
)

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const wrap = (cls, text) => `<span class="${cls}">${escapeHtml(text)}</span>`

/**
 * Colour one run of Lean source.
 *
 * The classes are highlight.js's own — `hljs-keyword`, `hljs-type`,
 * `hljs-operator` — so a derivation is painted by the same rules at the foot
 * of base.css that paint every ```lean fence in the deck, and picks up any
 * later change to them for free. What that means in practice: keywords blue,
 * an identifier starting with a capital (`CorrectGen.pick`, `Eq.comm`) is a
 * type or constructor and goes teal, the connectives that carry a proposition
 * (`∃ ∀ ∈ ↔ ∨ =`) take the keyword blue, the delimiters that frame it
 * (`( ) , : := ⊢`) drop to the light grey, numbers purple, and ordinary
 * identifiers are body colour — exactly as src/lean-hljs.js leaves them.
 *
 * The split matters most on the goal pane, where every line is a proposition:
 * greying `∃` and `↔` with the brackets would mute the statement, and leaving
 * the brackets at body weight leaves the pane shouting. Slide 36 shows the
 * same statement as a plain listing, and the two have to match.
 *
 * @param {string} src
 * @param {boolean} holes  render `?x` metavariables as filled-in holes
 *                         (the term pane) rather than plain metavariables
 *                         (the goal pane).
 */
function tokenise(src, holes) {
  let out = ''
  for (const m of src.matchAll(SCANNER)) {
    const [all, mvar, con, ident, num, bind, op, delim, space, other] = m
    if (mvar) out += wrap(holes ? 'hole' : 'deriv-mvar', mvar)
    else if (con) out += wrap('hljs-type', con)
    else if (ident) out += KEYWORDS.has(ident) ? wrap('hljs-keyword', ident) : escapeHtml(ident)
    else if (num) out += wrap('hljs-number', num)
    else if (bind || delim) out += wrap('hljs-punctuation', bind ?? delim)
    else if (op) out += wrap('hljs-operator', op)
    else out += escapeHtml(space ?? other ?? all)
  }
  return out
}

/**
 * Render a string that may contain `[[…]]` spans marking the part that
 * changed on this step. Those get the highlight-and-fade treatment.
 */
function render(src, { holes = false } = {}) {
  let out = ''
  let last = 0
  for (const m of src.matchAll(/\[\[([\s\S]*?)\]\]/g)) {
    out += tokenise(src.slice(last, m.index), holes)
    out += `<span class="deriv-mark">${tokenise(m[1], holes)}</span>`
    last = m.index + m[0].length
  }
  return out + tokenise(src.slice(last), holes)
}

/** `[[…]]` markers are presentation only; strip them to compare two steps. */
const plain = (s) => s.replace(/\[\[|\]\]/g, '')

// --- The widget -------------------------------------------------------------

class Derivation {
  constructor(root, spec) {
    this.root = root
    this.spec = spec
    this.step = -1
    this.goalEls = new Map() // goal id -> element, for keyed reconciliation

    root.classList.add('derivation')
    root.innerHTML = `
      <div class="derivation-pane derivation-script" data-label="tactics"></div>
      <div class="derivation-right">
        <div class="derivation-pane derivation-goals" data-label="goals"></div>
        <div class="derivation-pane derivation-term" data-label="term"></div>
      </div>`

    this.scriptEl = root.querySelector('.derivation-script')
    this.goalsEl = root.querySelector('.derivation-goals')
    this.termEl = root.querySelector('.derivation-term')

    this.show(0)
  }

  show(n) {
    const i = Math.max(0, Math.min(n, this.spec.steps.length - 1))
    if (i === this.step) return
    const prev = this.spec.steps[this.step] ?? null
    const step = this.spec.steps[i]
    this.step = i

    this.renderScript(step, prev)
    this.renderGoals(step)
    this.renderTerm(step, prev)
  }

  // Lines that weren't in the previous step fade in; everything above the
  // newest line dims. Both are cheap to compute because every step carries the
  // whole script, so a plain positional diff is enough.
  //
  // The lines are *keyed by position*, the way the goals are keyed by id: a
  // line that survives a step keeps its DOM node, so when it stops being the
  // newest one it can transition into the dimmed `is-past` state instead of
  // being rebuilt already dim. Rebuilding the pane wholesale is what made
  // stepping read as a cut — every line on screen changed opacity in one
  // frame, including the ones that hadn't changed at all.
  renderScript(step, prev) {
    const before = (prev?.lines ?? []).map((l) => plain(l.text))
    let newest = -1

    const existing = [...this.scriptEl.children]
    step.lines.forEach((line, k) => {
      const fresh = plain(line.text) !== before[k]
      if (fresh) newest = k

      let el = existing[k]
      if (!el) {
        el = document.createElement('span')
        el.className = 'derivation-line'
        this.scriptEl.append(el)
      }
      el.classList.toggle('is-new', fresh)
      el.style.setProperty('--indent', line.indent ?? 0)
      el.dataset.k = k
      // Re-render on any change to the source, not just a `fresh` one: the
      // step that stops marking a line still has to drop its `[[…]]` mark.
      if (el.dataset.src !== line.text) {
        el.innerHTML = render(line.text)
        el.dataset.src = line.text
      }
    })

    // Stepping backwards shortens the script.
    for (const el of existing.slice(step.lines.length)) el.remove()

    for (const el of this.scriptEl.children) {
      el.classList.toggle('is-past', Number(el.dataset.k) < newest)
    }
  }

  // Keyed reconciliation + FLIP. Goals that persist across a step keep their
  // DOM node, so in `.animated` mode they slide to their new place rather than
  // blink; goals that are new arrive where they belong.
  renderGoals(step) {
    const rects = new Map()
    for (const [id, el] of this.goalEls) rects.set(id, el.getBoundingClientRect())

    const goals = step.goals ?? []
    const next = new Map()
    const entering = []

    this.goalsEl.replaceChildren()

    if (goals.length === 0) {
      this.goalsEl.innerHTML =
        `<div class="derivation-empty is-entering">${step.done ?? 'No more goals.'}</div>`
      this.goalEls = next
      return
    }

    for (const goal of goals) {
      let el = this.goalEls.get(goal.id)
      if (el) {
        // Putting a node back in the document restarts its CSS animation, and
        // a goal that is staying should not arrive twice.
        el.classList.remove('is-entering')
      } else {
        el = document.createElement('div')
        el.className = 'derivation-goal'
        entering.push(el)
      }
      el.dataset.state = goal.state ?? 'active'
      // Re-render only when the source changed, like the script lines: an
      // untouched goal keeps its DOM subtree, so the `[[…]]` wash-in can't
      // replay on a step that didn't touch it.
      const src = `${goal.label ?? ''}\n${goal.text}`
      if (el.dataset.src !== src) {
        el.innerHTML =
          (goal.label ? `<span class="derivation-goal-label">${escapeHtml(goal.label)}</span>` : '') +
          render(goal.text)
        el.dataset.src = src
      }
      this.goalsEl.append(el)
      next.set(goal.id, el)
    }
    this.goalEls = next

    // Second pass, after layout: play everything from its old position.
    for (const [id, el] of next) {
      const from = rects.get(id)
      if (!from || !from.width) continue
      const to = el.getBoundingClientRect()
      this.slide(el, from.left - to.left, from.top - to.top)
    }

    // An arriving goal fades up in place — rising half a line as it does in
    // `.animated` mode, each a beat behind the one above it (`--enter`).
    entering.forEach((el, k) => {
      el.style.setProperty('--enter', k)
      el.classList.add('is-entering')
    })
  }

  get animated() {
    return this.root.classList.contains('animated')
  }

  // Still (the default): the goal is simply in its new place. `.animated`
  // plays it travelling there from the old one, over --deriv-move.
  slide(el, dx, dy) {
    if (!this.animated || (!dx && !dy)) return
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: this.moveMs,
      easing: 'cubic-bezier(.22,.9,.3,1)',
      fill: 'backwards',
    })
  }

  // --deriv-move, in milliseconds. A custom property is handed back as
  // written, `calc()` and all, so derivation.css also sets it as the widget's
  // transition-duration, which the browser does resolve.
  get moveMs() {
    return parseFloat(getComputedStyle(this.root).transitionDuration) * 1000
  }

  renderTerm(step, prev) {
    const term = step.term ?? ''
    if (prev && plain(prev.term ?? '') === plain(term)) {
      this.termEl.innerHTML = render(plain(term), { holes: true })
    } else {
      this.termEl.innerHTML = render(term, { holes: true })
    }
  }

}

// --- Wiring to reveal -------------------------------------------------------

export function initDerivations(Reveal) {
  const widgets = []

  for (const root of document.querySelectorAll('[data-derivation]')) {
    const spec = derivations[root.dataset.derivation]
    if (!spec) {
      console.warn(`[derivation] no such derivation: ${root.dataset.derivation}`)
      continue
    }

    const widget = new Derivation(root, spec)
    const section = root.closest('section')

    // One invisible fragment per step after the first. Reveal drives them;
    // we just count how many are currently showing.
    const holder = document.createElement('div')
    holder.className = 'derivation-steps'
    holder.innerHTML = '<span class="fragment"></span>'.repeat(spec.steps.length - 1)
    section.append(holder)

    widgets.push({ widget, holder })
  }

  if (!widgets.length) return

  const sync = () => {
    for (const { widget, holder } of widgets) {
      widget.show(holder.querySelectorAll('.fragment.visible').length)
    }
  }

  for (const event of ['fragmentshown', 'fragmenthidden', 'slidechanged', 'ready']) {
    Reveal.on(event, sync)
  }
  sync()

  // Print is a different DOM and the widgets above don't reach it. Reveal
  // clones the whole slide once per fragment step (`pdfSeparateFragments` in
  // src/main.js), so a derivation that takes seven steps becomes seven pages,
  // each a static copy of this widget's markup as it stood when the clone was
  // taken — which is step 0 on every one of them, since none of the events
  // above fire in that view. What does fire is `pdf-ready`, once, after the
  // pages are built: mount a fresh widget on each page's copy and walk it to
  // the step that page is showing.
  //
  // Walk, not jump. Every step renders against the one before it — which
  // script line is new, whether the term's `[[…]]` marks still stand, whether
  // the note changed — so `show(n)` off `show(0)` is not the same picture as
  // stepping there, and the pages have to look like the deck.
  Reveal.on('pdf-ready', () => {
    for (const page of document.querySelectorAll('.pdf-page')) {
      const roots = page.querySelectorAll('[data-derivation]')
      const holders = page.querySelectorAll('.derivation-steps')

      roots.forEach((root, i) => {
        const spec = derivations[root.dataset.derivation]
        if (!spec) return
        const shown = holders[i]?.querySelectorAll('.fragment.visible').length ?? 0
        const widget = new Derivation(root, spec)
        for (let k = 1; k <= shown; k++) widget.show(k)
      })
    }
  })
}
