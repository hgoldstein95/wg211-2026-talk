// A Lean 4 grammar for highlight.js.
//
// highlight.js ships no `lean` language, so a ```lean fence used to fall
// through to auto-detection — which guessed at something Haskell-ish and got
// `def`, `List`, `Nat` and friends wrong. This is deliberately small: comments,
// strings, numbers, the keywords Lean actually uses, and "an identifier that
// starts with a capital is a type or a constructor", which is the convention
// every listing in this deck follows.
//
// It is cut to the same shape as src/ocaml-hljs.js, so that the two languages
// in the deck are painted by one scheme rather than two:
//
//   * **Connectives are operators, delimiters are punctuation.** `∃ ∀ → ↔ ∈ ≤ =`
//     carry the argument, so they take the keyword colour; `( ) , ; := | ::`
//     are scaffolding and drop to the light grey. A slide that is nothing but
//     a logical statement is where getting that split wrong shows: it either
//     greys out the statement or leaves the whole listing shouting.
//   * **A type ascription is a type.** ` : ` opens a run that is coloured like
//     one — which is what an inductive's constructor signatures are. Inside
//     that run the connectives are part of the type and inherit its colour;
//     so does the colon that opened it.
//   * **The deriver is meta.** `derive_generator` and `generator_search` are
//     the metaprogramming the section is about, and they take the same colour
//     as OCaml's `[@@deriving …]` for that reason.
//
// Registered in src/main.js, before Reveal.initialize.

export default function lean(hljs) {
  const KEYWORDS = {
    $pattern: /[A-Za-z_][A-Za-z0-9_'!?]*/,
    keyword: [
      'abbrev', 'at', 'attribute', 'axiom', 'by', 'calc', 'case', 'class',
      'def', 'deriving', 'do', 'else', 'end', 'example', 'extends', 'for',
      'from', 'fun', 'have', 'if', 'import', 'in', 'inductive', 'instance',
      'lemma', 'let', 'macro', 'match', 'mutual', 'namespace', 'noncomputable',
      'notation', 'open', 'partial', 'private', 'protected', 'rec', 'return',
      'section', 'set_option', 'show', 'structure', 'suffices', 'syntax',
      'then', 'theorem', 'universe', 'unsafe', 'variable', 'where', 'with',
      'partial_fixpoint',
    ].join(' '),
    literal: 'true false',
    built_in: [
      'Array', 'Bool', 'Char', 'Decidable', 'Except', 'Float', 'Gen', 'IO',
      'Int', 'List', 'Nat', 'Option', 'Prod', 'Prop', 'Sort', 'String', 'Sum',
      'Type', 'Unit',
    ].join(' '),
    // Metaprogramming a talk points at by name: a macro, a tactic, a deriver.
    // Not keywords, but not ordinary identifiers either — they get the colour
    // OCaml's ppx attributes take, so the two languages name the idea alike.
    // Add the ones a given talk leans on here.
    meta: 'derive_generator generator_search generator_search? aesop',
  }

  // `#check`, `#eval`, `#visualize`: commands, so they read as keywords.
  const COMMAND = { className: 'keyword', begin: /#[a-z]+\b/, relevance: 0 }

  // `@[tunable]` — an attribute is metaprogramming, like `[@@deriving …]`.
  const ATTRIBUTE = { className: 'meta', begin: /@\[/, end: /\]/, relevance: 0 }

  const COMMENT_LINE = hljs.COMMENT('--', '$')
  const COMMENT_BLOCK = hljs.COMMENT('/-', '-/', { contains: ['self'] })

  const NUMBER = { className: 'number', begin: /\b\d+(\.\d+)?\b/, relevance: 0 }

  // The empty list, as in `| [] => true`. Grouped with the numbers.
  const NIL = { className: 'literal', begin: /\[\]/, relevance: 0 }

  // Capitalised identifiers are types and constructors: `Sorted`, `Leaf`,
  // `CorrectGen`. Dotted names (`CorrectGen.pick`) come along for free, and so
  // do the blackboard types — `ℝ≥0∞` whole, or its `≥` and `0` go to the
  // operator and the number.
  const CONSTRUCTOR = { className: 'type', begin: /ℝ≥0∞|[ℕℤℚℝ]|\b[A-Z][A-Za-z0-9_'.]*/, relevance: 0 }

  // An anonymous constructor, `.leaf` or `.red`. Not a projection: `t.root`
  // and `(g i).mass` have a name or a bracket right before the dot.
  const DOT_CONSTRUCTOR = { className: 'type', begin: /(?<![\w'.)\]}₀-₉])\.[a-z][A-Za-z0-9_']*/, relevance: 0 }

  // Binders, arrows and relations — the part of a proposition that carries
  // meaning. Multi-character forms first, or `=>` loses its `=`. Unlike the
  // OCaml grammar, `=` *is* an operator here: Lean binds with `:=`, so a bare
  // `=` is the equality in `sortedGt lo xs = true` and means something.
  const OPERATOR = {
    className: 'operator',
    begin: /==>|<->|<\$>|<\|>|->|=>|<-|\|\||&&|\+|-|\*|\/|=|<|>|[∀∃λΣΠ→←↔↑↓∧∨¬≠≤≥≈∈∉⊆∪∩∅×∘∑∏⟶↦⊑⋅]/,
    relevance: 0,
  }

  // Delimiters and the sign that introduces a definition. `::` is Lean's cons
  // and reads as an operator, but it sits with the delimiters here so that
  // `x :: xs` doesn't outweigh the `≤` on the line above it.
  const PUNCTUATION = { className: 'punctuation', begin: /::|:=|\/\/|[()[\]{}⟨⟩⦃⦄,;:|]/, relevance: 0 }

  // No type-expression operator mode, as in src/ocaml-hljs.js: inside a
  // signature the arrows and relations are the type, and inherit its colour.
  const TYPE_PUNCTUATION = { className: 'punctuation', begin: /::|[([{⟨,;:|]/, relevance: 0 }

  // ` : ` opens a type. In `inductive Sorted … | cons : lo ≤ x → Sorted x l`
  // that run is a constructor's signature — a proposition — and colouring it
  // as a type is what makes an inductive read as a table of signatures. The
  // space is what keeps `:=` and `::` out; the closers end the run so a
  // `(List Nat)` inside one doesn't run to the end of the line.
  const ASCRIPTION = {
    className: 'type',
    begin: /(?<!:):(?=\s)/,
    // `//` too: in `{μ : α → ℝ≥0∞ // …}` the type stops at the subtype bar;
    // and `then`, so `if h : lo > hi then` doesn't run on to the line's end.
    end: /(?=[)}\]⟩]|:=|\/\/|\bthen\b|$)/,
    keywords: KEYWORDS,
    contains: [COMMENT_LINE, COMMENT_BLOCK, NIL, CONSTRUCTOR, DOT_CONSTRUCTOR, NUMBER, TYPE_PUNCTUATION],
    relevance: 0,
  }

  return {
    name: 'Lean',
    aliases: ['lean4'],
    keywords: KEYWORDS,
    contains: [
      COMMENT_LINE,
      COMMENT_BLOCK,
      hljs.QUOTE_STRING_MODE,
      COMMAND,
      ATTRIBUTE,
      NIL,
      NUMBER,
      ASCRIPTION,
      CONSTRUCTOR,
      DOT_CONSTRUCTOR,
      OPERATOR,
      PUNCTUATION,
    ],
  }
}
