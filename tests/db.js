// @see https://www.codecademy.com/resources/docs/javascript/promise/allSettled                        

//Promise.allSettled(iterableObject);

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
try {


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
    

            db.collection("reverse_synthesis_testing").find().sort({ "_id":-1}).toArray(function(err, records) {

                const promises = records.map((record)=>{
                    return LookupMolecule(db, record.target_smiles, "SMILES", logger, PubChemLookup).then( 
                        // "resolves" callback
                        (chemical) => {
                            if (null === chemical) {
                                throw new Error('Chemical is null')
                            }
                            console.log(chemical.IUPACName)
                            const test_container = ContainerFactory(
                                MoleculeFactory(
                                    AtomsFactory(record.target_smiles, logger),                        
                                    false, 
                                    false, 
                                    logger
                                ), 
                                [], 
                                null, 
                                null
                            )
                            console.log('[synth] Testing ' + record.reaction)
                            logger.log('info', '[synth] Testing ' + record.reaction)
                            console.log('[synth] Synthesising ' + chemical.IUPACName + ' ' + record.target_smiles)
                            logger.log('info', '[synth] Synthesising ' + chemical.IUPACName + ' ' + records.target_smiles)
                            Synthesise(
                                test_container,
                                logger,
                                db,
                                record.max_number_of_steps,
                                (pathways)=>{
        
                                    console.log('Analysing ' + record.reaction)
                                    pathways.map((pathway)=>{
                                        console.log(pathway[0].substrate.canonicalSmiles)
                                        return pathway
                                    })
                                    // Look for a pathway where the first reaction matches the expected starting substrate and the expected reagent
                                    const matching_container = 
                                    _.find(pathways, (pathway)=>{
                                        const container = pathway[0]
                                        const smiles = container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)
                                        if (smiles !== record.expected_starting_substrate_smiles) {
                                            return false
                                        }
                                        /*
                                        if (undefined !== test.expected_starting_reagent_smiles) {
                                            const reagents = container.reagents
                                            const matching_reagent = _.find(reagents, (reagent)=>{
                                                return reagent.canonicalSmiles === test.expected_starting_reagent_smiles
                                            })
                                            return undefined !== matching_reagent
                                        }
                                        */
                                        return true
                                    })
        
                                    if (undefined === matching_container) {
                                        throw new Error('Wrong result for test ' + record.reaction)
                                    } else {
                                        console.log(record.reaction + ' ok')
                                     //   process.exit()
                                    }
                                }
                            )

                        },
                        (err) => {
                            console.log('Failed to lookup molecule')
                            process.exit()
                        }
                    )
                }) // records.map

                Promise.allSettled(promises)
                .then((values) => {
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

            }) // db.collection


    })


} catch(e) {
    logger.log('error', e.stack)
    console.log(e)
}
