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
//   * **A type ascription is a type, as far as it goes.** ` : ` opens one, and
//     it ends where Lean ends it: at the bracket that was open before it, at
//     `:=`, at the comma that closes a binder. So `∃ g : G α, …` colors `G α`
//     and stops. Inside it an arrow is part of the type and `α` or `β` is a
//     type variable, and both take the type's color, as does the colon. A
//     name or a relation there is still what it is anywhere else, because the
//     type of a hypothesis is a proposition: `hn : n ≤ 200000` reads like the
//     goal under it.
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
      // The tactics of a proof script written out step by step. They are the
      // language's own, like `have` and `show`, and not the automation a
      // slide points at: that is `meta`, below.
      'apply', 'intros',
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
    // Add the ones a given talk leans on here. `oneOf!` and `frequency!` are
    // the macros; the plain `oneOf` and `frequency` are ordinary functions.
    meta: 'derive_generator generator_search generator_search? aesop oneOf! frequency!',
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

  // An anonymous constructor, `.leaf` or `.red`. Not a projection: `t.root`,
  // `(g i).mass` and `·.length` have a name, a bracket or the hole right
  // before the dot.
  const DOT_CONSTRUCTOR = { className: 'type', begin: /(?<![\w'.)\]}₀-₉·])\.[a-z][A-Za-z0-9_']*/, relevance: 0 }

  // `×` only ever builds a type, so it is one wherever it stands.
  const PRODUCT = { className: 'type', begin: /×/, relevance: 0 }

  // Binders, arrows and relations — the part of a proposition that carries
  // meaning. Multi-character forms first, or `=>` loses its `=`. Unlike the
  // OCaml grammar, `=` *is* an operator here: Lean binds with `:=`, so a bare
  // `=` is the equality in `sortedGt lo xs = true` and means something. A `/`
  // is one too, but not the pair of them that is the subtype bar.
  const OPERATOR = {
    className: 'operator',
    begin: /==>|<->|<\$>|<\|>|->|=>|<-|\|\||&&|\+|-|\*|\/(?!\/)|=|<|>|[∀∃λΣΠ→←↔↑↓∧∨¬≠≤≥≈∈∉⊆∪∩∅∘∑∏⟶↦⊑⋅]/,
    relevance: 0,
  }

  // Delimiters and the sign that introduces a definition. `::` is Lean's cons
  // and reads as an operator, but it sits with the delimiters here so that
  // `x :: xs` doesn't outweigh the `≤` on the line above it.
  const PUNCTUATION = { className: 'punctuation', begin: /::|:=|\/\/|[()[\]{}⟨⟩⦃⦄,;:|]/, relevance: 0 }

  const TERM = [
    COMMENT_LINE,
    COMMENT_BLOCK,
    hljs.QUOTE_STRING_MODE,
    COMMAND,
    ATTRIBUTE,
    NIL,
    NUMBER,
    CONSTRUCTOR,
    DOT_CONSTRUCTOR,
    PRODUCT,
  ]

  // What a type has that a term doesn't: its arrows, and its variables, which
  // by Lean's convention are `α` to `δ`. The rest of the alphabet is terms
  // here: `μ` is a mass function and `τ` a type the generator has to find.
  const TYPE_SYNTAX = { className: 'type', begin: /[→α-δ]/, relevance: 0 }

  // ` : ` opens a type, and the type ends where the thing it annotates does.
  // The space is what keeps `:=` and `::` out. `//` is the subtype bar in
  // `{μ : α → ℝ≥0∞ // …}`, `|` the bar of a set, and `then` keeps
  // `if h : lo > hi then` from running on. A type that is still open at the
  // end of its line ends there.
  const ASCRIPTION = {
    begin: /(?<!:):(?=\s)/,
    beginScope: 'type',
    end: /(?=[)}\]⟩⦄,|]|:=|=>|\/\/|\bthen\b|$)/,
    keywords: KEYWORDS,
    relevance: 0,
  }

  // Brackets inside a type. They are matched here, so that the closer that
  // ends the type is the one that was open before it: in
  // `(step : β → G (ListF α β))` that is the second `)`. A comma or a bar
  // inside them separates, and ends nothing.
  //
  // Neither this nor the quantifier below can say `endsWithParent`: the modes
  // of a type contain one another, and highlight.js copies such a mode once
  // for each parent, without end. So each one stops at the line's end itself.
  const TYPE_GROUP = {
    begin: /[([{⟨⦃]/,
    beginScope: 'punctuation',
    end: /[)\]}⟩⦄]|$/,
    endScope: 'punctuation',
    keywords: KEYWORDS,
    relevance: 0,
  }

  // A quantifier inside a type keeps the comma after its variables, so
  // `instCCPO : ∀ α, CCPO (G α)` is one type and not two.
  const TYPE_QUANTIFIER = {
    begin: /[∀∃λΣΠ]/,
    beginScope: 'operator',
    end: /,|(?=[)}\]⟩⦄]|:=|=>|$)/,
    endScope: 'punctuation',
    keywords: KEYWORDS,
    relevance: 0,
  }

  // The delimiters that can stand in a type without ending it.
  const TYPE_PUNCTUATION = { className: 'punctuation', begin: /::|;/, relevance: 0 }
  const TYPE = [...TERM, ASCRIPTION, TYPE_GROUP, TYPE_QUANTIFIER, TYPE_SYNTAX, OPERATOR, TYPE_PUNCTUATION]

  ASCRIPTION.contains = TYPE
  TYPE_QUANTIFIER.contains = TYPE
  TYPE_GROUP.contains = [...TYPE, { className: 'punctuation', begin: /[,|]/, relevance: 0 }]

  return {
    name: 'Lean',
    aliases: ['lean4'],
    keywords: KEYWORDS,
    contains: [...TERM, ASCRIPTION, OPERATOR, PUNCTUATION],
  }
}
