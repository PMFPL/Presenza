const fs = require("fs");


// ============================================================
// 🔵 MAIN / SYNCHRONOUS EXECUTION STARTS
// ============================================================

console.log("A");
// ✅ EXECUTES IMMEDIATELY
// Output: A


// ------------------------------------------------------------
// Register a TIMER callback
// ------------------------------------------------------------
setTimeout(() => {
    // ⏳ REGISTERED in TIMER queue
    // Nothing inside runs NOW.

    console.log("B");

    // ⏳ REGISTER nextTick callback
    process.nextTick(() => console.log("C"));

    // ⏳ REGISTER Promise microtask
    Promise.resolve().then(() => {
        console.log("D");

        // ⏳ REGISTER setImmediate
        setImmediate(() => console.log("E"));
    });

    // ⏳ REGISTER another timer
    setTimeout(() => console.log("F"), 0);

}, 0);


// ------------------------------------------------------------
// Register setImmediate
// ------------------------------------------------------------
setImmediate(() => {
    // ⏳ REGISTERED in CHECK phase

    console.log("G");

    // ⏳ REGISTER nextTick
    process.nextTick(() => console.log("H"));

    // ⏳ REGISTER Promise microtask
    Promise.resolve().then(() => console.log("I"));
});


// ------------------------------------------------------------
// Register process.nextTick
// ------------------------------------------------------------
process.nextTick(() => {

    // ⏳ This callback is currently being registered.
    // It will run AFTER synchronous code finishes.

    console.log("J");

    // ⏳ REGISTER another nextTick
    process.nextTick(() => console.log("K"));

    // ⏳ REGISTER Promise microtask
    Promise.resolve().then(() => {

        console.log("L");

        // ⏳ REGISTER another nextTick
        process.nextTick(() => console.log("M"));
    });
});


// ------------------------------------------------------------
// Register Promise microtask
// ------------------------------------------------------------
Promise.resolve().then(() => {

    // ⏳ Promise callback registered in microtask queue

    console.log("N");

    // ⏳ REGISTER nextTick
    process.nextTick(() => console.log("O"));

    // ⏳ REGISTER another Promise microtask
    Promise.resolve().then(() => console.log("P"));
});


// ------------------------------------------------------------
// Register fs.readFile #1
// ------------------------------------------------------------
fs.readFile(__filename, () => {

    // ⏳ REGISTERED as an I/O operation.
    // Callback will eventually execute in POLL phase.

    console.log("Q");

    // ⏳ REGISTER nextTick
    process.nextTick(() => console.log("R"));

    // ⏳ REGISTER Promise
    Promise.resolve().then(() => {

        console.log("S");

        // ⏳ REGISTER TIMER
        setTimeout(() => console.log("T"), 0);

        // ⏳ REGISTER setImmediate
        setImmediate(() => console.log("U"));
    });

    // ⏳ REGISTER TIMER
    setTimeout(() => {

        console.log("V");

        // ⏳ REGISTER nextTick
        process.nextTick(() => console.log("W"));

    }, 0);


    // ⏳ REGISTER setImmediate
    setImmediate(() => {

        console.log("X");

        // ⏳ REGISTER Promise
        Promise.resolve().then(() => console.log("Y"));
    });
});


// ------------------------------------------------------------
// Register fs.readFile #2
// ------------------------------------------------------------
fs.readFile(__filename, () => {

    // ⏳ REGISTERED as another I/O operation.
    // Callback will eventually execute in POLL phase.

    console.log("Z");

    // ⏳ REGISTER setImmediate
    setImmediate(() => console.log("AA"));

    // ⏳ REGISTER nextTick
    process.nextTick(() => console.log("AB"));

    // ⏳ REGISTER Promise
    Promise.resolve().then(() => console.log("AC"));
});


// ============================================================
// END OF SYNCHRONOUS CODE
// ============================================================

console.log("AD");
// ✅ EXECUTES IMMEDIATELY
// Output: AD


// ============================================================
// 🔴 SYNCHRONOUS CODE IS NOW FINISHED
// ============================================================
//
// Current queues roughly:
//
// nextTick queue:
//     J
//
// Promise microtask queue:
//     N
//
// Timers:
//     B
//
// Check:
//     G
//
// I/O:
//     fs.readFile #1 → Q
//     fs.readFile #2 → Z
// ============================================================