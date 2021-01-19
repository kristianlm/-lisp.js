// a very small LISP-like interpreter written in JS. leveraging JS
// syntax (JSON).
//
// objectives:
// - very few lines of code
// - all code plain JSON for illustration (no embedded functions)
// - feature-complete enough to have some practical use
// - implementation clarity
//
// non-objectives:
// - fast

// first up:
// which data-type do these entries have:
//              ,-- string        ,-- number
//             /                 /   ,-- number
// console.log("100 + 100 = ", 100+100);
//    `-----`-- but what about these guys?
//
// in programming languages that let you express code as
// data-structures, these must have a data-type too. often called
// "symbol". Some versions of JS/EcmaScript introduced them (new
// Symbol('log')), but I'm not sure how useful they are when you can't
// express your code as data-structure.

var jsonlisp = {};
jsonlisp.envTop = {
    '+':           (...args)=>args.reduce((a,b)=>a+b),
    '-':           (...args)=>args.reduce((a,b)=>a-b),
    '*':           (...args)=>args.reduce((a,b)=>a*b),
    '/':           (...args)=>args.reduce((a,b)=>a/b),
    '=':           (...args)=>args.reduce((a,b)=>a===b), // comparison
    '>':           (a,b)=>a>b,
    '<':           (a,b)=>a<b,
    '>=':          (a,b)=>a>=b,
    '<=':          (a,b)=>a<=b,
    'not':         (a)=>a===false?true:false,
    'print':       (...args)=>console.log.apply(null, args),
    'array':       (...args)=>args,// typically this is called `list` instead of `array`
    'append':      (...args)=>[].concat(...args),
    'slice':       (a,i)=>a.slice(i),
    'get':         (collection, key)=>collection[''+key], // new String('key') => 'key'
};

jsonlisp.menvTop = {
    // define-syntax will put things here
};

// shallow expand of x: see if x should be replaced by its macro output.
jsonlisp.expand1 = function expand1(x, env, menv) {
    env = env || jsonlisp.envTop;
    menv = menv || jsonlisp.menvTop;

    if(Array.isArray(x) && menv.hasOwnProperty(x[0])) {
        // expand recursively, in case macro returns another macro (or
        // the common case of itself)
        return expand1(menv[x[0]](x, env, menv), env, menv); // macro gives us our new code snippet
    }
    return x;
};

// deep expand of x.
jsonlisp.expand = function expand(x, env, menv) {
    x = jsonlisp.expand1(x, env, menv);
    if(Array.isArray(x)) {
        x = x.map(x=>expand(x, env, menv));
    }
    return x;
};

// this is the core interpreter. it's extremely slow, very
// recursive, and it's missing critical parts (like apply). but
// this is just for show.
jsonlisp.eval = function eval(x, env, menv) {
    env = env || jsonlisp.envTop;
    menv = menv || jsonlisp.menvTop;
    x = jsonlisp.expand(x, env, menv);
    if(typeof(x) === 'string') {  // variable reference
        if(env.hasOwnProperty(x)) return env[x];
        else throw new Error('undefined: ' + JSON.stringify(x) + '(have '+Object.keys(env)+')');
    }
    else if(Array.isArray(x)) {
        if(x.length <= 0) throw new Error('illegal function call: ' + JSON.stringify(x));
        let fname = x[0];
        switch(fname) {
        case 'quote': {
            return x[1]; // [eval [quote X]] => X
        }
        case 'do': {// aka (begin ...), returning only last expression
            let xs = x.slice(1);
            for(let i = 0 ; i < xs.length-1 ; i++) {
                eval(xs[i], env, menv); // ignore return values
            }
            return eval(xs[xs.length-1], env, menv); // return last expression only
        }
        case 'fn' : { // aka lambda
            let bindings = x[1];
            let xs = x.slice(2);
            return function (...args) {
                let env0 = {...env}; // copy environment, we might modify it inside the function
                bindings.forEach((x,i)=>env0[x]=args[i]);
                return eval(['do', ...xs], env0, menv);
            };
        }
        case 'if': {
            //   ,-- evaluate test clause
            if(eval(x[1], env, menv) !== false)
                return eval(x[2], env, menv); // evaluate `then` body
            else
                return eval(x[3], env, menv); // evaluate `else` body
        }
        case 'define': {
            let vname = x[1];
            let value = eval(x[2], env, menv);
            env[vname] = value;
            return undefined;
        }
        case 'define-syntax': {
            let vname = x[1];
            let value = eval(x[2], env, menv); // compile-time evaulation
            menv[vname] = value;
            return undefined;
        }}
        x = x.map(x=>eval(x, env, menv)); // not a macro: evaluate everything
        if(typeof(x[0]) === 'function') {
            return x[0].apply(null, x.slice(1));
        }
        throw new Error('cannot call non-function ' + JSON.stringify(fname));
    }
    return x; // everyting else is self-evaluating (internal functions, numbers, booleans etc)
};

function test(name, expected, x) {
    console.log('\x1b[35mtest ' + name + '\x1b[0m');
    console.log('    ', JSON.stringify(x));
    let result = jsonlisp.eval(x);
    console.log('\x1b[35m  =>\x1b[0m', result);
    if(result !== expected) {
        throw new Error('test fail: ' + JSON.stringify(result) + '≠' + JSON.stringify(expected));
    }
};

test('quote', 1, ['quote', 1]);
test('quote', 'QUOTED', ['quote', 'QUOTED']);

test('do', 3, ['do', 1, 2, 3]);
test('print', undefined,
     ['do',
      ['print', ['quote', `Hello, and welcome to jsonlisp.`]],
      ['print', ['quote', `Let's run some tests`]]]);

test('simple addition', 123, ['+', 100, 23]);

test('if', 1, ['if', 100,   1, 2]);
test('if', 1, ['if', 0,     1, 2]); // no falsy, only false is false here
test('if', 2, ['if', false, 1, 2]); // for now at least.

test('conditional evaluation (only 1 printout)', undefined,
     ['if', true,
      ['print', ['quote', 'i am executed']],
      ['print', ['quote', 'i am not executed']]]);

test('there are no statements, everything is an expression - including if', undefined,
     ['print', ['if', true,
                ['quote', 'yes'],
                ['quote', 'no']]]);

test('anonymous function', 20,
     [['fn', ['a', 'b'],
       ['print', ['quote', 'anonymous fn called with a='], 'a'],
       ['print', ['quote', 'anonymous fn called with b='], 'b'],
       ['*', 'a', 'b']],
      10, 2]);

test('anonymous function²', 300,
     [[['fn', ['a'],
        ['fn', ['x'],
         ['*', 'a', 'x']]],
       100],
      3]);

test('lexical scoping', 804,
     [['fn',
       /**/['x', 'y', 'z'], // 10 20 30
       ['+',
        'x', // 1
        [['fn', ['x'],
          ['define', 'z', 100], // shadows z from above
          ['print', ['quote', 'xyz='], 'x', 'y', 'z'], // should be 4 2 -1
          ['*', 'x', 'y', 'z']],// x from current scope, y from outer
         4], // our new x
        'z']], // back to 3
      1, 2, 3]);

test('array & get', 20, ['get', ['array', 10,20,30], 1]);

jsonlisp.eval(['define', 'x', 1000]);
test('define get', 1000, 'x'); // now 'x' is defined in our top-level environment

jsonlisp.eval(['define', 'inc', ['fn', ['x'], ['+', 'x', 1]]]);
test('inc', 3, ['inc', 2]);

// the macro should be run only once for this:
jsonlisp.eval(['define', 'factorial',
               ['fn', ['n'],
                ['if', ['=', 'n', 0],
                 1,
                 ['*', 'n', ['factorial', ['-', 'n', 1]]]]]]);

test('factorial', 5040, ['factorial', 7]);

jsonlisp.eval(['define', 'fib',
               ['fn', ['n'],
                ['if', ['<', 'n', 2],
                 1,
                 ['+',
                  ['fib', ['-', 'n', 1]],
                  ['fib', ['-', 'n', 2]]]]]]);

// this is very, very slow.
test('fib', 10946, ['fib', 20]);

// macro that turns [let [x 0] [+ x 1]] => [[fn [x] [+ x 1] 0] for example.
jsonlisp.eval(['define-syntax', 'let',
               ['fn', ['x', 'env', 'menv'],
                ['print', ['quote', 'debugging let'], 'x'],
                [['fn', ['#bindings', 'body...'],
                  ['if', ['>', '#bindings', 0],
                   // x could be ['let', ['a', 1], 'a']
                   ['append',
                    ['array',
                     ['array', ['quote', 'fn'],
                      ['array', ['get', ['get', 'x', 1], 0]], // arg name
                      ['append',
                       ['array', ['quote', 'let']],
                       ['array', ['slice', ['get', 'x', 1], 2]],
                       'body...']],
                     ['get', ['get', 'x', 1], 1]], // arg value
                    ['slice', 'x', 3]],
                   // no more #bindings, so expand [let [] a b c] into just [do a b c]:
                   ['array',
                    ['append',
                     ['array', ['quote', 'fn']],
                     /**/['array', ['array']],
                     'body...']]]],
                 /*bindings:*/['get', ['get', 'x', 1], ['quote', `length`]],
                 /*body:*/['slice', 'x', 2]
                ]]]);


test('let macro 0',  12, ['let', [], 12]);
test('let macro 0 scope',  12, ['let', [], ['define', 'nested', 12], 'nested']);
//test('let macro 0 scope',  12, 'nested'); // <-- should fail now
test('let macro 1',  13, ['let', ['x', 12], ['+', 1, 'x']]);
test('let macro 2', 120, ['let', ['x', 12, 'y', 10], ['*', 'y', 'x']]);

// we're generally used to seeing math with infix notation. even
// though I'm a fan of LISPs, I still feel that turning the mathematical
//
//            F = C*9/5 + 32
//
// into prefix-notation, these expressions can get awkward:
jsonlisp.eval(['define', 'fahrenheit',
               ['fn', ['c'],
                ['+', ['*', 'c', ['/', 9, 5]], 32]]]);

test('fahrenheit', 50, ['fahrenheit', 10]);

// but what if we could do this instead?
//
//   ['define', 'fahrenheit',
//        ['fn', ['c'],
//         ['->', 'c',
//          ['*', 9],
//          ['/', 5],
//          ['+', 32]]]]
//
// I think that might have made it more readable. Let's see what might
// be needed for that to work. We will need a macro because we will
// have to modify the expression inside the -> into the original one above.
// Btw, Clojure calls this the 'threading' macro:
// http://clojure.github.io/clojure/clojure.core-api.html#clojure.core/-%3E

// note that our macro system is very, very ugly. a real macro system would
// allow you to pattern-match. this is the Scheme equivalent:
//
// (define-syntax ->
//   (syntax-rules ()
//     ((-> x) x)
//     ((-> x (proc args ...) rest ...)
//      (-> (proc x args ...) rest ...))))

jsonlisp.eval(['define-syntax', '->',
               ['fn', ['x', 'env', 'menv'],
                ['print', ['quote', 'debugging ->'], 'x'],
                ['if', ['>', ['get', 'x', ['quote', `length`]], 2],
                 // expand [-> x [f args ...] rest ... ]
                 // into   [-> [f x args ...] rest ... ]
                 ['append', // quasiquote and unquote would have been nice here
                  ['array', ['quote', '->']], // <-- our macro is recursive here!
                  ['array', ['append',
                             ['array', ['get',   ['get', 'x', 2], 0]],
                             ['array', ['get', 'x', 1]],
                             /*     */ ['slice', ['get', 'x', 2], 1]]],
                  ['slice', 'x', 3]],
                 // expand [-> x] into just x:
                 ['get', 'x', 1]]]]);

test('-> macro', 20, ['->', 5,
                      ['-', 1, 1, 1], // aka -3
                      ['*', 10]]);

// tada!
jsonlisp.eval(['define', 'fahrenheit',
               ['fn', ['c'],
                ['->', 'c',
                 ['*', 9],
                 ['/', 5],
                 ['+', 32]]]]);

test('fahrenheit', 50, ['fahrenheit', 10]);

