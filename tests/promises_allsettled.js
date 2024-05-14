// @see https://www.codecademy.com/resources/docs/javascript/promise/allSettled                        

const { loggers } = require("winston");

//Promise.allSettled(iterableObject);



try {


    const promiseA = (v) => {
        return new Promise((resolve, reject) => {
            resolve(v);
        });
    }

    const promiseB = (v) => {
        return new Promise((resolve, reject) => {
            const connectionGood = true;
            if (connectionGood) {
                resolve('Success!')
            } else {
                reject({
                    errorType: 'Network Error',
                    message: 'Bad Connection. Check network settings on all devices.',
                });
            }
        })
    }

    const promiseC = (v) => {
        return new Promise((resolve, reject) => {
            if (2 + 2 === 4) {
                resolve('Success! promiseC is resolved!');
            } else {
                reject({
                    errorType: 'Unknown Error',
                    message: 'Invalid Data Used.',
                });
            }
        });
    }

    const promises = [promiseA('test'), promiseB('test'), promiseC('test')]

    Promise.allSettled(promises)
    .then((values) => {
        console.log('values')
        console.log(values  )
        values.forEach((val) => console.log(val));
    })
    .catch((err) => {
        console.log(
            `Promise.allSettled() Failed! \n${err.errorType}: ${err.message}`
        );
    })
    .finally(() => {
        console.log('Operations for Promise.allSettled() have finished.');
    });


} catch(e) {
    logger.log('error', e.stack)
    console.log(e)
}
