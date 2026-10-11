# Working in this repo

`AUTHORING.md` is the authoring reference — the slide and element classes the
deck draws on. Read it before inventing a layout. This file is the things that
bite you.

## Long-running processes

**Never start a server with a bare `&`.** It becomes an orphan nobody is
tracking and the port stays occupied after the session ends. Either use the
harness's background execution, or hand the command over: "run `npm run dev`
and open <http://localhost:5173>". Prefer handing it over for `npm run dev` —
reviewing slides is something Harrison does anyway, and the animations don't
survive a screenshot. A stray server: `lsof -ti:5173`.

## Snapshots

`npm run snap -- --slides 24` overwrites just those files; only a plain
`npm run snap` clears `snapshots/` first (so renumbered slides don't leave
stale files). Snapshot the slides you touched, not the whole deck.

Nothing in the deck clips — a listing that doesn't fit overflows visibly — so
a snapshot is what catches an overlong slide.

## One deck, one theme

`talk.md` is the talk and the only deck; `src/themes/nord.css` is the
only theme. Both are hardcoded in `src/main.js`.

`intro.html` is a spike beside it: the same talk in a stylized form, with its
own entry (`src/intro.js`) and its own stylesheet (`src/intro.css`), and
nothing from `talk.md` or `base.css`. It does import `lean-hljs.js`,
`code-marks.js` and the derivation widget, so a change to one of those shows
in both decks; `intro.css` restyles them. The README has how to run it. The
motion rule below holds there too — its one clip plays once when its slide
arrives.

`nord.css` should only set variables. Anything structural — spacing, a new
layout class — belongs in `src/base.css`.

## Motion

The rule is **nothing moves unless Harrison clicks**. A slide transition, a
fragment arriving, an auto-animate morph — all fine, that's motion answering a
key press. What's banned is anything that animates on its own once a slide has
settled: blinking, pulsing, looping, a widget that plays itself.

- `src/base.css` overrides reveal's transition defaults *including* any
  `data-transition` on a slide, so adding one has no effect. Reach for a
  fragment or `data-auto-animate` instead; auto-animate is driven by reveal's
  own `!important` rules and isn't caught by the override.
- Those selectors lead with `.reveal-viewport` to match the specificity of
  reveal's own `.reveal.fade .slides section:not([data-transition])` rule.
  Drop it and the whole block silently loses — every slide goes back to
  reveal's 0.5s while fragments keep the declared `--t-fade`, which reads as
  some slides drifting and others cutting. That bug was live for a while.
- A duration goes in `:root` as a `--t-*` token, not inline on the rule. Both
  `scripts/snap.js` and `scripts/pdf.js` blank that list before capturing, so
  a new token has to be added there too or its slide gets photographed
  mid-move.
- `.w` (the word groups an auto-animated sentence is cut into) is
  `inline-block` in `base.css` because reveal moves things with a `transform`,
  which an inline span ignores.

### Auto-animating a sentence

A sentence carried across two slides is cut into `span.w` word groups; those
with a shared `data-id` travel, the rest are cut and faded by reveal.
`src/auto-animate.js` handles it, and three things have to hold:

- **Break the sentence the same way on both slides** — an explicit `<br>`, at
  the same word on every one of them. A word that changes line travels a
  diagonal across the others, and it reads as a clunk.
- **A `.w` moves as a rigid piece** — transform only, no font-size tween.
  Reveal's default for a span is both, and running font-size through layout
  is what makes a sentence wrap to three lines at the cut and reflow as it
  shrinks.
- **`ol.sections` travels as one piece**, and the rows inside are
  deliberately *not* matched. That only works because the list is
  shrink-wrapped and everything in it is in `em`, so the closing slide's
  list is the same shape scaled; put a `rem` back, or let the section-child
  rule's `width: 100%` win again, and it will stretch as it lands. The tile
  size is a registered `@property` for a reason given beside it.

A word that is new on the second slide carries `class="w arrives"`: it fades in
over the last 30% of the run, after the words around it have landed, instead of
sitting fully formed at its destination while they're still en route. Reveal
cuts the outgoing slide instantly on an auto-animate, so the old word just
goes; there's no cross-fade to be had.

### Auto-animating two listings

Three things have to line up, and all three are needed:

1. Both slides carry `data-auto-animate` and their `<pre>`s share a `data-id`.
2. The `<pre>`s are **pinned to one box** — `class="pinned"` with
   `style="--cols: 45; --rows: 10"`, the widest line and tallest listing of the
   run. Reveal animates one block onto the other, so if they differ in size at
   all (they're shrink-wrapped otherwise) the *whole block* slides and resizes
   and nothing inside it can hold still. A couple of pixels is enough.
3. The fences carry an **empty line-number spec, `[]`**. That's not a nothing:
   reveal only rewrites a listing into one-row-per-line `<table>` markup when
   the attribute is present, and that per-line element is what auto-animate
   matches on.

`src/auto-animate.js` (installed as `autoAnimateMatcher` in `src/main.js`) goes
one level finer than reveal's line matching: within a changed line it keeps
every token sitting at the same column on both slides. A token that moved
column counts as changed.

Add `class="scales"` to hand a pair back to reveal as a plain
translate-and-scale instead. Reveal's own treatment tweens the box while the
text pops to its new size, which reads as a jump whenever the two listings are
set at different sizes.

The `[]` markup is a `<table>`, which needs the three rules in the code section
of `base.css` — hide the number gutter, take back the `0.7em` reveal shrinks
prose tables to, give the cells `--code-lh` — or it renders 30% small with
visible line numbers.

`npm run snap` turns auto-animate off, so it can't photograph a listing
mid-morph. Put `data-auto-animate-restart` on a slide that follows another
auto-animated slide but should cross-fade into view rather than morph from it.

## Code listings

- **The line-number spec takes digits, commas, pipes and hyphens only.**
  Reveal's markdown plugin parses it with `/\[\s*((\d*):)?\s*([\s\d,|-]*)\]/`,
  so a step written `[all]` doesn't fail loudly — the bracket stops matching,
  no `data-line-numbers` attribute is set, and the whole spec silently becomes
  a no-op. To finish on the whole listing, give the range: `[1-2|4-6|1-6]`.
- A multi-step spec is not one listing that restyles itself: reveal clones the
  `<code>` once per step and stacks the copies, each later one positioned over
  the first. Code here sits in no box, so those copies are transparent, and
  step 1 would show straight through and read as "nothing ever dims".
  `base.css` gives the stacked copies the slide's own background.
- Mark classes (`mark-zeros`, `mark-brackets`, `mark-rec`, `mark-fuel`) are applied *after* highlight.js
  rewrites the block, by `src/code-marks.js`; add another by adding a regex to
  `MARKS` there. `dim-rest` alongside one drops the rest of the listing to
  muted grey.

## Syntax highlighting

**Two of the deck's languages are ours.** `lean` is not a highlight.js language
at all (`src/lean-hljs.js`), and `ocaml` is registered over the one
highlight.js ships (`src/ocaml-hljs.js`) — its own tags neither punctuation nor
lowercase type names, which between them are most of what a listing on a slide
is made of. Both are registered in `src/main.js` before `Reveal.initialize`.
The categories they emit, and what each is for, are written at the foot of
`src/base.css`; the colours are in `src/themes/nord.css`. Change one grammar
and check the other — they are deliberately cut to the same shape, so that an
OCaml slide and a Lean slide read as one deck. Any other language falls through
to highlight.js's own grammar and renders without that treatment.

Three traps to know about:

- **A type run is a mode, not a lookup.** `let rec g : tree generator` gets its
  teal from a mode that opens on a spaced `:` and closes at the `=`, `)` or end
  of line — same for `type …` and `of …`. Anything inside it inherits the type
  colour, arrows included, which is the point: `seed -> 'a * seed` is one
  phrase and the `->` of `fun s ->` two characters later is not. That means the
  modes those runs contain must not swallow their own terminators — the
  punctuation mode inside one carries the *openers* only. Get that wrong and
  the type silently eats the rest of the line.
- **`=` goes to different categories in the two languages.** OCaml binds with
  it, so it is punctuation there; Lean binds with `:=`, so a bare `=` is
  equality and stays an operator.
- **`beginScope` does nothing** in the highlight.js reveal bundles, so the `:`
  that opens an ascription is inside the type span rather than punctuation
  beside it. That's why it comes out teal.

Weights are three, from `src/base.css`: `--code-weight` for a listing,
`--code-weight-quiet` for punctuation and comments, `--code-weight-loud` for a
mark. Fira Mono ships 400/500/700 and `src/main.js` imports all three; adding a
fourth weight means adding a `@fontsource` import.

## Derivation widget

`<div class="derivation" data-derivation="frames"></div>` renders a stepped Lean
proof (tactic script / goals / synthesised term). Steps live in
`src/derivations.js` as data; the widget claims one reveal fragment per step.

- Motion is **a cross-fade and nothing else**: what arrived on this step —
  the new tactic line, the goals it opened, the `[[…]]` mark — fades up over
  `--t-fade`, and lines that recede into `is-past` transition there. Nothing
  travels or resizes. `animated` on the widget puts travel back, and nothing
  uses it.
- Both panes **reconcile rather than rebuild** — goals keyed by `id`, script
  lines keyed by position. A goal that persists across a step must keep its
  id or it blinks.
- Type and colour come from the deck, not from the widget: `src/derivation.js`
  tags its tokens with highlight.js's own class names so the `.hljs-*` rules at
  the foot of `base.css` paint a derivation and a ```lean fence identically.
  Change the operator/punctuation split in `src/lean-hljs.js` and change it
  there too.
- `[[…]]` marks what changed on that step.
- The per-step `note` is **not drawn**. What Harrison says out loud lives in
  the slide's speaker notes in `talk.md`.
- The panes are 0.52em: about 37 columns for a script line and 37 for a goal.
  Break a long statement by hand in `src/derivations.js` rather than shrink it.
- **The PDF steps.** `pdfSeparateFragments` is on, so reveal clones a slide
  once per fragment step, and JavaScript doesn't run in those clones; the
  widget rebuilds itself per page from `pdf-ready`. Check a change to it with
  `npm run pdf`.

