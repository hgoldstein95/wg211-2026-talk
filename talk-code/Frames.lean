import Basalt

/-!
# The slides' generators, checked

Everything the WG 2.11 slides claim about `genElapsed`, `genFrames` and `genCoin`.

`genElapsedGap` is `PropTest.genElapsed` from lean-mc (`proptest/PropTest/Gen.lean`), copied as
written. The spec there, `Spec.ElapsedOK`, has the hole between 451 and 899 written into it. Here
the spec is the one the slides use, `n ≤ 200000`, and the hole shows up as a completeness proof
that does not go through.

Check with `lake env lean Frames.lean` from this directory, once Basalt is built. If Lean cannot
find `SplitMix.Gen.new`, add
`--load-dynlib=.lake/packages/splitmix/.lake/build/lib/libsplitmix_SplitMixFFI.dylib`.
Last checked against Basalt 08f06f1, through lean-mc's `proptest` package.
-/

open RandomChoice

namespace Frames

variable {G : Type → Type} [Gen G]

/-- Close `1 ≤ w / w`, which a termination proof leaves for a generator with no recursion. -/
macro "mass_arith" : tactic =>
  `(tactic| first
    | (simp; done)
    | (norm_num; done)
    | (norm_num; exact (ENNReal.div_self (by norm_num) (by norm_num)).ge))

/-- Any frame time up to 200 ticks. A tick is 1000. -/
def ElapsedOK (n : Nat) : Prop := n ≤ 200000

/-! ## The generator as lean-mc has it -/

def genElapsedGap : G Nat :=
  frequency! [
    (2, fun _ => pure 0),
    (5, fun _ => chooseNat 1 450),
    (3, fun _ => chooseNat 900 1100),
    (1, fun _ => pure 1000),
    (2, fun _ => chooseNat 1001 16999),
    (1, fun _ => chooseNat 14000 200000)
  ] (by simp)

theorem genElapsedGap.sound : IsSoundFor (genElapsedGap : SPMF Nat) ElapsedOK := by
  rw [IsSoundFor.iff_obs]
  walk fixpoint
  all_goals first
    | (simp_all [ElapsedOK]; done)
    | (simp_all [ElapsedOK]; omega)

/--
error: omega could not prove the goal:
a possible counterexample may satisfy the constraints
  451 ≤ a ≤ 899
where
 a := ↑n
---
trace: G : Type → Type
inst✝ : Gen G
n : ℕ
hn : n ≤ 200000
⊢ 0 = n ∨ 1 ≤ n ∧ n ≤ 450 ∨ 900 ≤ n ∧ n ≤ 1100 ∨ 1000 = n ∨ 1001 ≤ n ∧ n ≤ 16999 ∨ 14000 ≤ n ∧ n ≤ 200000
-/
#guard_msgs in
example : IsCompleteFor (genElapsedGap : SPMF Nat) ElapsedOK := by
  intro n hn
  rw [genElapsedGap, SPMF.mem_support_iff_may]
  walk
  simp only [ElapsedOK] at hn
  trace_state
  omega

/-! ## The gap closed: 450 becomes 899 -/

def genElapsed : G Nat :=
  frequency! [
    (2, fun _ => pure 0),
    (5, fun _ => chooseNat 1 899),
    (3, fun _ => chooseNat 900 1100),
    (1, fun _ => pure 1000),
    (2, fun _ => chooseNat 1001 16999),
    (1, fun _ => chooseNat 14000 200000)
  ] (by simp)

theorem genElapsed.sound_complete : IsSoundAndComplete genElapsed ElapsedOK := by
  refine .intro ?sound ?complete
  case sound =>
    rw [IsSoundFor.iff_obs]
    walk fixpoint
    all_goals first
      | (simp_all [ElapsedOK]; done)
      | (simp_all [ElapsedOK]; omega)
  case complete =>
    intro n hn
    rw [genElapsed, SPMF.mem_support_iff_may]
    walk
    simp only [ElapsedOK] at hn
    omega

theorem genElapsed.terminates : IsAlmostSurelyTerminating genElapsed := by
  mass_fixpoint using SPMF.LfpIsOne.one
  mass_arith

theorem genElapsed.cost_bounded : IsCostBounded genElapsed fun _ => 2 := by
  rw [IsCostBounded.iff_obs]
  walk fixpoint
  all_goals omega

/-! ## The uniform generator the same spec allows (what Palamedes derives) -/

def genUniform : G Nat := chooseNat 0 200000

theorem genUniform.sound_complete : IsSoundAndComplete genUniform ElapsedOK := by
  refine .intro ?sound ?complete
  case sound =>
    rw [IsSoundFor.iff_obs]
    walk fixpoint
    all_goals first
      | (simp_all [ElapsedOK]; done)
      | (simp_all [ElapsedOK]; omega)
  case complete =>
    intro n hn
    rw [genUniform, SPMF.mem_support_iff_may]
    walk
    simp only [ElapsedOK] at hn
    omega

/-! ## Same support, different distributions -/

section distribution
open scoped ENNReal

/-- The hand-tuned generator returns a zero-length frame at least one time in seven. -/
theorem genElapsed.prob_zero : 1 / 7 ≤ SPMF.prob (genElapsed : SPMF Nat) {0} := by
  rw [genElapsed, frequencyWith_eq, SPMF.prob_frequency]
  have h0 : SPMF.prob (Pure.pure 0 : SPMF Nat) {0} = 1 := by
    rw [SPMF.prob_singleton]; simp
  simp only [List.map_cons, List.map_nil, List.sum_cons, List.sum_nil, h0]
  refine le_trans (le_of_eq ?_) (ENNReal.div_le_div_right le_self_add _)
  norm_num
  ennreal_to_real
  norm_num

/-- The uniform generator does so one time in 200,001. -/
theorem genUniform.prob_zero : SPMF.prob (genUniform : SPMF Nat) {0} = 1 / 200001 := by
  have h := SPMF.expect_chooseNat_zero (N := 200001) (by norm_num) (({0} : Set Nat).indicator 1)
  unfold genUniform SPMF.prob
  refine Eq.trans h ?_
  simp [Set.indicator]

end distribution

/-! ## Runs of frames -/

def FramesOK (ns : List Nat) : Prop := ∀ n ∈ ns, ElapsedOK n

def genFrames : G (List Nat) :=
  oneOf! [
    fun _ => pure [],
    fun _ => do
      let n ← genElapsed
      let ns ← genFrames
      return n :: ns
  ]
partial_fixpoint

theorem genFrames.sound_complete : IsSoundAndComplete genFrames FramesOK := by
  refine .intro ?sound ?complete
  case sound =>
    rw [IsSoundFor.iff_obs]
    walk fixpoint [genElapsed.sound_complete.sound.obs]
    all_goals simp_all [FramesOK]
  case complete =>
    intro ns
    induction ns with
    | nil => intro _; rw [genFrames, SPMF.mem_support_iff_may]; walk
    | cons n ns ih =>
      intro h
      rw [genFrames, SPMF.mem_support_iff_may]
      walk [genElapsed.sound_complete.complete.obs]
      exact ⟨n, h n (by simp), ns, ih fun m hm => h m (by simp [hm]), rfl⟩

theorem genFrames.terminates : IsAlmostSurelyTerminating genFrames := by
  mass_fixpoint [genElapsed.terminates.obs] using SPMF.LfpIsOne.affine (m := 1 / 2) (by norm_num)
  simp [ENNReal.div_eq_inv_mul, mul_add]

/-- At most three random choices per frame, and one to stop. -/
theorem genFrames.cost_bounded : IsCostBounded genFrames fun ns => 3 * ns.length + 1 := by
  rw [IsCostBounded.iff_obs]
  walk fixpoint [genElapsed.cost_bounded.obs]
  all_goals simp only [List.length_nil, List.length_cons] at *; omega

open scoped ENNReal in
/-- A run is at most one frame long on average. -/
theorem genFrames.expect_length :
    SPMF.expect (genFrames : SPMF (List Nat)) (fun ns => (ns.length : ℝ≥0∞)) ≤ 1 := by
  rw [SPMF.expect_eq_obs]
  walk fixpoint
  norm_num
  ennreal_to_real
  norm_num

#eval (genFrames : IO (List Nat))

end Frames

/-! ## A generator that may not answer -/

namespace Coin

/-- Never answers. `[Gen G]` is written out here and on `genCoin`: nothing in this body asks for
the instance, so a `variable` would leave it off. -/
def spin [Gen G] : G Bool := spin
partial_fixpoint

/-- A coin that lands one way, lands the other, or never lands. -/
def genCoin [Gen G] : G Bool :=
  oneOf! [
    fun _ => pure true,
    fun _ => pure false,
    fun _ => spin
  ]

theorem spin.mass : (spin : SPMF Bool).mass = 0 := by
  have h : SPMF.expect (spin : SPMF Bool) (fun _ => 1) ≤ 0 :=
    spin.fixpoint_induct (G := SPMF) (fun p => SPMF.expect p (fun _ => 1) ≤ 0)
      (SPMF.admissible_expect_le _ _) fun _ ih => ih
  rwa [SPMF.expect_one, nonpos_iff_eq_zero] at h

theorem spin.apply (b : Bool) : (spin : SPMF Bool) b = 0 := by
  have h := spin.mass
  simp only [SPMF.mass, ENNReal.tsum_eq_zero] at h
  exact h b

theorem genCoin.prob_true : SPMF.prob (genCoin : SPMF Bool) {true} = 1 / 3 := by
  rw [genCoin, oneOfWith_eq, SPMF.prob_oneOf]
  simp [SPMF.prob_singleton, spin.apply]

theorem genCoin.prob_false : SPMF.prob (genCoin : SPMF Bool) {false} = 1 / 3 := by
  rw [genCoin, oneOfWith_eq, SPMF.prob_oneOf]
  simp [SPMF.prob_singleton, spin.apply]

/-- A third of the mass is lost: the branch that never answers. -/
theorem genCoin.mass : (genCoin : SPMF Bool).mass = 2 / 3 := by
  rw [genCoin, oneOfWith_eq, SPMF.mass_oneOf]
  simp [SPMF.mass_pure, spin.mass]
  norm_num

theorem genCoin.not_terminates : ¬ IsAlmostSurelyTerminating (genCoin : SPMF Bool) := by
  unfold IsAlmostSurelyTerminating
  rw [genCoin.mass, ENNReal.div_eq_one_iff (by norm_num) (by norm_num)]
  norm_num

end Coin
