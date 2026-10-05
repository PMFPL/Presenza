const fs = require("fs");
console.log("starting event loop example...");



setTimeout(() => {
    console.log("setTimeout callback executed");
})

process.nextTick(() => {
    console.log("nextTick callback executed");

    Promise.resolve().then(() => {
        console.log("Promise callback executed inside nextTick");

        process.nextTick(() => {
            console.log("nextTick callback executed inside Promise");
        })
    })
})


fs.readFile(__filename, () => {
    console.log("fs.readFile callback executed");

    setTimeout(() => {
        console.log("setTimeout callback executed inside fs.readFile");
    })


    setImmediate(() => {
        console.log("setImmediate callback executed inside fs.readFile");
        
            Promise.resolve().then(() => {
                console.log("Promise callback executed inside fs.readFile");
            })
    })

})


Promise.resolve().then(() => {
    console.log("Promise callback executed");
})

console.log("ending event loop example...");


