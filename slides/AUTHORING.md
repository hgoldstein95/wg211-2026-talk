# Authoring reference

## Writing slides

Everything lives in `talk.md`.

- `---` on its own line starts a new slide.
- `--` on its own line starts a _vertical_ slide (stacked under the previous
  one — good for optional depth you can skip live).
- `Note:` at the start of a line makes the rest a speaker note.

Give a slide a class with an HTML comment anywhere in that slide:

```markdown
<!-- .slide: class="title" -->
```

Give the _previous element_ a class the same way:

```markdown
- This bullet appears on a keypress
  <!-- .element: class="fragment" -->
```

## Slide classes

The deck follows a layout grammar in which **a content slide has no heading**.
It holds one centred thing — a sentence, a listing, a diagram — and that thing
*is* the slide. So there is no default heading, and writing a headline for a
content slide is the wrong move: put the sentence in the body, or make it a
section header.

| Class     | Use                                                              |
| --------- | ---------------------------------------------------------------- |
| *(none)*  | The normal case. Centred content, vertically centred, no heading. |
| `title`   | Title slide: `h1` ranged right, then a `.title-foot` row holding `img.wordmark` (left) and `.byline` (right) on a shared baseline, with `p.venue` centred at the foot. Carries no slide number. |
| `section` | The only slide kind with a heading. `h2` ranged left with an optional subtitle, and three stripes stepping into the right edge. Add `data-section="N"` and the stripes take section N's colour from the agenda tiles (a demo or interlude marker carries the number of the section it sits in); without it they're pale grey. Carries no slide number. |
| `left`    | Range an otherwise ordinary slide left.                           |
| `diagram` | Full-bleed: the slide drops its padding so an SVG, a `figure.demo-shot` (its `img` cropped to 16:9 with `object-fit: cover`) or a `figure.chart` can fill it. Use the `figure` wrapper: a bare multi-line `<img>` gets wrapped in a `<p>` by Markdown and picks up the prose clamp. Add `data-state="chromeless"` to drop the slide number, which would otherwise sit on top of the picture. |
| `paper`   | A paper shown by its masthead, with its citation under it — see `.paper-shot` below. |
| `thanks`  | The closing slide: the previous slide's recap ranged left and shrunk, with `div.thanks-panel` — the thanks and the QR codes — as absolute furniture down the right. |
| `code-lg` / `code-sm` | Sets the size of the listings on that slide. See **Code**. |

Slides are top-anchored-then-centred via `center: false` + `display: 'flex'` in
`src/main.js`, and `margin: 0`, so every measurement in `src/base.css` maps 1:1
onto the deck's own geometry at 1280x720.

## Element classes

`<p class="label">` is the one recurring piece of furniture: a short **bold
centred line above the content**, naming the beat — "Takeaway 2", "Does it
work?", the name of a diagram. Same size as the prose under it; only the weight
changes. Use it sparingly.

Otherwise: `.muted`, `.small`, `.accent`, and reveal's own `.fragment`.
Emphasis is `_italic_`; `**bold**` marks the operative clause and stays in the
body colour.

Bigger pieces, all in `src/base.css`:

| Markup             | What it draws                                              |
| ------------------ | ---------------------------------------------------------- |
| `ol.sections`      | The recurring "where are we" slide: numbered colour tiles, one row per section, as one centred block. Each row wraps its content in a single `<div>`. Four colours are defined; add a `:nth-child(5)` pair in `base.css` for a fifth. |
| `div.cite`         | The small italic source line under a claim.                |
| `div.paper-shot`   | A paper cited by showing it: its masthead (title and authors, cropped from the PDF into `public/papers/`) as a card, followed by a `div.cite`. Goes on a `.paper` slide; the card fits `--shot-h` tall. |
| `div.derivation`   | A stepped Lean proof: tactic script, goals and the synthesised term, one fragment per step. `<div class="derivation" data-derivation="NAME"></div>` looks `NAME` up in `src/derivations.js`, where the steps live as data. CLAUDE.md has the rules. |
| `svg.pbt-diagram`  | The generator → property → pass/fail diagram, and the model-against-code diagram drawn in the same vocabulary, each on a `.diagram` slide. An empty `g.fragment.pbt-focus` inside one greys out everything in its `g.pbt-rest` groups on a press. Each SVG carries its own arrow `<marker>`: one defined on another slide stops rendering when that slide is hidden. |
| `figure.demo-shot` | A screenshot filling a `.diagram` slide, cropped to 16:9.   |
| `figure.chart`     | A chart as the whole slide: the `img` is sized by height to fit between the slide paddings and centred. The sizing is `max-width`/`max-height` only, so the image has to be *bigger* than the slide to fill it — a vector crop out of a PDF typically comes back a few hundred points wide and renders half-size until its root `width`/`height` are scaled up (leave the `viewBox` alone). |
| `p.step-arrow`     | The step between two listings on one slide — `<span class="glyph">↓</span>`. |
| `div.plug`         | One thing to send people to: an `img.qr` with a `<div>` beside it holding a `span.what`, one or two `span.line`s and an `a.link`, as a centred row. The code comes from `npm run qr`, like the closing slide's. |
| `div.thanks-panel` | The right-hand column of the `thanks` slide: `ul.links` — one `<li>` per contact, holding an `img.qr` and a `<div>` with a `span.what` over an `a.link`. The codes are `public/qr/*.svg`, generated by `npm run qr` from the targets at the top of `scripts/qr.js`; their modules are `currentColor`, so a code is ink like anything else on the slide. Change an address and regenerate — the link text and the code are not otherwise tied together. |

A diagram is inline SVG on a `.diagram` slide, drawn at 1280×720 and edited as
coordinates rather than as a component. There is no diagram helper: the shapes
a talk needs are that talk's, and the deck has no vocabulary of tiles and
connectors to reach for.

## Code

Fenced blocks are highlighted by highlight.js. Two languages have grammars of
their own — `src/ocaml-hljs.js` and `src/lean-hljs.js`, both registered in
`src/main.js` — cut so that the two are painted by one scheme; `sml`, `coq`,
`haskell`, `rust`, `python` and friends still fall through to highlight.js and
will render, just without any of that.

Code sits in **no box at all** — no card, no border, no tint — in Fira Mono, at
a medium weight rather than a bold one. Three sizes, set as a slide class:

| Class      | Size  | Fits                                    |
| ---------- | ----- | --------------------------------------- |
| *(none)*   | 28pt  | up to ~13 lines, 50 characters per line |
| `code-lg`  | 32pt  | one to five lines, 42 characters        |
| `code-sm`  | 24pt  | up to ~16 lines, 58 characters          |
| `code-xs`  | 19pt  | a comparison: two listings side by side, 70 characters between them |

Reformat the listing before reaching for `code-sm`, and don't go below it for
a listing that is there to be read.

**A comparison goes on one slide**, even when that means setting the code
small: test and proof, fold and unfold, unfueled and fueled. Two listings side
by side are a `div.pair` (add `wide` to the slide for the side margins), with
`fragment` on the second so it arrives on a press; `code-xs` is the size for
it. The two shapes next to each other are the point, not every line.

Step through lines by putting a spec after the language — see CLAUDE.md for
what the spec parser will and won't accept:

````markdown
```ocaml [1-2|4-6]
```
````

A before/after pair belongs on **one** slide, with a `p.step-arrow` between the
two listings — that's what the sizes above bought.

A listing that *arrives* under another one on a press — rather than a pair
that's there from the start — is `opens`, with `recedes` on the one above and
a `div.stack` around both:

````markdown
<div class="stack">

```ocaml
type int_list = …
```
<!-- .element: class="recedes" -->

```ocaml[|2]
let prop_insert … =
  if is_sorted xs then …
```
<!-- .element: class="opens fragment" -->

</div>
````

The first listing floats up *and* left as the second opens under it, landing
left-aligned with it — the `.stack` is what makes that alignment come out of
the listings themselves rather than a measured offset, so either one can be
rewritten freely. Then, on the step where the second highlights a line, the
first recedes with the lines that step didn't highlight. Three presses take
the slide from a type, to a type and a property, to the one line the property
turns on. Don't call it `grow`; that's a reveal fragment class already, and it
scales what it's on to 1.3.

To point at something the grammar has no token for, put a mark class on the
block:

````markdown
```ocaml
Node (Leaf, 0, Leaf)
```
<!-- .element: class="mark-zeros" -->
````

Four ship: `mark-zeros` recolours standalone `0`s, `mark-brackets` recolours
`[` and `]`, `mark-rec` picks out the recursive calls of the running example
(`framesOK ns`, `← genFrames`) and `mark-fuel` what fuel adds to a generator
(`fuel`, `failure`). Add another as one regex in
`src/code-marks.js`.
`dim-rest` alongside a mark drops the rest of the listing to muted grey, so the
marked characters carry the slide on their own; `mark-green` swaps the red
accent for the Aurora green, for a mark that means something other than
emphasis.

To name the pieces of a listing one press at a time — an underline under each
stretch, with a short label hanging below it — put an annotation class on the
block:

````markdown
```lean
def SPMF (α : Type) : Type :=
  {μ : α → ℝ≥0∞ // (∑' a, μ a) ≤ 1}
```
<!-- .element: class="annotate-spmf" -->
````

Each class is one entry in `ANNOTATIONS` in `src/code-marks.js`: the exact text
of each stretch and its label, in the order they arrive. A stretch can cross
token boundaries freely. The label hangs below the line without taking up any
space, so annotate a listing's last line — anywhere else, it lands on top of
the line under it.

### What the colours mean

Both grammars hand the same categories to the `.hljs-*` rules at the foot of
`src/base.css`, so an OCaml listing and a Lean one read alike:

| Category      | In the deck                                          |
| ------------- | ---------------------------------------------------- |
| keyword       | `let` `fun` `type` `def` `by` — the shape of the language |
| operator      | `->` `*` `∃` `→` `≤` — what an expression does. Painted like a keyword, but a theme can split them |
| type          | `tree generator`, `Leaf`, `int list`, `Nat` — every name of a thing, constructors and modules included. A **type ascription** (` : `), a `type` declaration and an `of` payload are whole runs of this: everything inside is the type, arrows and all |
| literal       | `[]`, `true`, and the numbers — constants           |
| meta          | `[@@deriving …]`, `%bind` — the metaprogramming, one colour across both languages |
| punctuation   | `( ) , ; = \| . ~` — scaffolding. Lighter *and* thinner than the rest |
| comment       | prose, in grey italic                                |

Ordinary identifiers are left alone, at the body colour: there is nothing in
ML that tells a call from a variable, and they are the content, so they are
the darkest thing on the slide.

Three weights, not one: `--code-weight` (500) is the listing, punctuation and
comments drop to `--code-weight-quiet`, and `--code-weight-loud` is what a
mark class takes. The colours live in `src/themes/nord.css`; what each one is
*for* is written at the foot of `src/base.css`.

## The theme

`src/themes/nord.css` is white ground, the Nord palette, Fira Sans SemiBold
headings over Montserrat with Fira Mono for code. It also defines the named
Aurora accents (`--nord-green` and friends) that the agenda tiles in
`src/base.css` reach for. **Variables only** — anything structural belongs in
`src/base.css`.

## Repo layout

| Path                 | What it is                                             |
| -------------------- | ------------------------------------------------------ |
| `talk.md`     | The deck itself, in Markdown. **This is the content.**  |
| `src/themes/nord.css`| The theme. Colour and type only.                        |
| `src/base.css`       | Layout, spacing and utility classes.                    |
| `src/main.js`        | reveal.js config; loads the deck, the theme and the grammars. |
| `src/auto-animate.js`| Token-level matching for auto-animated listings and sentences. |
| `src/code-marks.js`  | The `mark-*` classes, applied after highlighting.        |
| `src/derivation.js`  | The derivation widget; `src/derivations.js` is its steps, `src/derivation.css` its panes. |
| `src/ocaml-hljs.js`  | The OCaml grammar. Replaces highlight.js's own.         |
| `src/lean-hljs.js`   | The Lean 4 grammar. highlight.js ships none.            |
| `index.html`         | Thin shell. You will rarely touch it.                   |
| `public/`            | Images and other static assets; served from `/`.        |
| `scripts/`           | `snap.js` (screenshots), `pdf.js` (export), `qr.js` (the closing slide's QR codes), `serve.js` (shared by the first two). |

## PDF details

`npm run pdf` runs headless Chromium against reveal's `?print-pdf` mode, so
text stays selectable. By hand: open <http://localhost:5173/?print-pdf> and
print with **background graphics on** and **margins: none**.

`pdfSeparateFragments` is on in `src/main.js`, so the PDF walks the way the
deck walks: a slide gets a page per fragment step, and a slide with no
fragments is still one page. Every page is numbered by its slide, so several
pages can carry the same number — they are one slide. That is the point of the
thing: it's the backup you present from, so it has to step.

For a handout, `pdfSeparateFragments: false` collapses each slide back to one
page in its finished state — but any slide whose motion is driven by
`:has(.fragment.visible)` rules then lands every beat on one page on top of
itself, and needs `html.print-pdf` overrides to take it back into flow. Add
`&showNotes=true` to the `?print-pdf` URL for the speaker notes.
