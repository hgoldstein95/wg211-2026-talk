<!-- talk.md — Getting Generators Right (IFIP WG 2.11).

     This deck's layout grammar, in short (AUTHORING.md has the whole of it):

       - A content slide has NO heading. It holds one centred thing — a
         sentence, a listing, a diagram — and that thing is the slide.
       - `<p class="label">` is the only furniture: a short bold centred line
         above the content, naming the beat. Used sparingly.
       - Headings appear on exactly two slide kinds: `.title` and `.section`.
       - Emphasis is italic; bold marks the operative clause.
       - Code is 28pt by default; `.code-lg` (32pt) for one-to-five-line
         snippets, `.code-sm` (24pt) for long listings.

     Motion: a global cross-fade carries most of the deck, but the rule is
     only that motion answers a key press — nothing animates unprompted once a
     slide has settled.

     Code goes one way or the other, never half of each: two slides showing
     the *same* listing carry `data-auto-animate` and a shared `data-id`, so
     the listing holds still and only what changed about it moves. Two slides
     showing *different* listings just cross-fade.

     A comparison goes on ONE slide, even if the code has to be set small
     for it: test and proof, fold and unfold, unfueled and fueled. The point
     is the comparison, not reading every line. Two listings side by side
     are a `div.pair`, with the second arriving on a press.

     What moves here: the proof that opens under the test in the opening
     theorem; the model-against-code diagram, which builds and
     then greys out around the generator; the derivation widget in Part 1,
     one fragment per tactic; and the recap, which travels onto the closing
     slide.

     The running examples are two generators from a real test suite, for a
     game written in Lean: `genElapsed`, how long one frame took, and
     `genFrames`, a run of frames. Where a listing is tidied, reconstructed
     or not checked against Lean, the slide's speaker notes say so. What is
     checked lives in ../talk-code/Frames.lean.

     Don't add a `data-transition` to a slide; base.css overrides them. -->

<!-- .slide: class="title" -->

# Getting <br> Generators Right

<div class="title-foot">
  <img class="wordmark" src="/ub-wordmark.svg" alt="University at Buffalo">
  <div class="byline">
    <strong>Harry Goldstein</strong>
    hgoldste@buffalo.edu
  </div>
</div>

<p class="venue">IFIP WG 2.11</p>

---

<!-- .slide: class="diagram" -->

<svg class="pbt-diagram" viewBox="0 0 1280 720" role="img"
     aria-label="A data generator feeds a property, which contains the function
                 under test; the property either passes or fails.">
  <defs>
    <!-- refX is 0, not 4: the head hangs off the end of its line rather than
         sitting on it, so the stroke stops at the head's base instead of
         running on to a point that tapers away from under it. Each line is
         drawn 24 short of where its point lands (the head's own length, 4
         marker units at stroke-width 6). -->
    <marker id="pbt-arrow" viewBox="0 0 4 3" refX="0" refY="1.5"
            markerWidth="4" markerHeight="3" markerUnits="strokeWidth"
            orient="auto"><path d="M0,0 L4,1.5 L0,3 Z" fill="#2e3440"/></marker>
  </defs>
  <rect x="640" y="172.4" width="330.4" height="235.1" fill="#8fbcbb"/>
  <image href="/icons/contract.svg" x="663.7" y="198.9" width="96" height="96"/>
  <rect x="789.8" y="228.9" width="156.2" height="156.9" fill="#b38ead"/>
  <image href="/icons/gears.svg" x="819.9" y="264.1" width="96" height="96"/>
  <g fill="none" stroke="#2e3440" stroke-width="6" marker-end="url(#pbt-arrow)">
    <path d="M371.6,309.4 H588.9"/>
    <path d="M805.3,422.4 V474.8 H629.3 V503.3"/>
    <path d="M805.3,422.4 V474.8 H981.3 V503.3"/>
  </g>
  <path d="M959.5,228.9 q17.9,0 17.9,17.9 V289.4 q0,17.9 17.9,17.9 q-17.9,0 -17.9,17.9 V368.7 q0,17.9 -17.9,17.9"
        fill="none" stroke="#2e3440" stroke-width="2"/>
  <image href="/icons/check.svg" x="581.3" y="523.2" width="96" height="96"/>
  <image href="/icons/cross.svg" x="933.3" y="523.2" width="96" height="96"/>
  <image href="/icons/check.svg" x="522.7" y="541.8" width="96" height="96"/>
  <image href="/icons/check.svg" x="640" y="541.8" width="96" height="96"/>
  <g font-size="24" text-anchor="middle" fill="#2e3440">
    <text x="805.2" y="155.4">Property</text>
    <text x="1055.5" y="284.9">Function</text>
    <text x="1055.5" y="313.7">Under</text>
    <text x="1055.5" y="342.5">Test</text>
    <text x="264.1" y="422.4">Data Generator</text>
  </g>
  <rect x="188.6" y="228.9" width="156.2" height="156.9" fill="#a3be8c"/>
  <image href="/icons/factory.svg" x="216.1" y="260" width="96" height="96"/>
</svg>

Note:
- The tight five on PBT starts here: generate inputs, run the function, check the property

---

<!-- One specification, tested and then proved, on one slide: the proof opens
     under the test on a press. -->

<div class="stack">

```lean
theorem debt_lt (s : Session) (f : Frame) :
    (s.frame f).debt < unitsPerTick := by
  plausible
```
<!-- .element: class="recedes" -->

```lean
theorem debt_lt (s : Session) (f : Frame) :
    (s.frame f).debt < unitsPerTick := by
  simp only [frame, debtAfter, unitsPerTick]
  split <;> omega
```
<!-- .element: class="opens fragment" -->

</div>

Note:
- A property is a theorem statement; `plausible` tests it
- From a game written in Lean: play one frame, and less than one tick of time is still owed
- [click] Connects SE to FM: the same specification, and only the script under it changes
- The statement and its proof are real (lean-mc, `LeanMc/Proofs/Session.lean`). The `plausible` line is illustrative: the game's tests use their own harness

---

<!-- Verification-guided development, drawn in the PBT diagram's vocabulary.
     Three presses: the model and the code alone; the generator arrives with
     everything it feeds; then all but the generator greys out (`.pbt-focus`,
     as in base.css). -->

<!-- .slide: class="diagram" -->

<svg class="pbt-diagram" viewBox="0 0 1280 720" role="img"
     aria-label="Verification-guided development: a data generator feeds the
                 same inputs to a verified model and to production code, and
                 their answers are compared.">
  <defs>
    <!-- A marker in another slide's SVG stops rendering once that slide is
         hidden, so this diagram carries its own copy. -->
    <marker id="vgd-arrow" viewBox="0 0 4 3" refX="0" refY="1.5"
            markerWidth="4" markerHeight="3" markerUnits="strokeWidth"
            orient="auto"><path d="M0,0 L4,1.5 L0,3 Z" fill="#2e3440"/></marker>
  </defs>
  <g class="pbt-rest">
  <rect x="614" y="120" width="156.2" height="156.9" fill="#8fbcbb"/>
  <image href="/icons/contract.svg" x="644.1" y="150.5" width="96" height="96"/>
  <rect x="614" y="443" width="156.2" height="156.9" fill="#b38ead"/>
  <image href="/icons/gears.svg" x="644.1" y="473.5" width="96" height="96"/>
  <g font-size="24" text-anchor="middle" fill="#2e3440">
    <text x="692.1" y="103">Verified Model</text>
    <text x="692.1" y="636.5">Production Code</text>
  </g>
  </g>
  <g class="fragment">
  <g class="pbt-rest">
  <g fill="none" stroke="#2e3440" stroke-width="6" marker-end="url(#vgd-arrow)">
    <path d="M385,360 H482 V198.5 H563"/>
    <path d="M385,360 H482 V521.5 H563"/>
    <path d="M797,198.5 H1030 V261"/>
    <path d="M797,521.5 H1030 V459"/>
  </g>
  <image href="/icons/check.svg" x="982" y="312" width="96" height="96"/>
  </g>
  <rect x="202" y="281.5" width="156.2" height="156.9" fill="#a3be8c"/>
  <image href="/icons/factory.svg" x="232.1" y="312" width="96" height="96"/>
  <text x="280.1" y="475" font-size="24" text-anchor="middle" fill="#2e3440">Data Generator</text>
  </g>
  <g class="fragment pbt-focus"/>
</svg>

Note:
- Enables VGD (verification-guided development): prove things about a model, then test the code against the model
- [click] PBT is the glue: one generator feeds both, and the answers have to agree
- [click] Focus in on generators: everything else here is only as good as the inputs
- Cedar is the example to name: Disselkoen et al., "How We Built Cedar: A Verification-Guided Approach", FSE 2024

---

<p class="label">Takeaway 1</p>

PBT **connects software engineering to formal methods**, and it makes verification-guided development possible.

It is only as good as its **generators**.

---

```lean
/-- How long a frame took. A tick is 1000. -/
def genElapsed : G Nat :=
  frequency! [
    (2, pure 0),
    (5, chooseNat 1 450),
    (3, chooseNat 900 1100),
    (1, pure 1000),
    (2, chooseNat 1001 16999),
    (1, chooseNat 14000 200000)]
```

Note:
- The running example, from the same game's test suite: how long one frame took
- Six weighted cases. Most of the weight is on frames that run no tick, or that straddle a tick boundary
- Generators are hard to get right, in two ways
- As in lean-mc (`proptest/PropTest/Gen.lean`), less the `fun _ =>` thunks and the side condition

---

<!-- .slide: class="paper" -->

<div class="paper-shot">
  <img src="/papers/pbt-in-practice.png"
       alt="Property-Based Testing in Practice. Harrison Goldstein, Joseph W.
            Cutler, Daniel Dickstein, Benjamin C. Pierce, Andrew Head. ICSE 2024.">
</div>

<div class="cite">
  Goldstein, Cutler, Dickstein, Pierce, Head.
  <em>Property-Based Testing in Practice.</em> ICSE 2024.
</div>

Note:
- First: generators are annoying to write
- That one is 1 of 42 in its file: 332 lines of generators, for one game

---

"Developers see writing generators as a distraction, preferring to use derived
generators."

<div class="cite">Property-Based Testing in Practice, ICSE 2024 (Observation 5)</div>

---

```lean [|5-6]
/-- How long a frame took. A tick is 1000. -/
def genElapsed : G Nat :=
  frequency! [
    (2, pure 0),
    (5, chooseNat 1 450),
    (3, chooseNat 900 1100),
    (1, pure 1000),
    (2, chooseNat 1001 16999),
    (1, chooseNat 14000 200000)]
```

Note:
- Second: generators are error-prone, and need validation of their own
- [click] Look at where one range ends and the next begins

---

<!-- The two ranges, and what falls between them. -->

<!-- .slide: class="code-lg" -->

<div class="stack">

```lean
chooseNat 1 450
chooseNat 900 1100
```
<!-- .element: class="recedes" -->

```text
451 ≤ n ≤ 899 never comes out
```
<!-- .element: class="opens fragment" -->

</div>

Note:
- [click] Nearly half of the frames shorter than one tick are never tested
- Running the generator does not show this: a sample says what came out, not what cannot
- Reading this as a bug is our call. The repo's own spec for the generator has the hole written into it (`Spec.ElapsedOK`: `n ≤ 450 ∨ 900 ≤ n ∧ n ≤ 200000`)

---

<p class="label">Takeaway 2</p>

Generators are **tedious to write** and **easy to get wrong**.

Running one will not show you what it **never produces**.

---

<ol class="sections">
  <li><div>Palamedes: Generators from Predicates</div></li>
  <li class="fragment"><div>Basalt: Generators with Proofs</div></li>
</ol>

Note:
- Annoying to write, so synthesize them
- [click] Error-prone, so prove things about them

---

<!-- .slide: class="section" data-section="1" -->

## Palamedes

Generators from predicates.

---

<!-- .slide: class="paper" -->

<div class="paper-shot">
  <img src="/papers/palamedes.png"
       alt="The Search for Constrained Random Generators. Harrison Goldstein,
            Hila Peleg, Cassia Torczon, Daniel Sainati, Leonidas Lampropoulos,
            Benjamin C. Pierce.">
</div>

<div class="cite">
  Goldstein, Peleg, Torczon, Sainati, Lampropoulos, Pierce.
  <em>The Search for Constrained Random Generators.</em> PLDI 2026.
</div>

---

<div class="stack">

```lean
def framesOK : List Nat → Bool
  | [] => true
  | n :: ns => n ≤ 200000 && framesOK ns
```
<!-- .element: class="recedes" -->

```lean
def genFrames [Gen G] : G (List Nat) := by
  generator_search (fun ns => framesOK ns)
```
<!-- .element: class="opens fragment" -->

</div>

Note:
- The game plays a run of frames, so the test wants a list of frame times, each at most 200 ticks
- The predicate is an ordinary Lean function
- [click] The generator is one tactic call
- This synthesizes today, with the bound spelled `n < 200001`; Palamedes has no rule for a bare `≤` yet. See notes/frames-palamedes.lean

---

<!-- .slide: class="code-lg" -->

```lean
def CorrectGen (P : α → Prop) :=
  {g : PGen α // g.support = P}
```

Note:
- What the tactic is searching for: a generator packaged with a proof that it produces exactly the values satisfying `P`
- Sound and complete by construction

---

```lean
def framesOK : List Nat → Bool
  | [] => true
  | n :: ns => n ≤ 200000 && framesOK ns
```
<!-- .element: class="mark-rec" -->

Note:
- The search works on logic, and logic has no recursion
- So set the recursive call aside, and ask what one layer of a list looks like

---

<div class="derivation" data-derivation="frames"></div>

Note:
- The derivation works only on the inside of the generator: one layer, with `()` where the rest of the list goes
- The rules read the logic off as a program: a disjunction is a choice, an equation is `pure`, an existential is a bind
- [click] `s_pick` splits the disjunction: one generator per branch
- [click] `s_pure` closes the empty list
- [click] `s_bind` turns the existential into a draw and a continuation
- [click] `s_between`: a bound is a range
- [click] `s_pure` again; no goals left, and the term is the layer generator
- The rules are real. Three liberties: `s_between` wants both bounds (`0 ≤ n ∧ n ≤ 200000`); the real layer goal wraps the check in `guard`; and the search applies every rule under `convert`

---

<!-- The two recursion schemes, side by side. Set small on purpose: the point
     is that one collapses a list and the other grows one, not the bodies. -->

<!-- .slide: class="code-xs" -->

<div class="pair">

```lean
def List.fold
    (z : β) (f : α → β → β) :
    List α → β
  | [] => z
  | x :: xs =>
    f x (fold z f xs)
```

```lean
def List.unfold [Gen G]
    (step : β → G (ListF α β))
    (b : β) : G (List α) := do
  match ← step b with
  | .nil => pure []
  | .cons x b' =>
    let xs ← unfold step b'
    pure (x :: xs)
partial_fixpoint
```
<!-- .element: class="fragment" -->

</div>

Note:
- Tie the knot. A fold collapses a list to a value, one layer at a time
- [click] Its dual, the unfold, grows a list from a seed, one layer at a time: the anamorphism
- The derivation produced exactly such a layer (`ListF`: a list with `β` where the tail goes)
- The recursion happens here, once, for every generator
- Both are generated by `derive_palamedes List`. `List.unfold` is simplified from `List.unfoldGo`, which also threads a depth for tuning

---

<!-- The predicate as a fold beside the generator as the matching unfold. -->

<!-- .slide: class="code-sm wide" -->

<div class="pair">

```lean
def framesOK ns :=
  List.fold true
    (fun n ok =>
      n ≤ 200000 && ok)
    ns
```

```lean
def genFrames :=
  List.unfold
    (fun () => oneOf [
      pure .nil,
      do
        let n ← chooseNat 0 200000
        pure (.cons n ())])
    ()
```
<!-- .element: class="fragment" -->

</div>

Note:
- `framesOK` is a fold, and Palamedes finds this form by itself, from the universal property of fold
- [click] The generator is the matching unfold: its step is the layer generator from the derivation
- If one step undoes one layer of the fold, the unfold undoes the whole fold
- Cleaned up from what `generator_search` prints: there the step is a `frequency` with weights 1 and 1, and the seed is a pair of units

---

<p class="label">Takeaway 3</p>

Palamedes builds generators that are **sound and complete by construction**.

Recursion comes for free: a predicate that is a **fold** has a generator that is an **unfold**.

---

```text
genFrames — 2000 draws

  outcomes     ok 100.0%
  most common  49.2%  []
  size         mean 2.0  p50 2  p95 5  max 9
```

Note:
- Sound and complete is not the same as good
- Half the runs are empty, and a frame of exactly zero or exactly one tick almost never comes up
- One `#genstats` run of the synthesized generator (seed 0, fuel 10000), not pinned in the Palamedes tests. Size counts constructors: an empty list is 1

---

<!-- .slide: class="section" data-section="2" -->

## Basalt

Generators with proofs.

---

```lean
def QC.Gen α := Seed → α

def QC.support (g : QC.Gen α) : Set α :=
  {x | ∃ s, g s = x}
```

Note:
- The existing foundation: QuickChick (Paraskevopoulou et al., "Foundational Property-Based Testing", ITP 2015)
- A generator is a function from seeds, and its meaning is the set of values it can produce
- Palamedes started from this semantics too

---

<!-- What you want to write beside what a total language makes you write. -->

<!-- .slide: class="code-sm wide" -->

<p class="label">Expressiveness</p>

<div class="pair">

```lean
def genFrames :=
  oneOf [
    return [],
    do
      let n ← genElapsed
      let ns ← genFrames
      return n :: ns
  ]
```
<!-- .element: class="mark-rec" -->

```lean
def genFrames fuel :=
  match fuel with
  | 0 => return []
  | fuel + 1 =>
    oneOf [
      return [],
      do
        let n ← genElapsed
        let ns ← genFrames fuel
        return n :: ns
    ]
```
<!-- .element: class="mark-fuel fragment" -->

</div>

Note:
- Where previous formalisms fall short, first: the generator on the left is not a definition
- Generators are ordinary total functions there, and nothing decreases here
- [click] The workaround is fuel, and the fuel ends up in every specification: the support is now the lists of length at most `fuel`
- That is what happened in the game's own tests: the run generators are `listOfMaxLength n`, and their proved spec says `length ≤ n`
- Both listings are written for the slide; not from QuickChick

---

```lean [|1|8]
def genFrames [Gen G] : G (List Nat) :=
  oneOf! [
    fun _ => pure [],
    fun _ => do
      let n ← genElapsed
      let ns ← genFrames
      return n :: ns]
partial_fixpoint
```

Note:
- Fixes expressivity: the generator as you would write it in QuickCheck, with no fuel
- [click] It is polymorphic in its interpretation: `Gen` is a monad with random choice
- [click] and its recursion is a least fixed point
- Checked, as written (talk-code/Frames.lean)

---

<!-- .slide: class="code-lg" -->

```lean [1-2|1-4]
#eval (genFrames : IO (List Nat))
-- ==> [1094]

#check (genFrames : SPMF (List Nat))
```

Note:
- One interpretation runs
- [click] Another is a distribution: the same term at a different type
- The code you prove things about is the code you run
- The output is one real draw

---

<!-- .slide: class="code-lg" -->

```lean
def SPMF (α : Type) : Type :=
  {μ : α → ℝ≥0∞ // (∑' a, μ a) ≤ 1}
```
<!-- .element: class="annotate-spmf" -->

Note:
- What that distribution is
- [click] A mass for every value
- [click] that may sum to less than one: the missing mass is divergence

---

<!-- .slide: class="code-sm" -->

```lean [|3|4|5]
example : IsCompleteFor genElapsed (· ≤ 200000) := by
  intro n hn
  rw [genElapsed, SPMF.mem_support_iff_may]
  walk
  omega
```

Note:
- Program logics: each kind of theorem is one reading of a random choice. Soundness reads it as "every outcome", completeness as "some outcome", termination as an average
- Here: can the generator from the start of the talk produce every frame time up to 200 ticks?
- [click] Restate the law in its logic
- [click] `walk` walks the generator's syntax: verification-condition generation
- [click] What is left is arithmetic
- Checked (talk-code/Frames.lean, `genElapsedGap`), less one `simp only` that unfolds the spec's name

---

<!-- What `walk` leaves, and what `omega` says about it. -->

<!-- .slide: class="code-sm" -->

<div class="stack">

```lean
n : ℕ
hn : n ≤ 200000
⊢ 0 = n ∨ 1 ≤ n ∧ n ≤ 450
  ∨ 900 ≤ n ∧ n ≤ 1100 ∨ 1000 = n
  ∨ 1001 ≤ n ∧ n ≤ 16999
  ∨ 14000 ≤ n ∧ n ≤ 200000
```
<!-- .element: class="recedes" -->

```text
omega could not prove the goal:
a possible counterexample may satisfy the constraints
  451 ≤ a ≤ 899
```
<!-- .element: class="opens fragment" -->

</div>

Note:
- The goal `walk` leaves: no generator in sight, one disjunct per case
- [click] And the proof does not go through. The hole from the start of the talk, found by the proof
- Both are Lean's real output, pinned in talk-code/Frames.lean; the goal is re-wrapped to fit

---

```lean [5]
/-- How long a frame took. A tick is 1000. -/
def genElapsed : G Nat :=
  frequency! [
    (2, pure 0),
    (5, chooseNat 1 899),
    (3, chooseNat 900 1100),
    (1, pure 1000),
    (2, chooseNat 1001 16999),
    (1, chooseNat 14000 200000)]
```

Note:
- The fix is one number, and now the same proof goes through
- `genElapsed.sound_complete`, checked; so are `genElapsed.terminates` and a cost bound of two random choices

---

<!-- The old semantics' answer above Basalt's, for two generators that meet
     the same spec. -->

<!-- .slide: class="code-sm" -->

<p class="label">Depth of Specification</p>

```lean [1-4|1-7]
def genUniform := chooseNat 0 200000

QC.support genUniform = {n | n ≤ 200000}
QC.support genElapsed = {n | n ≤ 200000}

SPMF.prob genUniform {0} = 1 / 200001
SPMF.prob genElapsed {0} ≥ 1 / 7
```

Note:
- Where previous formalisms fall short, second: `genUniform` is what Palamedes derived for one frame time
- A set of values cannot tell it from the hand-tuned generator
- [click] A distribution can: a zero-length frame is one draw in seven, or one in two hundred thousand
- Both probabilities are theorems (`genUniform.prob_zero`, `genElapsed.prob_zero`). The `QC.support` lines are how the old semantics would say what `sound_complete` says

---

<!-- .slide: class="code-sm" -->

```lean [1-2|4-5|7-8]
theorem genFrames.sound_complete :
    IsSoundAndComplete genFrames framesOK

theorem genFrames.terminates :
    IsAlmostSurelyTerminating genFrames

theorem genFrames.expect_length :
    SPMF.expect genFrames (·.length) ≤ 1
```

Note:
- The same for the recursive generator, with no fuel anywhere
- [click] It terminates with probability 1
- [click] and a run is at most one frame long on average: the statistic from before, as a theorem
- All three are checked. There the spec is the `Prop` `FramesOK`, and the length is cast to `ℝ≥0∞`

---

<!-- .slide: class="section" data-section="2" -->

## Demo

Basalt in Lean.

Note:
- talk-code/Talk.lean: `genDigits`, run in `IO`, and its completeness proof with `walk`
- talk-code/Frames.lean has every theorem from these slides, if someone asks to see one

---

<p class="label">Takeaway 4</p>

A Basalt generator is both **the code you run** and **the object you prove things about**.

The proofs say **what** it generates, **how often**, and **whether it stops**.

---

<!-- .slide: class="section" -->

## The Future

Of testing, and of software engineering.

---

<!-- The model-against-code diagram again, whole from the start. One press
     greys out the model and the code, and what is left is the glue. -->

<!-- .slide: class="diagram" -->

<svg class="pbt-diagram" viewBox="0 0 1280 720" role="img"
     aria-label="Verification-guided development: a data generator feeds the
                 same inputs to a verified model and to production code, and
                 their answers are compared.">
  <defs>
    <marker id="vgd-arrow-2" viewBox="0 0 4 3" refX="0" refY="1.5"
            markerWidth="4" markerHeight="3" markerUnits="strokeWidth"
            orient="auto"><path d="M0,0 L4,1.5 L0,3 Z" fill="#2e3440"/></marker>
  </defs>
  <g class="pbt-rest">
  <rect x="614" y="120" width="156.2" height="156.9" fill="#8fbcbb"/>
  <image href="/icons/contract.svg" x="644.1" y="150.5" width="96" height="96"/>
  <rect x="614" y="443" width="156.2" height="156.9" fill="#b38ead"/>
  <image href="/icons/gears.svg" x="644.1" y="473.5" width="96" height="96"/>
  <g font-size="24" text-anchor="middle" fill="#2e3440">
    <text x="692.1" y="103">Verified Model</text>
    <text x="692.1" y="636.5">Production Code</text>
  </g>
  </g>
  <g fill="none" stroke="#2e3440" stroke-width="6" marker-end="url(#vgd-arrow-2)">
    <path d="M385,360 H482 V198.5 H563"/>
    <path d="M385,360 H482 V521.5 H563"/>
    <path d="M797,198.5 H1030 V261"/>
    <path d="M797,521.5 H1030 V459"/>
  </g>
  <image href="/icons/check.svg" x="982" y="312" width="96" height="96"/>
  <rect x="202" y="281.5" width="156.2" height="156.9" fill="#a3be8c"/>
  <image href="/icons/factory.svg" x="232.1" y="312" width="96" height="96"/>
  <text x="280.1" y="475" font-size="24" text-anchor="middle" fill="#2e3440">Data Generator</text>
  <g class="fragment pbt-focus"/>
</svg>

Note:
- The future of PBT is the future of software engineering
- Everything will be verification-guided: a model you can prove things about, beside the code you ship
- [click] PBT will be the glue

---

<!-- Basalt as the representation in the middle. Three presses: what comes
     out of a Basalt generator, then the two things that will write one. -->

<!-- .slide: class="diagram" -->

<svg class="pbt-diagram" viewBox="0 0 1280 720" role="img"
     aria-label="A Basalt generator in the middle: synthesis and user
                 interfaces produce it, and it produces both tests and proofs.">
  <defs>
    <marker id="core-arrow" viewBox="0 0 4 3" refX="0" refY="1.5"
            markerWidth="4" markerHeight="3" markerUnits="strokeWidth"
            orient="auto"><path d="M0,0 L4,1.5 L0,3 Z" fill="#2e3440"/></marker>
  </defs>
  <rect x="561.9" y="281.5" width="156.2" height="156.9" fill="#a3be8c"/>
  <image href="/icons/factory.svg" x="592" y="312" width="96" height="96"/>
  <text x="640" y="475" font-size="24" text-anchor="middle" fill="#2e3440">Basalt Generator</text>
  <g class="fragment">
    <g fill="none" stroke="#2e3440" stroke-width="6" marker-end="url(#core-arrow)">
      <path d="M745,360 H842 V198.5 H900"/>
      <path d="M745,360 H842 V521.5 H900"/>
    </g>
    <g font-size="30" fill="#2e3440">
      <text x="945" y="208.5">Tests</text>
      <text x="945" y="531.5">Proofs</text>
    </g>
  </g>
  <g class="fragment">
    <path d="M356,198.5 H438 V360 H511" fill="none" stroke="#2e3440"
          stroke-width="6" marker-end="url(#core-arrow)"/>
    <text x="335" y="208.5" font-size="30" text-anchor="end" fill="#2e3440">Synthesis</text>
  </g>
  <g class="fragment">
    <path d="M356,521.5 H438 V360" fill="none" stroke="#2e3440" stroke-width="6"/>
    <text x="335" y="531.5" font-size="30" text-anchor="end" fill="#2e3440">Interfaces</text>
  </g>
</svg>

Note:
- Basalt will be the core representation
- [click] One term, read as a test and as a theorem
- [click] Palamedes writes it
- [click] and user interfaces on top will let us decide what the generators should be

---

<div class="plug">
  <img class="qr" src="/qr/fpbt.svg" alt="QR code for the FPBT 2027 web page">
  <div>
    <span class="what">FPBT ’27</span>
    <span class="line">The Future of Property-Based Testing</span>
    <span class="line">Mexico City · January 12 · with POPL</span>
    <a class="link" href="https://popl27.sigplan.org/home/fpbt-2027">popl27.sigplan.org/home/fpbt-2027</a>
  </div>
</div>

Note:
- The first Future of Property-Based Testing workshop, co-located with POPL ’27
- Submissions close October 23

---

<!-- .slide: data-auto-animate -->

<p class="label"><span class="w" data-id="r-title">Getting Generators Right</span></p>

<ol class="sections" data-id="r-list">
  <li><div>Palamedes: Generators from Predicates</div></li>
  <li><div>Basalt: Generators with Proofs</div></li>
</ol>

Note:
- Synthesize the generator, then prove what the synthesis does not

---

<!-- .slide: class="thanks" data-auto-animate -->

<p class="label"><span class="w" data-id="r-title">Getting Generators Right</span></p>

<ol class="sections" data-id="r-list">
  <li><div>Palamedes: Generators from Predicates</div></li>
  <li><div>Basalt: Generators with Proofs</div></li>
</ol>

<div class="thanks-panel">
  <ul class="links">
    <li>
      <img class="qr" src="/qr/site.svg" alt="QR code for harrisongoldste.in">
      <div><span class="what">Website</span><a class="link" href="https://harrisongoldste.in">harrisongoldste.in</a></div>
    </li>
    <li>
      <img class="qr" src="/qr/email.svg" alt="QR code for hgoldste@buffalo.edu">
      <div><span class="what">Email</span><a class="link" href="mailto:hgoldste@buffalo.edu">hgoldste@buffalo.edu</a></div>
    </li>
    <li>
      <img class="qr" src="/qr/slides.svg" alt="QR code for these slides">
      <div><span class="what">Slides</span><a class="link" href="https://harrisongoldste.in/wg211-talk/">harrisongoldste.in/wg211-talk/</a></div>
    </li>
  </ul>
</div>
