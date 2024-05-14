// @see https://rossbulat.medium.com/using-promises-async-await-with-mongodb-613ed8243900

const { resolve } = require('path');
const { loggers } = require('winston');

// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient

try {

    const env = require('../env')
    const assert = require('assert');

    // Establish database connection
    // mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
    const uri = "mongodb+srv://" + env.user + ":" + env.password + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";
    console.log('Connecting to database, please wait ...')
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    client.connect(err => {

        assert.equal(err, null) // Check database connection was successful
        const db = client.db("chemistry")
        console.log("Database connection successful")

        // Step 1: Declare promise
        const synth = () => {
            new Promise((resolve, reject)=> {
                db.collection("reverse_synthesis_testing").find().sort({ "_id":-1}).forEach((test) => {

                }).then(function(result){
                    console.log('then1')
                    console.log(result)
                }).then(function(result){
                    console.log('then2')
                    console.log(result)
                    resolve(result)
                }).catch(function(err) {
                    console('got an error')
                })
            })
        }
        
        // Step 2: async promise handler
        const callSynth = async() => {
            const result = await(synth())
            // Anything here is executed after the result is resolved
            return result
        }

        // Step 3: make the call
        callSynth().then(function(result){
            client.close()
            console.log('callSynth() result')
            resolve(result)
        })

    }) // end mongo cient



} catch(e) {
    logger.log('error', e.stack)
    console.log(e.stack)
    process.exit()
}
