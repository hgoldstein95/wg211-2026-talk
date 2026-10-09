## What's good about Basalt?

- The code you prove things about is the same code you run
- Multiple runnable interpretations (e.g., `Plausible.Gen`, `IO`, and `Enum`)
- Multiple proof interpretations (e.g., `SPMF` and `SPMF.Cost`)
- Raw generation speed is faster than both Haskell QuickCheck and OCaml Base_quickcheck on
  micro-benchmarks

- Prove soundness and completeness
  - Including soundness for all sizes, completeness in the limit
  - Probabilistic variants as well --- e.g., complete with all values having `prob g v > ε`
- Prove (positive) almost-sure termination
  - No need for fuel or other artificial termination infrastructure
- Prove distributional guarantees
  - Reaches a certain sub-distribution with sufficient probability
  - Very large values appear with bounded probability
  - Very small values appear with bounded probability
  - Values are bounded at a certain size and tuning
- Prove cost bounds
  - Can be used to rule out backtracking

- Prove properties of complicated MCMC generators?
  - E.g., mutation walks
- Prove second moments?
  - Could we use second moments to say something about how likely 10k samples are to have a
    particular property?

## What are we not sure about?

- Which of these kinds of proofs are the most compelling?
  - How much of a benefit is a guarantee of soundness over just validating soundness via testing?