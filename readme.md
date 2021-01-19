# jsonlisp.js

  [LISP]:https://en.wikipedia.org/wiki/Lisp_(programming_language)
  [AST]:https://en.wikipedia.org/wiki/Abstract_syntax_tree

A silly little interpreter for an example language that tries to
illustrate the power and simplicity that prefix notation brings.

Strictly speaking, I don't mean just just prefix-notation, I also mean
a programming language that is represented in a simple data structure,
like an array. And arrays of arrays. This allows you to write
functions that take program as input (data structure) and outputs
another program (data structure) which then can be passed on to the
interpreter. These functions are often called macro functions.

All of this is taken from [LISP]. Wikipedia [explains the
concept](https://en.wikipedia.org/wiki/Lisp_(programming_language)#List_structure_of_program_code;_exploitation_by_macros_and_compilers)
well. Let's try to play with that a bit. Let's write our [AST]
directly as code!

Note that this implemtation is not a good [LISP]. If you want a good
[LISP], you could look into ones mentioned in the Wikipedia page on
[LISP].

# Running

```bash
$ node jsonlisp.js
```

This runs a few tests and stuff. There should ideally be a REPL here,
but I don't know how to read JSON objects in succession from stdin in
node.js.

# Ranting

## The language syntax is JSON

This means it's horribly to type up. Everybody would hate writing
programs like this:

```JSON
["define", "fahrenheit",
   ["fn", ["c"],
    ["->", "c",
     ["*", 9],
     ["/", 5],
     ["+", 32]]]]
```

But bear with me, JSON is only there to make a point clear: we are
going to express all our code as a data structure. No exceptions, not
even built-in operators, functions, imports, package statements or
regular expressions. It is an important point that doing
`JSON.parse(JSON.stringify(...))` on any piece of code snippet yields
identical results. In a real LISP, you wouldn't use JSON but something
with less ceremony, like
[S-expressions](https://en.wikipedia.org/wiki/S-expression) which
makes things less ugly. That would make the above snippet would look
more like this:

```scheme
(define (fahrenheit c)
  (-> c
      (* 9)
      (/ 5)
      (+ 32)))
```

Which has all the same properties of JSON except that reads easier
with less syntax. There are numerous advantages of code being a data
structure:

#### Code can be transformed programmatically

By their users, and not just the compiler authors. Typically called
macros.

#### Code can be serialized (`JSON.stringify()`)


That would often have a security issues. But we do it all the
time. Your SQL client will send SQL expressions to your DB server
across a network, for example.

#### A common ground for expressing everything

We like to express our data as JSON these days. That is good - we get
a common, not too complicated, ground that our systems can share.

But sometimes, code is data. Let me take an example. I came across
cytoscape.js for some graph visualization needs. It exposes an API
that is CSS-selector-like, but for it's canvas-rendered objects. You
can query for graph-elements like this: `'#id-without-space, node[id =
"id with spaces"], .interesting'`, for example. But this imposes _a
lot_ of work on the cytoscape team. They have to parse this string
into a structure - that is _a lot_ of work (for the cytoscape
team). The good news is that this is familiar to people who know CSS
selectors. But winning users like this may have costs.

What if you wanted to parameterize one of the `id`s, for example? Then
you'd have to do string concatenation: `'#id-without-space, node[id =
"'+vid+'"], .interesting'`. But that will break if `vid` contains a
`"`. So you have to escape it. Anything else you have to escape?
Probably - it's hard to get these things right.

Image if we, instead, had something like 

```JSON
["or", ["=", "id", "my-vertex"],
       ["=", "id", vid],
       ["=", "class", "interesting"]]
```

At this point, many frontend developers would probably vomit. But is
it really that bad? I think the semantics are rather clear, and there
are no regexes or string-escaping involved. There is very likely also
less code to get this working (in both CSS engines, and cytoscape).

## The interpreter is quite small

I wanted to illustrate what it's like to write an interpreter for a
language that is already in a data structure like this. The
interpreter here is about 60 lines of code.

I am cheating a bit here, of course. Since I'm leveraging JavaScript's
runtime engine, I get many things for free, like garbage collection
and its JSON data structure. But it's still a trivial piece of code
that gives you the ability to define a factorial function and then run
it.

There is a lot of work that we _don't_ have to do when we treat our
code as data: there is no need for a separate parser, there is no
grammar, no precedence rules, no
[keywords](https://en.wikipedia.org/w/index.php?title=Keyword_(computer_programming)&redirect=no)
(just macros), no operators (only functions), and no statements (only
expressions). Yet - not only can do what programming languages with
these constructs can do, we can do something they can't: provide
proper macro support.

