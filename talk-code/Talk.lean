import Basalt

open RandomChoice

namespace Talk

#print Gen

def genDigits [Gen G] : G (List Nat) := do
  frequency! [
    (1, fun _ => pure []),
    (6, fun _ => do
      let d ← chooseNat 0 9
      let ds ← genDigits
      pure (d :: ds))
  ]
partial_fixpoint

#eval (genDigits : IO _)

example : IsCompleteFor genDigits (fun xs => ∀ x ∈ xs, 0 ≤ x ∧ x ≤ 9) := by
  rw [IsCompleteFor.iff_obs, genDigits]
  intro xs hxs
  induction xs with
  | nil => walk
  | cons x xs ih =>
    walk
    exists x
    constructor
    · solve_by_elim
    · exists xs
      grind only [genDigits.eq_def, SPMF.mem_support_iff_may, = List.mem_cons]


end Talk
