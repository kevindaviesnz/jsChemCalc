const { loggers } = require("winston");

try {

    // Create a promise an encapsulate.
    // 'success' is a variable we pass in when we create an instance of a promise.
    // 'resolve' is a function we pass in as the first parameter of the 'then' method of the promise instance.
    // 'reject' is a function we pass in as the second parameter of the 'then' method of the promise instance.
    // We don't have the function return a value. Instead we call 'resolve' when then does something with the paramter passed to resolve().
    function promise1(success, time){
        return new Promise((resolve, reject)=> {
            setTimeout(()=> {
                success ? resolve(success):reject(success)
                }, time
            );
        });
     }
    

    // Create a promise instance
    let p1 = promise1(true, 1000)
    let p2 = promise1(false, 1500)


    // Call the 'then' method of the promise
    p1.then(
        // 'resolve' callback
        (v) => {
            // v is passed in by the promise when it calls 'resolve()'
            console.log('success ' + v)
        },
        // 'reject' callback
        (v) => {
            // v is passed in by the promise when it calls 'reject()'
            console.log('rejected ' + v)
        }
    )

    p2.then(
        // 'resolve' callback
        (v) => {
            // v is passed in by the promise when it calls 'resolve()'
            console.log('success ' + v)
        },
        // 'reject' callback
        (v) => {
            // v is passed in by the promise when it calls 'reject()'
            console.log('rejected ' + v)
        }
    )


    // Result of p2 is shown before p1 as p2 has a lower value for the 'time' parameter.

    // Generating promises using recursion
    const arr = []

    const r = (d) => {
        if (d < 4) {
            
            // Create promise object
            const promise_recusive_object = () => {
                return new Promise((res, rej)=> {
                    // Call the res() callback defined by generating an instance of the promise and calling then() method of that instance.
                    arr.push('recursing' + d)
                    res('recursion ' + d)
                });
            }

            // Call 'then' method of promise object, passing in a callback function.
            promise_recusive_object().then(
                (result) => {
                    console.log(result)
                }
            )

            r(d+1)

        }  else {
            arr.push('notrecursing' + d)
            console.log('Not recursing as d is less than 4 ' + d)
        }
    }

    r(0) // Recursion
    console.log(arr)
        

} catch(e) {
    logger.log('error', e.stack)
    console.log(e.stack)
}
