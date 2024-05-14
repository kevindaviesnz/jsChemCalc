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
const pathway_id = uniqid().substr(uniqid().length-Constants().pathway_id_segment_length, Constants().pathway_id_segment_length)


let cursor = '\\'
const term = require( 'terminal-kit' ).terminal ;

const renderPathway = (synth_id, reaction_steps, logger) => {

    try {
        Typecheck(
            {name: "synth_id", value:synth_id, type: "string"},
            {name: "reaction_steps", value: reaction_steps, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )
        if (reaction_steps.length > 1999999) {
            // @see https://github.com/cronvel/terminal-kit/blob/master/doc/low-level.md#ref.movingCursor
            term.hideCursor()
            term.eraseLine()
            term.restoreCursor()
            cursor = cursor === '/'?'-':cursor==='-'?'\\':cursor === '\\'?'|':'/'
            const pathway = Pathway(synth_id, reaction_steps, logger)
            term(cursor + ' ' + pathway.toString())
            term.restoreCursor()
        }
        //throw new Error('testing')
    } catch(e) {
        logger.log('error', e.stack)
        console.log(e.stack)
        process.exit()
    }
}

// Require the lib, get a working terminal
/*
const term = require( 'terminal-kit' ).terminal ;
// Move the cursor at the upper-left corner
term.saveCursor()
term('hellworld')
term.restoreCursor()
term('good')
term("\n")
process.exit()
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

term.saveCursor()
term('| Connecting to database, please wait ...')
term.restoreCursor()

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")

    term.eraseLine()
    term.restoreCursor()
    term("/ Database connection successful")
    term.restoreCursor()

 
    if (true) {
        

    const reductive_amination = false
    const pinacol_rearrangment = false
    const ritter = false
    const imine = false
    const ketone = false
    const oxidisation = true

    const callback = (pathways) =>{
        console.log(Pathways('db_123', pathways, logger, db).console())
    }

    if (oxidisation) {
        const smiles = 'CC(=O)CC1=CC2=C(C=C1)OCO2' 
        LookupMolecule(db, smiles, "SMILES", logger, PubChemLookup).then( 
            // "resolves" callback
            (chemical, callback_id) => {
                
                if (null === chemical) {
                    throw new Error('Chemical is null')
                }


                const oxidisation_reverse_test_container = ContainerFactory(
                    MoleculeFactory(
                        AtomsFactory(smiles, logger),                        
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
                term('- Synthesising ' + smiles)
                term.down(1)
                term.saveCursor()
                */

                Synthesise(
                    oxidisation_reverse_test_container,
                    logger,
                    db,
                    1,
                    renderPathway,
                    callback

               )
            },
            (err) => {
                console.log('Failed to lookup molecule')
                process.exit()
            }
        )
    }

    // ------------------------------------------
    //  pkl.searchBySMILES(search.replace(/\(\)/g, ""), db, (molecule_from_pubchem) => {
    // Lookup molecule and add to database if required.
    if (ketone) {
        const smiles = 'CC(=O)CC1=CC2=C(C=C1)OCO2' 
        LookupMolecule(db, smiles, "SMILES", logger, PubChemLookup).then( 
            // "resolves" callback
            (chemical, callback_id) => {
                
                if (null === chemical) {
                    throw new Error('Chemical is null')
                }


                const ketone_reverse_test_container = ContainerFactory(
                    MoleculeFactory(
                        AtomsFactory(smiles, logger),                        
                        false, 
                        false, 
                        logger
                    ), 
                    [], 
                    null, 
                    null
                )

              //  term.restoreCursor()
             //   term.eraseLine()
             //   term('- Synthesising ' + smiles)
              //  term.down(1)
               // term.saveCursor()

                Synthesise(
                    ketone_reverse_test_container,
                    logger,
                    db,
                    6,
                    renderPathway,
                    callback

               )
            },
            (err) => {
                console.log('Failed to lookup molecule')
                process.exit()
            }
        )
    }


    if (pinacol_rearrangment) {
        // Deprotonation reverse
        // CC(C)(C)C(=[O+])C -> CC(C)(C)C(=[O])C
        // BondAtomToAtomReverse
        // CC(C)(C)[C+](O)C -> CC(C)(C)C(=[O+])C
        //
        // AkylShiftReverse
        // C[C+](C)C(O)(C)C -> CC(C)(C)[C+](O)C
        // DehydrateReverse
        // CCC([O+])(C)C(O)(C)C -> C[C+](C)C(O)(C)C
        // ProtonateReverse
        // CC(O)(C)C(O)(C)C -> CCC([O+])(C)C(O)(C)C
        // 4. CC(C(C)(C)[O+])(O)C
        const smiles = 'CC(C)(C)C(=[O])C' //  CC(C)(C)C(=[O])C, C[C+](O)C(C)(C)C, CC(O)([C+](C)C)C, CC(O)(C(C)(C)[O+])C
        LookupMolecule(db, smiles, "SMILES", logger, PubChemLookup).then( 
            // "resolves" callback
            (chemical, callback_id) => {
                
                if (null === chemical) {
                    throw new Error('Chemical is null')
                }

                /*
                Typecheck(
                    {name: "callback_id", value: callback_id, type: "string"},
                )
*/

                const pinacol_rearrangement_reverse_test_container = ContainerFactory(
                    MoleculeFactory(
                        AtomsFactory(smiles, logger),                        
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
                term('- Synthesising ' + smiles)
                term.restoreCursor()
                */

                Synthesise(
                    pinacol_rearrangement_reverse_test_container,
                    logger,
                    db,
                    20,
                    renderPathway,
                    callback

               )
            },
            (err) => {
                console.log('Failed to lookup molecule')
                process.exit()
            }
        )
    }


    if (ritter) {

        let smiles =  'C(C)(C)(C)[O+]' // // C(C)(C)(C)[O+] 'C(I)(I)(I)NC(=O)Br' // CC(=O)NC(C)(C)C // C(C)(C)(C)[O+]


        // CC(O)=NC(C)(C)C
        smiles =  'CC(O)=NC(C)(C)C'  // CC(O)=NC(C)(C)C  C(C)(C)(C)[O+]
        LookupMolecule(db, smiles, "SMILES", logger, PubChemLookup).then(
            // "resolves" callback
            (chemical) => {
                if (null === chemical) {
                    throw new Error('Chemical is null')
                }

                const ritter_reverse_test_container2 = ContainerFactory(
                    MoleculeFactory(
                        AtomsFactory(smiles, logger),                        
                        false, 
                        false, 
                        logger
                    ), 
                    [], 
                    null, 
                    null
                )


                term.restoreCursor()
                term.eraseLine()
                term('- Synthesising ' + smiles)
                term.restoreCursor()

                Synthesise(
                    ritter_reverse_test_container2,
                    logger,
                    db,
                    20,
                    renderPathway,
                    callback
               )
            },
            (err) => {
                console.log('Failed to lookup molecule')
                process.exit()
            }
        )

    }


    // Imine C=N
    // Amine CN
    if(imine) {
        // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
        // --> CCC=[O+] [lewis acid base] ---> CCC([N+]C)O
        let smiles = 'CC=NC' // 'CC=NC', 'CC=[N+]C', 'C[C+]NC', 'CC(NC)[O+]', 'CC(NC)O', 'CC([N+]C)O', 'CC=[O+]', 'CC=O'
        LookupMolecule(db, smiles , "SMILES", logger, PubChemLookup).then(
            // "resolves" callback
            // Note: Sometimes PubChem will convert the molecule into it's child so we have to use tags[0] where tags[0] is
            // always the canonical smiles that was actually used.
            (chemical) => {
                const imine_intermediate_reverse_protonation_test_container = ContainerFactory(
                    MoleculeFactory(
                        AtomsFactory(smiles, logger),                        
                        false, 
                        false, 
                        logger
                    ), 
                    [], 
                    null, 
                    null
                )

                term.restoreCursor()
                term.eraseLine()
                term('- Synthesising ' + smiles)
                term.restoreCursor()

                Synthesise(
                    imine_intermediate_reverse_protonation_test_container,
                    logger,
                    db,
                    20,
                    renderPathway,
                    callback
               )
            },
            (err) => {
                console.log('Failed to lookup molecule')
                process.exit()
            }
        )

    }

    if (reductive_amination) {

        if (true) {
            // @see https://duckduckgo.com/?q=reductive+amination&t=brave&iax=videos&ia=videos&iai=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DnL52_3hJPQ8
        }
        // amine: NC
        // imine: N=C
        if (true) {
            
            // @see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
            // CCC([N+]C)O CNCCC
            const smiles = 'CC(CC1=CC=CC=C1)NC' // CCCNC' 'CCC[N+]=C' 'CCC[N+]=C'
            //1.
            logger.log('info', 'synth.js Synthesising ' + smiles)
            LookupMolecule(db, smiles, "SMILES", logger, PubChemLookup).then( 
                // "resolves" callback
                (chemical) => {
                    //console.log('synth.js Synthesising chemical')
                    //console.log(chemical)
                    const reductive_ammination_reverse_protonation_test_container = ContainerFactory(
                        MoleculeFactory(
                            AtomsFactory(chemical.CanonicalSMILES, logger),                        
                            false, 
                            false, 
                            logger
                        ), 
                        [], 
                        null, 
                        null
                    )

                  //  term.restoreCursor()
                  //  term.eraseLine()
                  //  term('- Synthesising ' + smiles)
                  //  term.down(1)
                  //  term.saveCursor()

    
                    Synthesise(
                        reductive_ammination_reverse_protonation_test_container,
                        logger,
                        db,
                        20,
                        renderPathway,
                        callback
                   )
                },
                (err) => {
                    console.log('Failed to lookup molecule')
                    process.exit()
                }
            )


        }


       
    }

}

})

