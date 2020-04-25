// Use: open index.html in browser; check console

// Simple example of computing grad of a function evaluated at a point

// f(x) = x ^ 2
const f = x => x.square();
// f'(x) = 2x
const g = tf.grad(f);

const x = tf.tensor1d([2, 3]); // Note automatic size casting
console.log("f'(x) = ");
g(x).print();

// Optimize this function on variable `a` only

const a = tf.scalar(Math.random()).variable();

const learningRate = 0.1; // TODO Try different learning rates
const optimizer1 = tf.train.sgd(learningRate);
const optimizer2 = tf.train.adam(learningRate);

let res;

// TODO: Test which of these optimizers converge quickest
// Should it really take 100 iterations to minimize f(x)=x^2?!
for (let i = 0; i < 100; i++) {
    // Note minimize has params returnCost and varList (for specifying variables)
    res = optimizer2.minimize(() => f(a), returnCost=true);
}

console.log(`a: ${a.dataSync()}`);
console.log(`f(a): ${res}`);

// ------------------------------

// More realistic example, closer to Penrose:
// (Not yet compiled; data transformed by hand)

// Style: encourage center(x.shape)
// Functions: center(s : GPI) => (s.x)^2 + (s.y)^2
// GenOptProblem: F[X] := 
// Grad: dF[X]/d[X] = [dF/dX1, ... dF/dXn]

// NOTE: tf.js can't necessarily opt. WRT constraints

let num = x => tf.scalar(x, 'int32'); // What numeric format do we want?

let gpi1 = { x : 10.0, y : 25.0, r : 3.0, name : "circA" };
let gpi2 = { x : num(10.0), y : num(25.0), r : num(3.0), name : "circA" };
let gpi2_varying_vals = [num(10.0), num(25.0)]; // TODO do this programmatically, also these need to be tensors

let centerFn1 = shape => shape.x * shape.x + shape.y * shape.y;

// You can't eval these functions with normal floats
let centerFn2 = shape => (shape.x).square().add((shape.y).square());

// Be careful not to use normal ops in any tf code!
// This is (x,y) not ([x,y])
let centerFn3 = (x, y) => x.square().add(y.square());
let centerFn4 = ([x, y]) => {
    // let [x, y] = xs;
    return x.square().add(y.square());
}

console.log("centerFn2(gpi2) = ");
centerFn2(gpi2).print();

let objFn = { name: "centerFn", args: "circA" };

const gradFn2 = tf.grads(centerFn3); // Use grads for multi-args
console.log("centerFn3'(gpi2) = ");
let [dx, dy] = gradFn2(gpi2_varying_vals);
// the x passed in grad(f)(x) must be a tensor
dx.print();
dy.print();

// ---------------------
// With list as input

// Converts a function in global scope, named `$globalObjective`, that takes a list of size `n` as an argument, to a function that takes a tuple of length `n` as an argument
// e.g. mkfn(2) yields:
// ($var0,$var1) => { return globalObjective([$var0, $var1]); }
// The point of this is to create a function that `grads` can take as an argument, since it only accepts tuples
// (The alternative is to fork the tfjs function `grads` in `gradients.ts` to not do a spread)
// (Using the Function constructor requires references in the body to be in global scope)

// TODO: Benchmark speed hit of this
let tuplifyArgs = (n) => {
    let args = _.range(0, n).map(e => "$var" + String(e));
    let body = "return globalObjective([" + args.toString() + "]);";
    return new Function(args, body);
}

let fTup = tuplifyArgs(2); // You just need to know the number of arguments ahead of time
let globalObjective = centerFn4;
let fTupRes = fTup(gpi2_varying_vals[0], gpi2_varying_vals[1]);
console.log("fTup, fTupRes", fTup);
fTupRes.print();

const gradFn4 = tf.grads(fTup); // Use grads for multi-args
console.log("centerFn4'(gpi2) = ");
let [dx4, dy4] = gradFn4(gpi2_varying_vals);
// the x passed in grad(f)(x) must be a tensor
dx4.print();
dy4.print();

// ---------------------

// Optimize params (c,d)

const c = tf.scalar(Math.random()).variable();
const d = tf.scalar(Math.random()).variable();
const vars = [c, d];

const optimize = (vars) => {
    // Using the same optimizer from above
    // TODO benchmark how long these take (it pauses a bit in the browser)
    let res2;

    for (let i = 0; i < 100; i++) {
	res2 = optimizer2.minimize(() => centerFn3(...vars), returnCost=true, varList=vars);
    }

    return res2;
};

let res3 = optimize(vars);

console.log(`c: ${c.dataSync()}, d: ${d.dataSync()}`);
console.log(`f(a): ${res3}`);