const Typecheck = (...params) => {

    params.forEach(param => {

        try {
            if (undefined === param.value) {
                throw new Error(param.name + ' is undefined.')
            }
        } catch(e) {
            console.log(e.stack)
            console.log(e)
            process.exit()
        }

        if (param.type === 'array' && Object.prototype.toString.call(param.value) !== '[object Array]') {
            try {
                throw new Error(param.name + " should be an array, actual type:" + typeof param.value)
            } catch(e) {
                console.log("Actual value:")
                console.log(param.value)
                console.log(e)
                process.exit()
            }
        }

        if (param.value !== undefined && param.value !== null) {
            switch(param.type) {
                case 'number':
                    try {
                        if (typeof param.value !== "number") {
                            throw new Error(param.name + " should be a number, actual type:" + typeof param.value)
                        }
                    } catch(e) {
                        console.log("Actual value:")
                        console.log(param.value)
                        console.log(e)
                        process.exit()
                    }
                    break;
                case 'string':
                    try {
                        if (typeof param.value !== "string") {
                            throw new Error(param.name + " should be a string, actual type:" + typeof param.value)
                        }
                    } catch(e) {
                        console.log("Actual value:")
                        console.log(param.value)
                        console.log(e)
                        process.exit()
                    }
                    break;
                case 'object':
                    try {
                        if (param.type === 'object' && (typeof param.value !== "object" || Object.prototype.toString.call(param.value) === '[object Array]')) {
                            throw new Error(param.name + " should be an object, actual type:" + (Object.prototype.toString.call(param.value) === '[object Array]' ? 'array' : typeof param.value))
                        }
                    } catch(e) {
                        console.log("Actual value:")
                        console.log(param.value)
                        console.log(e)
                        process.exit()
                    }
                    break;
            }
        }
    });

}
module.exports = Typecheck