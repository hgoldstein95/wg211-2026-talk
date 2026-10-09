// An OCaml grammar for highlight.js, replacing the one it ships.
//
// highlight.js's own `ocaml` is close, but it leaves three things this deck
// leans on untagged, and a slide listing is read from twelve feet away:
//
//   * **Punctuation and operators.** Upstream emits no token for `( ) , = |`
//     or for `-> * @ ::` — they come out as bare text, which means body
//     colour, which means the densest, darkest thing on the slide is the
//     scaffolding. Here they are `punctuation` and `operator`, and base.css
//     drops the first to a light grey and paints the second like a keyword.
//   * **Lowercase type names.** Upstream knows `int` and `list` and nothing
//     else, so `let rec g : tree generator` used to read as three variables
//     while `type t = int list` on the next slide read as a type. There is no
//     lexical difference to go on, so the three positions a type actually
//     appears in are modes: after `type`, after `of`, and after a spaced `:`.
//   * **ppx.** `[@@deriving quickcheck]` came out as plain body text, and
//     `let*` as `let` plus a multiplication sign. The attribute is `meta` now
//     — the same colour Lean's own metaprogramming takes, so the two languages
//     name the same idea with one colour — and `let*` is one keyword.
//
// Registered in src/main.js, before Reveal.initialize. The keyword lists are
// upstream's minus the camlp4-era `parser`/`value`/`or`, which are not OCaml
// any more and would light up an ordinary identifier.

export default function ocaml(hljs) {
  const KEYWORDS = {
    $pattern: /[a-z_]\w*!?/,
    keyword: [
      'and', 'as', 'assert', 'begin', 'class', 'constraint', 'do', 'done',
      'downto', 'else', 'end', 'exception', 'external', 'for', 'fun',
      'function', 'functor', 'if', 'in', 'include', 'inherit', 'initializer',
      'land', 'lazy', 'let', 'lor', 'lsl', 'lsr', 'lxor', 'match', 'method',
      'mod', 'module', 'mutable', 'new', 'nonrec', 'object', 'of', 'open',
      'private', 'rec', 'sig', 'struct', 'then', 'to', 'try', 'type', 'val',
      'virtual', 'when', 'while', 'with',
    ].join(' '),
    built_in: [
      'array', 'bool', 'bytes', 'char', 'exn|5', 'float', 'int', 'int32',
      'int64', 'lazy_t|5', 'list', 'nativeint|5', 'option', 'ref', 'result',
      'string', 'unit',
    ].join(' '),
    literal: 'true false',
  }

  // `[]` and `[||]`. Grouped with the numbers rather than with the keywords in
  // base.css: they are values, and the `[]` a generator threads through its
  // choice list is something a slide points at. `()` is deliberately *not*
  // here — it is a value too, but every appearance in this deck is a thunk's
  // argument or a throwaway binding, and four constant-coloured `()`s on the
  // closure-allocation slide pull the eye away from what it is about.
  const EMPTY = { className: 'literal', begin: /\[(\|\|)?\]/, relevance: 0 }

  const COMMENT = hljs.COMMENT(/\(\*/, /\*\)/, { contains: ['self'] })

  // `[@@deriving quickcheck]`, `[@warning "-8"]`, `[%expr …]` — the ppx
  // attribute and extension brackets, all three arities of `@`.
  const ATTRIBUTE = {
    className: 'meta',
    begin: /\[@{1,3}|\[%{1,2}/,
    end: /\]/,
    relevance: 10,
  }

  // The extension point in `match%bind`, `let%map`. Has to come before
  // OPERATOR or the `%` goes one way and the name another.
  const EXTENSION = { className: 'meta', begin: /%[a-z_]\w*/, relevance: 5 }

  // The binding operators `let*` and `and*`. The `$pattern` above can't reach
  // the star, so without this the keyword stops at `let` and the `*` is
  // painted as multiplication one character later.
  const LET_STAR = { className: 'keyword', begin: /\b(let|and)\*/, relevance: 0 }

  // A type variable, `'a`. `symbol` is painted with the types in base.css.
  // Before the char-literal mode, as upstream, or `'a` opens a string.
  const TYPE_VAR = { className: 'symbol', begin: /'[A-Za-z_](?!')[\w']*/ }

  // An identifier that may end in primes — `cs'`, `xs'`. Untagged, but it has
  // to be consumed as one piece so the trailing `'` doesn't open a char.
  const PRIMED = { begin: /[a-z_]\w*'[\w']*/, relevance: 0 }

  const POLY_VARIANT = { className: 'type', begin: /`[A-Z][\w']*/ }

  // Constructors and module names. `Gen.union` matches `Gen` only, so the
  // `.` and the value after it stay punctuation and body colour.
  const CONSTRUCTOR = { className: 'type', begin: /\b[A-Z][\w']*/, relevance: 0 }

  // The leading `-` is part of the literal when it is jammed against the
  // digits and nothing word-like precedes it, so the `-3` in a shrunk tree
  // comes out as one purple number rather than an operator and a number. A
  // spaced `n - 1` still parses as subtraction: the `-` is followed by a
  // space, so the alternation fails there and OPERATOR takes it.
  const NUMBER = {
    className: 'number',
    begin: /(?<![\w)\]])-?(0[xX][a-fA-F0-9_]+[Lln]?|0[oO][0-7_]+[Lln]?|0[bB][01_]+[Lln]?|[0-9][0-9_]*([Lln]|(\.[0-9_]*)?([eE][-+]?[0-9_]+)?)?)/,
    relevance: 0,
  }

  // `->` first in the alternation, or `-` claims its own hyphen. `::` before
  // the `:` in PUNCTUATION, for the same reason. `=` is deliberately *not*
  // here: it binds far more often than it compares in this deck (`let bind g
  // f =` against one `if n = 0`), and a blue definition sign on every other
  // line is exactly the noise this scheme is trying to get rid of.
  const OPERATOR = {
    className: 'operator',
    begin: /->|<-|\|>|@@?|::|:=|\+\+?\.?|-\.?|\*\.?|\/\.?|<[=>]?|>=?|&&|\|\||\^|!=/,
    relevance: 0,
  }

  // Everything left that isn't a name: brackets, separators, `=`, the `.` of
  // a qualified name, the `~`/`?` of a labelled argument. Light grey.
  const PUNCTUATION = { className: 'punctuation', begin: /[()[\]{};,.:|~?=]/, relevance: 0 }

  // Inside a type expression the closers are terminators, not content, so a
  // punctuation mode that could eat one would run the type on to the end of
  // the line; this one carries the openers and the separators only.
  //
  // There is no type-expression operator mode on purpose. `->` and `*` in
  // `seed -> 'a * seed` are the type — they inherit the teal and the whole
  // expression reads as one phrase — while the `->` of `fun s ->` a few
  // characters later stays a keyword-blue operator. That is the difference
  // between the two arrows, and it is worth more than colouring both alike.
  const TYPE_PUNCTUATION = { className: 'punctuation', begin: /[([{;,.:|~?]/, relevance: 0 }

  // The type expression modes below all end at a line break, and all set the
  // keywords again so that `of`, `sig` and the primitive types keep their own
  // colour inside one. What they change is the default: a bare lowercase
  // identifier in here is a type name, not a variable.
  const typeExpression = (extra) => ({
    className: 'type',
    end: /(?=$)/,
    keywords: KEYWORDS,
    contains: [COMMENT, ATTRIBUTE, TYPE_VAR, POLY_VARIANT, CONSTRUCTOR, TYPE_PUNCTUATION],
    relevance: 0,
    ...extra,
  })

  // `type 'a gen = seed -> 'a * seed` — the name *and* the right-hand side are
  // types, so this one runs to the end of the line and `=` is punctuation
  // inside it like any other separator.
  const TYPE_DECL = typeExpression({
    begin: /\btype\b/,
    contains: [COMMENT, ATTRIBUTE, TYPE_VAR, POLY_VARIANT, CONSTRUCTOR, PUNCTUATION],
  })

  // The payload of a variant: `| Cons of int * int_list`.
  const OF_PAYLOAD = typeExpression({ begin: /\bof\b/ })

  // An ascription: `g : tree generator`, `(xs : int_list)`, `val f : …`.
  // The space after the colon is what separates it from a labelled argument
  // (`~f:(fun …)`) and from `::`; both would otherwise swallow a whole
  // expression as if it were a type. It stops before the `=` of the binding
  // it annotates, and before the bracket that closes it — which is why its
  // punctuation mode carries the openers only. The colon itself is inside the
  // span rather than punctuation beside it: it is what introduces the type,
  // and `x : int` reading as one teal unit is the point.
  const ASCRIPTION = typeExpression({
    begin: /(?<!:):(?=\s)/,
    end: /(?=[=)}\]]|$)/,
  })

  return {
    name: 'OCaml',
    aliases: ['ml'],
    keywords: KEYWORDS,
    illegal: /\/\/|>>/,
    contains: [
      EMPTY,
      COMMENT,
      ATTRIBUTE,
      EXTENSION,
      LET_STAR,
      TYPE_DECL,
      OF_PAYLOAD,
      ASCRIPTION,
      TYPE_VAR,
      POLY_VARIANT,
      CONSTRUCTOR,
      PRIMED,
      hljs.inherit(hljs.APOS_STRING_MODE, { className: 'string', relevance: 0 }),
      hljs.inherit(hljs.QUOTE_STRING_MODE, { illegal: null }),
      NUMBER,
      OPERATOR,
      PUNCTUATION,
    ],
  }
}
