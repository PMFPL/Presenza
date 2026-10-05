const fs = require("fs");

console.log("A");

setTimeout(() => {
    console.log("B");

    process.nextTick(() => {
        console.log("C");

        Promise.resolve().then(() => {
            console.log("D");
        });
    });

    Promise.resolve().then(() => {
        console.log("E");

        process.nextTick(() => {
            console.log("F");
        });
    });

    setImmediate(() => {
        console.log("G");
    });
}, 0);

setImmediate(() => {
    console.log("H");

    process.nextTick(() => {
        console.log("I");
    });

    Promise.resolve().then(() => {
        console.log("J");

        setTimeout(() => {
            console.log("K");
        }, 0);
    });
});

process.nextTick(() => {
    console.log("L");

    process.nextTick(() => {
        console.log("M");
    });

    Promise.resolve().then(() => {
        console.log("N");

        process.nextTick(() => {
            console.log("O");
        });
    });
});

Promise.resolve().then(() => {
    console.log("P");

    process.nextTick(() => {
        console.log("Q");
    });

    Promise.resolve().then(() => {
        console.log("R");
    });
});

fs.readFile(__filename, () => {
    console.log("S");

    process.nextTick(() => {
        console.log("T");
    });

    Promise.resolve().then(() => {
        console.log("U");

        setImmediate(() => {
            console.log("V");
        });

        setTimeout(() => {
            console.log("W");
        }, 0);
    });
});

fs.readFile(__filename, () => {
    console.log("X");

    process.nextTick(() => {
        console.log("Y");

        Promise.resolve().then(() => {
            console.log("Z");
        });
    });

    setImmediate(() => {
        console.log("AA");
    });
});

console.log("AB");