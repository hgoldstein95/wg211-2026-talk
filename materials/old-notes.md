# Old speaker notes

The speaker notes from `slides/index.html` as they stood at commit 44bb286, on 2026-10-12. They
were cleared from the deck after that commit, to be rewritten from scratch.

There is one section per slide, in deck order. The numbers are the deck's at that commit. Each
heading also gives the slide's first words, or its first line of code, so the slide can be found
after the deck is renumbered.

## 1. New Foundations for PBT / Harry Goldstein University at Buffalo…

Hi everyone. Today I’m going to talk about some published and some ongoing work on what I’m calling new foundations for property-based testing.

## 2. What’s the point of testing anymore?

And I want to start with the existential question I’ve been asking myself lately: what the heck is the point of testing anymore?

## 3. Lean Port of Minecraft

The other day, I went to my friendly neighborhood robot and asked for an implementation of Minecraft, written in Lean,

## 4. State.step_entities_sound Entities collide properly with blocks…

with a bunch of proofs. [click] For example: clicks don’t get lost, entities can’t end up inside blocks, and block faces get drawn if and only if they’re supposed to be visible. These are the kinds of things I would previously have tested about an implementation of Minecraft.

## 5. This took me Claude / 2.5 hours

And this took me about two and a half hours. [click] I mean, it took Claude two and a half hours. This was not some huge effort, and it did not take a tremendous amount of expertise from me. It took some, but this was basically all done for me. So the question for me was: then why do we need testing? Can’t we just prove all of these things correct?

## 6. The core logic, in Lean, is proved. raylib, in C, is not. A…

But pulling back the curtain a little on what Claude built, I realized it hadn’t done exactly what I asked. Rather than implement the core rendering logic in Lean, which would have been hard to do efficiently because the game needs to talk to the GPU, it used a library, raylib, in C. In principle I’m not against this: it would not have been useful to go off and emit GPU code directly from Lean. So I was perfectly fine with it. But it left me wondering: how do I know that the proofs are correct relative to the semantics of raylib? [click] And this is where testing came in. I had Claude go back and build a model, in Lean, of what it thought raylib was going to do, and test that model against the real thing. [click] And then prove that the theorems it had shown were correct relative to that modeled semantics.

## 7. Four programs, each proved in a different proof language, with…

And I think this is where testing needs to stay. Even if we end up writing all of our code in proof systems like Lean, Rocq, F*, Verus, and so on, [click] we will ultimately need to test the relationships between the semantics of the component pieces of real software systems. The idea that all software will be written in one homogeneous language just doesn’t fit the way software engineering has developed over decades, and I don’t believe that’s going to change any time soon, for social reasons if not technical ones.

## 8. A generator makes random lists of commands. Each list is sent…

So let’s dig a little deeper into what these tests look like. We have our model, and we have raylib. [click] We’re going to generate a bunch of commands for both of them, sequences of commands, and ask: do they produce the same result? [click] And to produce all those sequences of commands, we need a program called a generator. That’s the PBT term for the random program that produces inputs to a system under test.

## 9. How do we make generators good? / And what should "good" even…

The question I’m going to answer with the rest of this talk is: how can we make sure those generators are as good as possible, so that we can believe the relationship we’re claiming between our model and our implementation? [click] And a side question is: what does “good” even mean? That’s something I’m going to ask all of you about, because I really do need feedback here. I’m writing a paper, and there are things in the evaluation, and in the demonstration of what we can do, that could use some punching up.

## 10. Two parts. Palamedes: synthesizing generators. Basalt…

I’m going to talk about two systems. The first is Palamedes, which was presented at PLDI this year. [click] The other is Basalt, a new foundational abstraction for PBT generators. It isn’t published yet, but we’re working on a paper for it as well.

## 11. Palamedes / Synthesizing Generators

So first, let’s talk about Palamedes.

## 12. `/-- Duration of one frame. -/`

Suppose we want to test this theorem, which says that our play function, on a bunch of frames, is correct. We’re going to get lists of frames of different durations, and as long as a list is a valid list of frames, playing those frames should be correct. [click] I want to focus in on this precondition. `framesOK` says what it means for a list of frames to be a valid list of frame durations. [click] So what we need is a generator: a program that’s going to produce valid lists of frames for us, so that we can check this theorem.

## 13. `def framesOK (fs : List Frame) : Bool :=`

So how are we going to get a generator for these frames? In our system, Palamedes, which we presented at PLDI, we showed a scheme for deductive synthesis that produces generators from a predicate. [click] So what we’re ultimately going to do is implement `genFrames` with this tactic, `generator_search`, which ensures that we produce a generator that is both sound and complete with respect to the predicate.

## 14. `∃ g : G α, g.support = P`

So what is the tactic proving? An existential. [click] There exists a generator, [click] and its support is exactly the predicate: it samples exactly the values that satisfy P, which is sound and complete. And the way to prove an existential is to instantiate it. The witness the search builds is the generator.

## 15. `inductive ListF (α β : Type)`

We’ve written `framesOK` in terms of a fold. [click] For now, I want to focus in on the core logic of the fold. [click] And really, what that says is that we want either a nil or a cons: one layer of a list, with a unit standing where the rest of the list goes.

## 16. `apply synth_pick`

Here is that predicate for one layer. The search reads its logic off as a program, one connective at a time. [click] So take it apart: an or, over its two sides. [click] `s_pick`: a disjunction is a choice. [click] `s_pure`: an equation is a constant. [click] `s_bind`: an existential is a draw, and the and is the semicolon: draw `n`, and then go on with it. [click] `s_between`: a bound is a range. [click] `s_pure` again, and every piece is program. [click] Put it back together, the semicolon as a line break: a generator for one layer. Nothing changed places but the or. Every rule comes with its proof, so the generator samples exactly the predicate. [click] Written down, those five steps are a tactic script. [click] And `aesop` is what finds it. The rules are real. The liberties: the search works on goals from the top down, not on loose pieces; `s_bind` takes the existential and its conjunction as one, and gives a bind, written here as a `do` block; `s_pick` gives `pick`, spelled `oneOf` here; `s_between` wants both bounds; the real layer goal wraps the check in `guard`; and the search applies every rule under `convert`.

## 17. `def framesOK (fs : List Frame) : Bool :=`

So that is a generator for one layer. Back in `framesOK`, what is left is the fold itself, which is where the recursion lives.

## 18. A fold turns a list into a boolean. An unfold turns the boolean…

Tie it together. A fold turns a value into a boolean: a list goes in, `true` comes out. [click] So run it backwards. An unfold turns the boolean back into a value: start from `true`, and out comes a list the fold accepts. Which one is not determined, and that is exactly a generator. The search built one layer of this: if one step of the unfold undoes one layer of the fold, the unfold undoes the whole fold. A fudge on the slide: the real unfold starts from a seed, here a unit, not from `true`.

## 19. `theorem fold_unfold_inverse`

That last sentence, as a theorem. `alg` is what the fold does with one layer; `step` is what the unfold does with one seed. [click] Suppose that, for every `b`, the step samples exactly the layers that `alg` sends to `b`: one layer, undone. [click] Then the unfold from `b` samples exactly the lists that fold to `b`: the whole fold, undone. The premise is what the search just discharged, piece by piece. This rule is what turns it into a generator for lists, and the recursion is proved once, here, for every predicate that is a fold. This is the paper’s S-List-Unfold′ in the deck’s spelling, not checked in Lean in this form; the rule the search applies, `List.s_unfold`, is more general. Read literally for `framesOK`, the seed is `true` at every step, as in the picture; the generator on the next slide has a unit there.

## 20. `def framesOK (fs : List Frame) : Bool :=`

The predicate as a fold. [click] And the generator as the matching unfold: its step is the layer generator we assembled, and `List.unfold` does the recursion, once, for every generator (it is a `partial_fixpoint`, generated by `derive_palamedes List`). Cleaned up from what `generator_search` prints: there the step is a `frequency` with weights 1 and 1, and the seed is a pair of units.

**ENGAGEMENT POINT.** Stop here and open the floor; this room knows recursion schemes better than I do. Possible prompts: Which predicates you write are not plain folds, and what should their generators be? Accumulating parameters, paramorphisms, mutual recursion? Is “a fold has an unfold” the right place to cut, or is there a better pair?

## 21. `/-- Red-black trees. -/`

Lists of frames are the small example. The same tactic handles much bigger predicates. Here are red-black trees: no red node has a red child, the keys are in order, and every path has the same number of black nodes. Those are three recursive functions, and the search finds one generator that satisfies all three at once. It does filter a little, which is the `Option` in its type. [click] And here are well-typed terms of the simply typed lambda calculus. `getType` is an ordinary type checker. We hand Palamedes the type checker, and it gives back a generator for well-typed terms. The corpus also has binary search trees, AVL trees, sorted lists, and well-scoped terms.

## 22. Palamedes lets us synthesize generators from predicates…

What to take from Palamedes. It turns the predicate you already have into a generator. The generator is sound and complete by construction: it is found together with its proof. And recursion comes for free: a predicate that is a fold has a generator that is an unfold.

## 23. Basalt / Foundations for Generators

So now I’m going to introduce Basalt, which is a new foundational framework for property-based testing generators. Let me start with why we need one.

## 24. Not every generator can be synthesized. / We still want agents…

First: not all generators are going to be synthesizable by Palamedes. Some predicates are outside what it handles, and some generators need tuning that no predicate asks for. So agents are going to keep writing generators by hand, like the 43 in the game. [click] And we still want to be able to keep those agents on the rails.

## 25. `/-- How long a frame took. A tick is 1000. -/`

Here is one that an agent wrote. This is one of the 43 generators in the game, written by Claude by hand: it makes the time that one frame took. Palamedes would not give you this. From the predicate, a frame time of at most 200 ticks, it synthesizes a uniform choice. This one has six weighted cases, with most of the weight on frames that run no tick or that straddle a tick boundary. That tuning is a judgment that no predicate asks for. So we want generators like this one. But is it right? Hold that thought: there is a bug in it, and we will come back and find it with a proof. Do not point at the gap. As in lean-mc (`proptest/PropTest/Gen.lean`), less the `fun _ =>` thunks and the side condition.

## 26. ~50% / of lists genFrames outputs are empty.

Furthermore, stopping at just the support is not good enough. Even Palamedes produces badly distributed generators. The generator I showed you, `genFrames`: about 50% of the things it generates are empty. And this is a shame. One `#genstats` run of the synthesized generator (2000 draws, seed 0, fuel 10000), not pinned in the Palamedes tests.

## 27. `def genMostlyEmpty : G (List Frame) :=`

And what Palamedes proved cannot see the problem. Here is a generator with a crazy distribution: it gives the empty list 999,999 times in a million, and only otherwise runs `genFrames`. [click] And its support is exactly the support of `genFrames`: the theorem Palamedes proved holds of both. So the supports of two generators that are totally different can be the same. The support cannot tell these two apart, so it cannot say that one of them is a much worse generator than the other. `frequency` is a weighted choice. Written for the slide; not checked in Lean.

## 28. Prove things about generators, down to the distribution. / Run…

Basalt fixes all of this. It allows users to prove complex things about generators, down to the distribution, [click] and to run them efficiently. Those are the two parts of the rest of the talk, in that order. Along the way, it also lets you write complex generators ergonomically, and I will point that out when we get there.

## 29. What is a generator, formally?

To prove anything about a generator, we have to say what a generator is. This project started with a question: what is the formal semantics of a generator?

## 30. `def QC.Gen α := Seed → α`

And there was an answer to this, in QuickChick, which was the first and main place where people could write proofs about generators. There, a generator is represented as a function from a seed to a value, and the generator’s meaning is defined by its support: the values `x` such that there exists a seed `s` where `g s` produces `x`. So in our `genFrames` example, the support is the set of lists of frames where those frames are OK. This is a perfectly sensible definition. But there’s a downside to this representation, and you have already seen it: this set is the same for the generator that is almost always empty. The last line is how that semantics would put it; it is not from QuickChick.

## 31. `def SPMF (α : Type) : Type :=`

So we want a representation of generator distributions that can capture these rich distributional properties, not just the support. For this, we’re using subprobability mass functions. It has this type in Lean. Conceptually, you can think of it as [click] a function from values to real numbers, [click] and a promise that the total of the distribution sums to no more than one. Why no more than one, and not exactly one? Because a generator may not give an answer at all. Here is one that may not.

## 32. `def spin : G Bool := spin`

`spin` calls itself and does nothing else, so it never answers. And `genCoin` chooses evenly between three things: `true`, `false`, and `spin`. [click] So what is its distribution? A third of the mass is on `true` and a third is on `false`. [click] And the last third is not on any value. That is the probability that the generator gives no answer at all. This is what “at most one” is for: we interpret whatever mass is missing as the probability of not terminating. `partial_fixpoint` is what lets `spin` call itself; it comes back later. All three numbers are theorems (talk-code/Frames.lean: `genCoin.prob_true`, `genCoin.prob_false`, `genCoin.mass`). There both definitions say `[Gen G]`.

## 33. `def genFrames : G (List Nat) :=`

Now the generator we care about. This is `genFrames`, written by hand: choose evenly between stopping and adding one more frame. It calls itself, as `spin` did, and nothing gets smaller, so it could go on forever. [click] Its distribution, by the length of the list: half the mass is on the empty list, which is the 50% from before, a quarter is on one frame, an eighth on two, and so on. [click] Those add up to one, so nothing is left over: the probability of no answer is zero. That is a theorem coming up. So that is what a generator means. Now, what does that meaning let us prove? The listing is as in talk-code/Frames.lean. The bars follow from the generator choosing evenly between two branches; they are not themselves a theorem there.

## 34. `theorem genFrames.sound_complete :`

Now the proofs. For `genFrames`: it makes exactly the valid lists, which is all the set semantics could say. [click] It terminates with probability 1: the empty slot in the picture. [click] And a run is at most one frame long on average: the kind of fact that “half are empty” was pointing at, as a theorem. All three are checked. There the spec is the `Prop` `FramesOK`, and the length is cast to ℝ≥0∞. From here to the end of this part, every slide is something a proof buys.

## 35. `/-- How long a frame took. A tick is 1000. -/`

Back to Claude’s generator from the start of the section. I said it has a bug in it. Six weighted cases, most of the weight on frames that run no tick or that straddle a tick boundary. Is it right? Does it produce every frame time up to 200 ticks? Running it will not say: a sample shows what came out, not what cannot. Do not point at the gap; the proof finds it on the next slides. As in lean-mc (`proptest/PropTest/Gen.lean`), less the `fun _ =>` thunks and the side condition.

## 36. `example : IsCompleteFor genElapsed (· ≤ 200000) := by`

So ask it as a theorem: can `genElapsed` produce every frame time up to 200 ticks? [click] Restate the law in its logic. [click] `walk` walks the generator’s syntax: verification-condition generation. [click] What is left is arithmetic. Checked (talk-code/Frames.lean, `genElapsedGap`), less one `simp only` that unfolds the spec’s name.

## 37. `n : ℕ`

The goal `walk` leaves: no generator in sight, one disjunct per case. [click] And the proof does not go through. Nearly half of the frames shorter than one tick are never tested, and the proof found it; sampling never would. Both are Lean’s real output, pinned in talk-code/Frames.lean; the goal is re-wrapped to fit.

## 38. `/-- How long a frame took. A tick is 1000. -/`

The fix is one number, and now the same proof goes through. `genElapsed.sound_complete`, checked; so are `genElapsed.terminates` and a cost bound of two random choices.

## 39. `def genUniform := chooseNat 0 200000`

Proofs can also say more than a set can. `genUniform` is what Palamedes derived for one frame time, and a set of values cannot tell it from the hand-tuned generator. [click] A distribution can: a zero-length frame is one draw in seven, or one in two hundred thousand. Both probabilities are theorems (`genUniform.prob_zero`, `genElapsed.prob_zero`). The `QC.support` lines are how the old semantics would say what `sound_complete` says.

## 40. IsSoundAndComplete What it generates…

What the proofs buy, in one place: what a generator makes, that it stops, how often a value comes up, how big its values are, and how much randomness it uses. Each is a theorem about `genFrames` or `genElapsed` in talk-code/Frames.lean.

[click] **ENGAGEMENT POINT.** Before we go on, we should make sure we know what we want. Ask the room: what else would you want proved about a generator? Backups from my notes: Which of these are the most compelling? How much is a proof of soundness worth over validating it by testing? MCMC generators such as mutation walks? Second moments: how likely are ten thousand samples to have a given property?

## 41. Prove things about generators, down to the distribution. / Run…

Signpost, part two. That is what the proofs buy. But wait: we still have to run these generators. And if an SPMF is our definition of a generator, we can’t, because an SPMF in Lean is not computable. So the other promise was running them, and running them efficiently.

## 42. `-- genFrames : ∀ {G : Type → Type}, [Gen G] → G (List Nat)`

So what we’re actually going to do is represent generators this way. This is `genFrames` again, the listing that sat beside its distribution, written the way you would write it in QuickCheck. [click] We’re going to have generators be a type class: this `Gen` thing is a type class. [click] And then we’re going to define generators as universally quantified over that type class. This is the full type of `genFrames`: it quantifies over the `G`, then over the `Gen G`, and then gives a `G (List Nat)`. We’ll come back to the `partial_fixpoint` in a moment. `genElapsed` is Claude’s generator, the one we just fixed: this is where a frame time comes from. Checked, as written (talk-code/Frames.lean); the type in the comment was not run through `#check`.

## 43. `class Gen (G : Type → Type) where`

OK, so this is what the type class actually looks like. Some parts of this are not going to be surprising to you. [click] Certainly, a generator should be a monad, and it should have random choice. This is straight from QuickCheck, right? In QuickCheck, a generator is a monad with some ability to make choices. [click] The other thing we need is for our generators to be a chain-complete partial order. This is what allows us to handle non-terminating generators elegantly. As in `Basalt/Gen.lean`, less an `Inhabited` field and the `MonoBind` field, a monotone bind, which `partial_fixpoint` also needs.

## 44. `def genFrames [Gen G] : G (List Nat) :=`

An aside on ergonomics, because this is what that partial order buys: you write the generator the way you would anyway. Its recursion is a least fixed point, so nothing has to decrease. [click] Where generators are ordinary total functions, this is what you write instead. And the fuel ends up in every specification: the support becomes the lists of length at most `fuel`. None of the theorems you saw mentions fuel. That is what happened in the game’s own tests: the run generators are `listOfMaxLength n`, and their proved spec says `length ≤ n`. The fuel listing is written for the slide; not from QuickChick.

## 45. One generator term, interpreted at several types: IO runs it…

The payoff of the type class: the same term at different types. [click] At `IO` it runs. [click] At `SPMF` it is the distribution from the picture, which is what every proof you just saw is about. The code you prove things about is the code you run. [click] `SPMF.Cost` also counts random choices, and `FuzzGen` reads its choices from a byte buffer, so a coverage-guided fuzzer drives generation. Also: `Plausible.Gen`, and a statistics interpretation behind `#genstats`.

[click] **ENGAGEMENT POINT.** Stop on the open slot. Possible prompts: What other interpretations would you want? Enumeration, shrinking, symbolic execution? Is `Gen` the right interface: one operation plus a CCPO? What would you add, and what would it cost the proofs?

## 46. `frequency! [(2, a), (5, b), (3, c)]`

So they run. Running them also has to be fast. Some of you have been wondering about the bang. A choice between branches is a list of closures, built and walked on every draw. [click] So `frequency!` is a macro, and it elaborates to three things: the plain `frequency`, which is what every proof sees; the code that runs, one draw and a chain of tests, with the running totals 2, 7 and 10 added up while the macro runs; and a proof that the two are equal, which the kernel checks. `frequencyWith` just returns the second. `oneOf!` is the same with equality tests. This is what `#print` shows for the definition, with notation off, less the `fun _ =>` thunks around each branch (`Basalt/Combinators.lean`).

## 47. Generation speed with the macros, relative to the plain…

And it matters. Four benchmarks: search trees, heaps, sorted lists, and a bare natural number. With the plain combinators, Basalt is slower than QuickCheck on every one. With the macros it is 1.8 to 3 times faster than itself, and ahead of QuickCheck on every one, by 1.2 to 1.7 times. Base_quickcheck is behind QuickCheck throughout, so it is not drawn. And every proof still sees the plain combinator. Numbers: geometric mean of 20 rounds on an Apple M5 Max, values per second of CPU time; the first three generate a value, serialize it to JSON and write it, and the last only generates (basalt-raw-speed, results/2026-09-26-ablation). The other ablation there, SplitMix against Lean’s own random numbers, is worth about as much again.

## 48. A generator is a distribution. / Proofs find what sampling…

What to take from Basalt, and the close. A generator means a distribution, so “how often” is something you can say. The proofs say what it generates, how often, and whether it stops: one of them found a hole that no amount of sampling would have. And one term is both the object you prove things about and the code you run, with no fuel, and fast.
