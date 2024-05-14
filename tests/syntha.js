const ContainerFactory = require('../factories/ContainerFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const uniqid = require('uniqid');
// https://www.npmjs.com/package/winston
const winston = require('winston');
const Synthesise = require('../AI/Synthesise')
const Constants = require('../Constants')
const LookupMolecule = require('../actions/LookupMolecule')
const PubChemLookup = require('../actions/LookupPubChem')
const pkl = PubChemLookup((err)=>{
    console.log(err)
    process.exit()
})

const _ = require('lodash');
const Pathways = require('../view/Pathways');

/*
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.Console({ filename: 'error.log', level: 'error' }),
        new winston.transports.Console({ filename: 'debug.log', level: 'debug' }),
        new winston.transports.File({ filename: 'products.log', level:'verbose' }),
    ],
});
*/

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ],
});


//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (true) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}


const last_action = null
const max_steps = 10
const pathway_id = uniqid().substr(uniqid().length-Constants().pathway_id_segment_length, Constants().pathway_id_segment_length)
const reaction_steps = []

const Prototypes = require("../Prototypes")
Prototypes()

// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');

// Install using npm install dotenv
//require("dotenv").config()
const env = require('../env')

// Establish database connection
//          mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + env.user + ":" + env.password + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

const Typecheck = require('../Typecheck')

console.log('Connecting to database, please wait ...')
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {




    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")

    console.log("Database connection successful")

    // Run tests from database
    // @see tests/reactions.js
    if (true) {

        // Create series of promises
        // @see https://www.codecademy.com/resources/docs/javascript/promise/allSettled
        const tests = (test) => {
            return new Promise((resolve, reject) => {
                resolve(test)
            })
        }

        const promises = []

        db.collection("reverse_synthesis_testing").find().sort({ "_id":-1}).forEach((test) => {

            // Run the test
            // LookupMolecule returns a promise
            promises.push(tests(test))

        })

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

    }

    

})

