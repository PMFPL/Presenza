const fs = require("fs");

console.log("A");

setTimeout(() => {
    console.log("B");

    process.nextTick(() => console.log("C"));

    Promise.resolve().then(() => {
        console.log("D");

        setImmediate(() => console.log("E"));
    });

    setTimeout(() => console.log("F"), 0);
}, 0);

setImmediate(() => {
    console.log("G");

    process.nextTick(() => console.log("H"));

    Promise.resolve().then(() => console.log("I"));
});

process.nextTick(() => {
    console.log("J");

    process.nextTick(() => console.log("K"));

    Promise.resolve().then(() => {
        console.log("L");

        process.nextTick(() => console.log("M"));
    });
});

Promise.resolve().then(() => {
    console.log("N");

    process.nextTick(() => console.log("O"));

    Promise.resolve().then(() => console.log("P"));
});

fs.readFile(__filename, () => {
    console.log("Q");

    process.nextTick(() => console.log("R"));

    Promise.resolve().then(() => {
        console.log("S");

        setTimeout(() => console.log("T"), 0);
        setImmediate(() => console.log("U"));
    });

    setTimeout(() => {
        console.log("V");

        process.nextTick(() => console.log("W"));
    }, 0);

    setImmediate(() => {
        console.log("X");

        Promise.resolve().then(() => console.log("Y"));
    });
});

fs.readFile(__filename, () => {
    console.log("Z");

    setImmediate(() => console.log("AA"));

    process.nextTick(() => console.log("AB"));

    Promise.resolve().then(() => console.log("AC"));
});

console.log("AD");