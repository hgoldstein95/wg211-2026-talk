# Working in this deck

The talk is one reveal.js deck. The slides are written straight into
`index.html`, and the comment at the top of that file is the authoring
reference: the slide kinds, how a block is placed, what the colors mean. Read
it before adding a slide, and copy the nearest existing slide.

| File | What it is |
| ---- | ---------- |
| `index.html` | Every slide and its speaker notes. |
| `src/deck.css` | The whole look. |
| `src/main.js` | Entry point and reveal config. |
| `src/voxel.js` | Draws the blocks (`#blk-…`). |
| `src/code-marks.js` | `mark-*` and `annotate-*` classes on a listing. |
| `src/exploded.js` | The listing that comes apart, turns a piece at a time, and closes up as another. |
| `src/lean-hljs.js` | The Lean grammar; highlight.js ships none. |

`../materials/` is the previous version of the talk, kept for reference. It is
not built and nothing here imports it. Don't edit it, and don't copy its
conventions over.

## Running and checking

- `npm run dev` serves the deck at <http://localhost:5173>. Never start it with
  a bare `&`; use background execution, or ask Harrison to run it.
- `npm run snap -- --slides 18` writes `snapshots/18.png` with every fragment
  fired. Snapshot the slides you touched and look at them. Nothing clips, so a
  slide that is too long overflows visibly there.
- `npm run pdf` writes `talk.pdf`, one page per fragment step.
- Pushing to `main` deploys the deck to GitHub Pages.

## Motion

Nothing moves unless Harrison clicks. A slide change or a fragment arriving is
fine; anything that loops, pulses or plays by itself is not.

Durations are the `--t-*` tokens at the top of `src/deck.css`.
`scripts/snap.js` and `scripts/pdf.js` set them to zero before a capture, so a
new token has to be added in both.

## Listings

- Listings are HTML, so write `&amp;` and `&lt;` inside them.
- highlight.js rewrites a listing from its text, so a `<span>` written inside
  one is lost. To point at part of a listing, step its lines with
  `data-line-numbers`, or add a mark or annotation in `src/code-marks.js`.
