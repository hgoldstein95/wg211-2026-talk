/* ===========================================================================
   derivations.js — the Palamedes synthesis walkthroughs, as data.

   Each derivation is a list of steps, and each step carries the *whole* state
   at that point:

     lines  the tactic script so far   ({ text, indent })
     goals  the open goals             ({ id, label, text, state, from })
     term   the program built so far
     note   one line of prose: what just happened, and why

   `note` is **not rendered**. The widget draws three panes and nothing else;
   what the speaker actually says out loud lives in the slide's speaker notes
   in talk.md, which are the source of truth. The notes here only
   document what each step means.

   `[[…]]` anywhere in a string marks the part that changed on this step; it
   gets highlighted and fades back to normal. Goal `id`s are what let the
   widget keep a goal's DOM node across steps — a goal that persists must keep
   its id or it blinks.

   Writing the steps out in full is deliberately repetitive: it means a step
   is readable on its own, and the diffing that drives the fade falls out
   for free.
   =========================================================================== */

// One layer of a run of frame times: the empty list, or a time of at most
// 200 ticks, with `()` standing where the rest of the list will go. No
// recursion — that is the point of the slide, and the next section's `unfold`
// is what puts it back.
//
// The rules are the real ones in Palamedes (`s_pick`, `s_bind`, `s_pure` in
// Palamedes/CorrectGen.lean, `s_between` in Palamedes/Data/Nat.lean), and the
// goals are `CorrectGen` goals as the implementation states them. Three
// liberties, all for the sake of a derivation that fits a slide:
//
//   - `s_between` is stated for `lo ≤ v ∧ v ≤ hi`. The bound is written here
//     as `n ≤ 200000` alone; the real search needs `0 ≤ n ∧` in front of it,
//     or the spelling `n < 200001`.
//   - The real layer goal wraps each check in `guard … = some bg`.
//   - Each line is one rule. The real search applies every rule under
//     `convert`, through one Aesop rule (`normalize_and_apply`), and
//     introduces binders with `duncurry`.
//
// A pane holds about 37 columns, so the statement is broken by hand and
// `:= by` sits on its own line. One indent step is two columns.
const HEAD = [
  { text: 'example : CorrectGen fun tv =>' },
  { text: 'tv = .nil ∨', indent: 2 },
  { text: '∃ n, n ≤ 200000 ∧', indent: 2 },
  { text: 'tv = .cons n ()', indent: 3 },
  { text: ':= by', indent: 1 },
]

const CONS_GOAL = '⊢ CorrectGen fun tv =>\n    ∃ n, n ≤ 200000 ∧\n      tv = .cons n ()'

const frames = {
  steps: [
    {
      lines: HEAD,
      goals: [
        {
          id: 'root',
          text: '⊢ CorrectGen fun tv =>\n    tv = .nil ∨\n    ∃ n, n ≤ 200000 ∧\n      tv = .cons n ()',
        },
      ],
      term: '?g',
      note: 'One goal: a generator whose support is exactly one layer of a run of frames.',
    },
    {
      lines: [...HEAD, { text: 'apply s_pick', indent: 1 }],
      goals: [
        { id: 'nil', from: 'root', label: 'case x', text: '⊢ CorrectGen fun tv =>\n    [[tv = .nil]]' },
        { id: 'cons', from: 'root', label: 'case y', text: CONS_GOAL, state: 'dormant' },
      ],
      term: '[[pick]] ?x ?y',
      note: 'A disjunction is a choice: one generator per branch.',
    },
    {
      lines: [
        ...HEAD,
        { text: 'apply s_pick', indent: 1 },
        { text: '· [[apply s_pure]]', indent: 1 },
      ],
      goals: [
        { id: 'nil', label: 'case x', text: '⊢ CorrectGen fun tv =>\n    tv = .nil', state: 'closed' },
        { id: 'cons', label: 'case y', text: CONS_GOAL },
      ],
      term: 'pick [[(pure .nil)]] ?y',
      note: 'An equation is a constant generator.',
    },
    {
      lines: [
        ...HEAD,
        { text: 'apply s_pick', indent: 1 },
        { text: '· apply s_pure', indent: 1 },
        { text: '· [[apply s_bind]]', indent: 1 },
      ],
      goals: [
        { id: 'draw', from: 'cons', label: 'case x', text: '⊢ CorrectGen fun n =>\n    [[n ≤ 200000]]' },
        {
          id: 'rest',
          from: 'cons',
          label: 'case f',
          text: 'n : ℕ\n⊢ CorrectGen fun tv =>\n    [[tv = .cons n ()]]',
          state: 'dormant',
        },
      ],
      term: 'pick (pure .nil) [[(do\n  let n ← ?x\n  ?f n)]]',
      note: 'An existential is a bind: generate the witness, then the rest.',
    },
    {
      lines: [
        ...HEAD,
        { text: 'apply s_pick', indent: 1 },
        { text: '· apply s_pure', indent: 1 },
        { text: '· apply s_bind', indent: 1 },
        { text: '· [[apply s_between]]', indent: 2 },
      ],
      goals: [
        { id: 'draw', label: 'case x', text: '⊢ CorrectGen fun n =>\n    n ≤ 200000', state: 'closed' },
        {
          id: 'rest',
          label: 'case f',
          text: 'n : ℕ\n⊢ CorrectGen fun tv =>\n    tv = .cons n ()',
        },
      ],
      term: 'pick (pure .nil) (do\n  let n ← [[chooseNat 0 200000]]\n  ?f n)',
      note: 'A bound is a range to choose from.',
    },
    {
      lines: [
        ...HEAD,
        { text: 'apply s_pick', indent: 1 },
        { text: '· apply s_pure', indent: 1 },
        { text: '· apply s_bind', indent: 1 },
        { text: '· apply s_between', indent: 2 },
        { text: '· [[apply s_pure]]', indent: 2 },
      ],
      goals: [],
      done: 'No more goals.',
      term: 'pick (pure .nil) (do\n  let n ← chooseNat 0 200000\n  [[pure (.cons n ())]])',
      note: 'The proof is finished, and so is the program: that term is the layer generator.',
    },
  ],
}

// The same derivation as the stylized deck (`intro.html`) tells it. Two
// further liberties, both the deck's own: a goal is an existential, `∃ g,
// g.support = P`, where Palamedes has the subtype `CorrectGen P`, so that the
// term pane reads as the witness being filled in; and the layer's
// constructors are spelled `nilF` and `consF`, where Palamedes derives
// `ListF.nil` and `ListF.cons`. Everything else is `frames`, step for step.
const restate = (text) =>
  text
    .replaceAll('CorrectGen fun tv =>', '∃ g, g.support = fun l =>')
    .replaceAll('CorrectGen fun n =>', '∃ g, g.support = fun n =>')
    .replaceAll('tv = ', 'l = ')
    .replaceAll('.nil', '.nilF')
    .replaceAll('.cons ', '.consF ')

const layer = {
  steps: frames.steps.map((step) => ({
    ...step,
    lines: step.lines.map((line) => ({ ...line, text: restate(line.text) })),
    goals: step.goals.map((goal) => ({ ...goal, text: restate(goal.text) })),
    term: restate(step.term),
  })),
}

export const derivations = { frames, layer }
