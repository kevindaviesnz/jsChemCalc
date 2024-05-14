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
const Pathway = require('../view/Pathway');

let cursor = '\\'
let dots = '.'
const term = require( 'terminal-kit' ).terminal ;


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
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
if (false) {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

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

const Typecheck = require('../Typecheck');
const AddChemicalToDatabase = require('../actions/AddChemicalToDatabase');

term.saveCursor()
//term('| Connecting to database, please wait ...')
term('Connecting to database, please wait ...')
term.restoreCursor()


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

try {

    function pathwayPromise(db, pathway, logger) {


        return new Promise((resolve, reject) => {

            async function lookupPathway (smiles) {
                console.log("rendering " + smiles)
                const chemical =  await LookupMolecule(db, smiles, "SMILES", logger, PubChemLookup)
                resolve(chemical, container)
            }

            pathway.map((container)=>{

                const smiles = container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms, logger)

                lookupPathway(smiles)

            })


        })
    }

    const renderPathwayAndSave = (db, pathway, logger) =>{

        const render = pathwayPromise(db, pathway, logger)
        render.then(
            // resolve callback
            (chemical, container) =>{
                console.log('Chemical:')
                console.log(chemical)
                container.getSubstrate()[0]['IUPACName'] = chemical['IUPACName']
                if (pathway.length === 1) {
                    term(container.getSubstrate()[0]['IUPACName'] + ' ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
                } else {
                    term(container.getSubstrate()[0]['IUPACName'] + ' ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) + ' [' + container.mechanism + '] ---> ')
                }
            }
        )

    }


    const renderPathway = (db, reaction_steps, logger) => {

        try {
            Typecheck(
                {name: "db", value:db, type: "object"},
                {name: "reaction_steps", value: reaction_steps, type: "array"},
                {name: "logger", value: logger, type: "object"}
            )
            if (reaction_steps.length > 1) {
                // @see https://github.com/cronvel/terminal-kit/blob/master/doc/low-level.md#ref.movingCursor
                
                term.hideCursor()
                term.eraseLine()
                term.restoreCursor()
                dots = dots === "."?"..":(dots===".."?"...":dots==="..."?".":".")
                cursor = cursor === '/'?'-':cursor==='-'?'\\':cursor === '\\'?'|':'/'
              //  const pathway = Pathway('', reaction_steps, logger)
               // term(cursor + ' ' + pathway.toString())
                term("Synthesising [this may take awhile]" + dots)
                term.restoreCursor()
                

            }
            //throw new Error('testing')
        } catch(e) {
            logger.log('error', e.stack)
            console.log(e.stack)
            process.exit()
        }
    }

    function testLookup(db) {
        const search_object = {
            $or: [
                {
                    'tags': {
                        $in: ['CO']
                    }
                },
                {
                    "IUPACName": 'carbon monoxide'
                }
            ]
        }

        db.collection('molecules').findOne(search_object, function (Err, molecule) {
            if (undefined == molecule || null === molecule) {
                console.log('Got molecule:')
                console.log(molecule)
                pkl.searchBySMILES('CO', db, (molecule_from_pubchem) => {
                    if (molecule_from_pubchem !== null) {
                        AddChemicalToDatabase(
                            db,
                            molecule_from_pubchem,
                            'CO',
                            logger,
                            ()=>{

                            }
                        )

                    }
                })
            }
        })
    }

    const testReaction = (db, reaction,logger)=>{


     //   testLookup(db)

        const test_container = ContainerFactory(
            MoleculeFactory(
                AtomsFactory(reaction.finish, logger),                        
                false, 
                false, 
                logger
            ), 
            [], 
            null, 
            null
        )

        /*
        term.restoreCursor()
        term.eraseLine()
        term('- Synthesising ' + reaction.finish)
        term.restoreCursor()
        */

        const allow_invalid = true
        
        Synthesise(
            test_container,
            logger,
            db,
            reaction.steps,
            renderPathway,
            (pathways) => {

                const pathways_smiles = pathways.map((pathway)=>{
                    return pathway.filter((container)=>{
                        return null !== container && undefined !== container.getSubstrate()[0].smiles_string
                    }).map((container)=>{
                        return container.getSubstrate()[0].smiles_string
                    })
                })
                
              //  console.timeEnd('ai')
                // Look for a pathway starting with reaction.start (smiles)
                const matching_pathway = _.find(pathways_smiles, (pathway)=>{
                    const smiles = pathway[0]
                    return reaction.start === smiles
                })
                if (undefined === matching_pathway) { // undefined === matching_pathway
                    try {
                        console.log('Matching pathway not found')
                        console.log(pathways_smiles)
                     //  console.timeEnd('Synthesise')
                    //  term('Matching pathway not found for ' + reaction.name)
                    //  term.nextLine(1)
                        const strict = false
                        Pathways('db_123', pathways, logger, strict, db).console()
                         console.log('Pathways:')
                         console.log(pathways)
                        console.log(pathways.map((pathway)=>{
                            return pathway.filter((container)=>{
                                return null !== container && undefined !== container.getSubstrate()[0].smiles_string
                            }).map((container)=>{
                                return container.getSubstrate()[0].smiles_string + '[' + container.mechanism + ']'
                            })
                        }))
                       console.log('Exiting ...')
    
                    } catch(e) {
                        console.log(e)
                        process.exit()
                    }

 
                    process.exit()
                } else {

                    Pathways('db_123', pathways, logger, false, db).console()

                    term.eraseLine()
                    term.restoreCursor()
                    term("OK (synth2) " + reaction.name)
                    term.down(1)
                    term.saveCursor()
                  //  console.log('Matching pathway:')
                   // console.log(matching_pathway)
                   console.log('Pathways:')
                   console.log(pathways_smiles)
                  // console.timeEnd('Synthesise')
                  console.log('Exiting ...')
                   process.exit()
                }
            },
            allow_invalid
       )
    }

    async function main() {

        client.connect(err => {
    
            assert.equal(err, null) // Check database connection was successful
        
            const db = client.db("chemistry")

            console.log('Connected to db')

            
            term.eraseLine()
            term.restoreCursor()
        //    term("/ Database connection successful")
            term.restoreCursor()
    
            

            db.collection("reaction_testing").find().sort({ "_id":-1}).toArray(function(err, reactions) {
    

                reactions.map((reaction,i)=>{
                   // console.time('ai')
             //      console.log(reaction)
                    testReaction(db, reaction, logger) // await
                    return reaction
                })
                
    
            })

            
            
    
        
        })
    }
    
    main()
    
} catch(e) {
    logger.log('error', e.stack)
    console.log(e.stack)
    process.exit()
}

