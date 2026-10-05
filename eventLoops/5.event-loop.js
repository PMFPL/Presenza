const fs = require("fs");
console.log("A");
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
console.log("AB");


