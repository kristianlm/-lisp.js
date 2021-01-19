# µlisp.js

  [LISP]:(https://en.wikipedia.org/wiki/Lisp_(programming_language))

A silly little interpreter for an example language that tries to
illustrate the power and simplicity that prefix notation brings.

Strictly speaking, I don't mean just just prefix-notation, I also mean
a programming language that is represented in a simple data structure,
like an array. And arrays of arrays. This allows you to write
functions that take program as input (data structure) and outputs
another program (data structure) which then can be passed on to the
interpreter. These functions are often called macro functions.

All of this is taken from
[LISP]. [Wikipedia](https://en.wikipedia.org/wiki/Lisp_(programming_language)#List_structure_of_program_code;_exploitation_by_macros_and_compilers)
explains the concept well. Let's try to play with it in practice. 

Note that this implemtation is not a good [LISP]. If you want a good
[LISP], you could look into ones mentioned in the Wikipedia page on
[LISP].

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
makes things less ugly. This feature is unique to LISPs, I'm quite
sure there are no exceptions. In a real LISP, the above snippet would
look somethings like this:

```scheme
(define (fahrenheit c)
  (-> c
      (* 9)
      (/ 5)
      (+ 32)))
```

Which has all the same properties of JSON, except that `symbol` is a
separate type used for identifiers, in addition to the traditional
quoted `string` type.

There are many advantages of code being a data structure:

1. Code can be transformed programmatically by users, and not just the compiler authors
2. Code can be serialized (`JSON.stringify()`)
3. A common ground for data and code means less complexity (like
   cytoscape.js has to re-implement CSS selectors for their
   canvas-based API).
4. Interacting with your code now becomes easier. Config files, for
   example, can re-use the same syntax as your code (and reference
   function names, for example, to the extent that you allow it).
   
### 2. When would you ever send code across network?

That would often have a security issues. But we do it all the
time. Your SQL client will send SQL expressions to your DB server
across a network, for example.

## The interpreter is quite small

It's about 60 lines of code, but I am cheating a bit here. Because I'm
leveraging JavaScript's runtime engine, I get many things for
free. Like garbage collection and its JSON data structure, for
example.

# Running

```bash
$ node µlisp.js
```

This runs a few tests and stuff. There should ideally be a REPL here,
but I don't know how to read JSON objects in succession from stdin in
node.js.
