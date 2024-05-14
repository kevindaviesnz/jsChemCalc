const ContainerFactory = require('../factories/ContainerFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
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



// Install using npm install mongodb --save
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');

// Install using npm install dotenv
require("dotenv").config()

// Establish database connection
//          mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";


console.log('Connecting to database, please wait ...')
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")
    console.log("Database connection successful")

    const reductive_amination = false
    const pinacol_rearrangment = true
    const ritter = true

    // ------------------------------------------
    //  pkl.searchBySMILES(search.replace(/\(\)/g, ""), db, (molecule_from_pubchem) => {
    // Lookup molecule and add to database if required.

    if (ritter) {
        // OneTwoAdditionReverse
        // CC#[N+]C(C)(C)C -> CC([O+])=NC(C)(C)C
        // DeprotonateReverse
        // CC([O+])=NC(C)(C)C -> CC(O)=NC(C)(C)C
        // ProtonateReverse
        // CC(O)=NC(C)(C)C -> CC(O)=[N+]C(C)(C)C
        // DeprotonateReverse
        // CC(=[O+])NC(C)(C)C -> CC(=O)NC(C)(C)C
        // CC(=O)NC(C)(C)C
        LookupMolecule(db, 'CC(=O)NC(C)(C)C', "SMILES", logger, PubChemLookup).then(
            // "resolves" callback
            // Note: Sometimes PubChem will convert the molecule into it's child so we have to use tags[0] where tags[0] is
            // always the canonical smiles that was actually used.
            (chemical) => {
                const ritter_reverse_test = ContainerFactory(MoleculeFactory(chemical.tags[0]), [], null, null)
                Synthesise(
                    ritter_reverse_test,
                    ritter_reverse_test,
                    max_steps,
                    pathway_id,
                    logger,
                    last_action,
                    reaction_steps,
                    db,
                    'start',
                    ()=>{
                        console.log('Showing paths')
                        const Pathways = require('../view/Pathways')(reaction_steps, logger)
                        Pathways.console()
                    }
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
        // AkylShiftReverse
        // C[C+](C)C(O)(C)C -> CC(C)(C)[C+](O)C
        // DehydrateReverse
        // CCC([O+])(C)C(O)(C)C -> C[C+](C)C(O)(C)C
        // ProtonateReverse
        // CC(O)(C)C(O)(C)C -> CCC([O+])(C)C(O)(C)C
        LookupMolecule(db, 'CC(C)(C)C(=[O])C', "SMILES", logger, PubChemLookup).then(
            // "resolves" callback
            (chemical) => {
                // CanonicalSMILES
                const pinacol_rearrangement_reverse_test = ContainerFactory(MoleculeFactory(chemical.CanonicalSMILES), [], null, null)
                Synthesise(
                    pinacol_rearrangement_reverse_test,
                    pinacol_rearrangement_reverse_test,
                    max_steps,
                    pathway_id,
                    logger,
                    last_action,
                    reaction_steps,
                    db,
                    'start',
                    ()=>{
                        console.log('Showing paths')
                        const Pathways = require('../view/Pathways')(reaction_steps, logger)
                        Pathways.console()
                    }
                )
            },
            (err) => {
                console.log('Failed to lookup molecule')
                process.exit()
            }
        )
    }


    if (reductive_amination) {
        if (false) {
            // CNC(C)C <- C[N+]=C(C)C
            // reduce revers
            const reductive_ammination_reverse_test = ContainerFactory(MoleculeFactory('CNC(C)C'), [], null, null)
            Synthesise(reductive_ammination_reverse_test, reductive_ammination_reverse_test, max_steps, pathway_id, logger, last_action, reaction_steps, db, 'start')
        }

        if (false) {
// C[N+]=C(C)C <- CN[C+](C)C
            const reductive_ammination_reverse_bond_atom_to_atom_test = ContainerFactory(MoleculeFactory('C[N+]=C(C)C'), [], null, null)
            Synthesise(reductive_ammination_reverse_bond_atom_to_atom_test, reductive_ammination_reverse_bond_atom_to_atom_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }

        if (false) {
// CN[C+](C)C <- CNC(C)([O+])C
            const reductive_ammination_reverse_hydrate_test = ContainerFactory(MoleculeFactory('CN[C+](C)C'), [], null, null)
            Synthesise(reductive_ammination_reverse_hydrate_test, reductive_ammination_reverse_hydrate_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }

        if (false) {
// C[N+]=C(C)C <- CNC(C)([O+])C
            // 1, 2 eliminatoin
            const reductive_ammination_reverse_onetwoelimination_test = ContainerFactory(MoleculeFactory('C[N+]=C(C)C'), [], null, null)
            Synthesise(reductive_ammination_reverse_onetwoelimination_test, reductive_ammination_reverse_onetwoelimination_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }

        if (false) {
            // CNC(C)([O+])C <- C[N+]C(C)(O)C
            // Proton transfer
            const reductive_ammination_reverse_proton_transfer_test = ContainerFactory(MoleculeFactory('CNC(C)([O+])C'), [], null, null)
            Synthesise(reductive_ammination_reverse_proton_transfer_test, reductive_ammination_reverse_proton_transfer_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }

        if (false) {
            // 1,2 addition reverse
// C[N+]C(O)(C)C <- CC(=[O+]C
            const reductive_ammination_reverse_onetwoaddition_test = ContainerFactory(MoleculeFactory('C[N+]C(O)(C)C'), [], null, null)
            Synthesise(reductive_ammination_reverse_onetwoaddition_test, reductive_ammination_reverse_onetwoaddition_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }


        if (false) {
            //protonation
            // CC(=O)C -> protonation -> CC(=[O+])C
            // Here we are trying to synthesise  CC(=[O+])C
            const reductive_ammination_reverse_protonation_test = ContainerFactory(MoleculeFactory('CC(=[O+])C'), [], null, null)
            Synthesise(reductive_ammination_reverse_protonation_test, reductive_ammination_reverse_protonation_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }

        if (true) {
            // Reduce
            // 1,2 elimination
            // protonation
            // 1,2 addition
            // Proton transfer
            //  CC(=O)C -> protonation -> CC(=[O+])C -> 1,2 addition -> C[N+]C(O)(C)C -> CNC(C)([O+])C -> C[N+]=C(C)C -> CNC(C)C
            // Here we are trying to synthesise CNC(C)C
            LookupMolecule(db, 'CNC(C)C', "SMILES", logger, PubChemLookup).then(
                // "resolves" callback
                (chemical) => {
                    // CanonicalSMILES
                    const reductive_ammination_reverse_protonation_test = ContainerFactory(MoleculeFactory(chemical.CanonicalSMILES), [], null, null)
                    Synthesise(
                        reductive_ammination_reverse_protonation_test,
                        reductive_ammination_reverse_protonation_test,
                        max_steps,
                        pathway_id,
                        logger,
                        last_action,
                        reaction_steps,
                        db,
                        'start',
                        (reaction_steps, logger)=>{
                            console.log('Showing paths')
                            const Pathways = require('../view/Pathways')(reaction_steps, logger)
                            Pathways.console()
                        }
                    )
                },
                (err) => {
                    console.log('Failed to lookup molecule')
                    process.exit()
                }
            )
//            const reductive_ammination_reverse_protonation_test = ContainerFactory(MoleculeFactory('CNC(C)C'), [], null, null)
//            Synthesise(reductive_ammination_reverse_protonation_test, reductive_ammination_reverse_protonation_test, max_steps, pathway_id, logger, last_action, reaction_steps, db)
        }
    }

})

