import Palamedes.Synthesizer

/-!
# The slides' predicates, synthesized

Not part of any build here. Check it from a Palamedes checkout:

    lake env lean \
      --load-dynlib=.lake/packages/splitmix/.lake/build/lib/libsplitmix_SplitMixFFI.dylib \
      path/to/frames-palamedes.lean

The slides write the bound as `n ≤ 200000`. Palamedes has no rule for a bare `≤` yet
("No search rule matched this predicate"), so it is spelled `n < 200001` here.
`0 ≤ n ∧ n ≤ 200000` also works for a single number, but not inside the list predicate.

What comes out:

    genElapsed = chooseNat 0 (200001 - 1)

    genFrames =
      List.unfoldGo
        (fun d x => do
          let a ←
            frequency
              [(1, fun x => pure ListF.nil),
               (1, fun x => do
                 let a ← chooseNat 0 (200001 - 1)
                 pure (ListF.cons a PUnit.unit))]
          match a with
            | ListF.nil => pure ListF.nil
            | ListF.cons a1 a2 => pure (ListF.cons a1 (a2, PUnit.unit)))
        0 (PUnit.unit, PUnit.unit)

`#genstats (draws := 2000) (fuel := 10000) (genFrames)`, with `PalamedesTest.Schedule`
imported, gave (seed 0):

    outcomes    ok 2000 (100.0%)
    size        mean 2.0   p50 2   p95 5   max 9
    choices     mean 3.0   p50 3   p95 9   max 17
    most common  49.2%  (983)  []
-/

open Palamedes

namespace Frames

def genElapsed [Gen G] : G Nat := by
  generator_search (fun n => n < 200001)

#print genElapsed

@[simp]
def framesOK : List Nat → Bool
  | [] => true
  | n :: ns => n < 200001 && framesOK ns

def genFrames [Gen G] : G (List Nat) := by
  generator_search (fun ns => framesOK ns)

#print genFrames

end Frames

/-!
The stylized deck writes the predicate as a fold from the start. That synthesizes too, and to the
same generator: `generator_search` prints the `List.unfoldGo` term above for it.

The deck's own spelling is a pretence, and is not what is checked here: there `List.fold` takes one
function out of `ListF` (`fun | .nilF => true | .consF n ok => n ≤ 200000 && ok`), so that the
fold's cases line up with the layer predicate and with the unfold's branches. Palamedes's
`List.fold` takes the answer for nil and the function for cons separately, as below.
-/

namespace FramesFold

@[simp]
def framesOK (ns : List Nat) : Bool :=
  List.fold true (fun n ok => n < 200001 && ok) ns

def genFrames [Gen G] : G (List Nat) := by
  generator_search (fun ns => framesOK ns)

#print genFrames

end FramesFold
