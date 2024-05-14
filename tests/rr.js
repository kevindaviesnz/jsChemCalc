const MongoClient = require('mongodb').MongoClient


const FindLewisAcidAtom = require('../reflection/LewisAcidAtom')
const FindLewisBaseAtom = require('../reflection/LewisBaseAtom')
const NucleophilicAttack = require('../mechanisms/NucleophilicAttack')
const CarbocationRearrangement = require('../mechanisms/CarbocationRearrangement')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBaseReaction')
const LewisAcidBaseReverse = require('../reactions/LewisAcidBaseReverse')
const AkylShift = require('../mechanisms/AkylShift')
const AkylShiftReverse = require('../mechanisms/AkylShiftReverse')
const BondAtomToAtom = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BreakBondInSameMolecule = require('../mechanisms/BreakBondInSameMolecule')
const BreakBondInSameMoleculeReverse = require('../mechanisms/BreakBondInSameMoleculeReverse')
const Hydrate = require('../mechanisms/Hydrate')
const HydrateReverse = require('../mechanisms/HydrateReverse')
const Reduce = require('../mechanisms/Reduce')
const ReduceReverse = require('../mechanisms/ReduceReverse')
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const HydrideShift = require('../mechanisms/HydrideShift')
const HydrideShiftReverse = require('../mechanisms/HydrideShiftReverse')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const ProtonTransferReverse = require('../mechanisms/ProtonTransferReverse')
const Deprotonate = require('../mechanisms/Deprotonate')
const DeprotonateReverse = require('../mechanisms/DeprotonateReverse')
const Protonate = require('../mechanisms/Protonate')
const ProtonateReverse = require('../mechanisms/ProtonateReverse')
const Distill = require('../mechanisms/Distill')
const Constants = require('../Constants')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBaseReaction')
const AI = require('../AI/AI')
const _ = require('lodash');
const Typecheck = require('../Typecheck')
const OneTwoElimination = require('../mechanisms/OneTwoElimination')
const OneTwoEliminationReverse = require('../mechanisms/OneTwoEliminationReverse')
const OneTwoAddition = require('../mechanisms/OneTwoAddition')
const OneTwoAdditionReverse = require('../mechanisms/OneTwoAdditionReverse')
const CacheClient = require('../cache/CacheClient')
const SN2 = require('../reactions/SN2')
const SN2Reverse = require('../reactions/SN2Reverse')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BondAtomToAtomInSameMoleculeReverse = require('../mechanisms/BondAtomToAtomInSameMoleculeReverse')
const ContainerView = require('../view/Container')
const AtomsFactory = require('../factories/AtomsFactory')
const ShiftBondInSameMoleculeReverse = require('../mechanisms/ShiftBondInSameMoleculeReverse')
const ToGlycol = require('../FunctionalGroupReactions/ToGlycol')
const ToDibromide = require('../FunctionalGroupReactions/ToDibromide')
const ToKetone = require('../FunctionalGroupReactions/ToKetone')
const ToCarboxylicAcid = require('../FunctionalGroupReactions/ToCarboxylicAcid')



const Prototypes = require("../Prototypes")
Prototypes()

console.log('Connecting to database, please wait ...')

// Install using npm install dotenv
require("dotenv").config()

const assert = require('assert');
const winston = require('winston');
const { template } = require('lodash')
const { errorMonitor } = require('events')
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

const env = require('../env')
const path = require('path')

// Establish database connection
//          mongodb+srv://user:<password>@cluster0.awqh6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
const uri = "mongodb+srv://" + env.user + ":" + env.password + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    
const reactionTest = (container, reaction, logger) => {
    try {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "reaction", value: reaction, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )
    
        const mechanism_map = {
            'Deprotonate': DeprotonateReverse,
            'Protonate': ProtonateReverse,
            'LewisAcidBase': LewisAcidBaseReverse,
            'SN2':SN2Reverse,
            'BondAtomToAtomInSameMolecule':BondAtomToAtomInSameMoleculeReverse,
            'ProtonTransfer': ProtonTransferReverse,
            'Reduce': ReduceReverse,
            "AkylShift":AkylShiftReverse,
            "Hydrate":HydrateReverse,
            "BreakBondInSameMolecule":BreakBondInSameMoleculeReverse,
            "OneTwoAddition":OneTwoAdditionReverse,
            'ShiftBondInSameMolecule':ShiftBondInSameMoleculeReverse,
            'ToGlycol':ToGlycol,
            'ToDibromide':ToDibromide,
            'ToKetone':ToKetone,
            'ToCarboxylicAcid':ToCarboxylicAcid
        }
    
        const product = MoleculeFactory(
            AtomsFactory(reaction.steps[reaction.steps.length-1].chemical_substrate_SMILES, logger),
            false,
            false,
            logger
        )
    
        container.addSubstrate(product, 1, logger)
    
        console.log('Synthesising: ')
        console.log(ContainerView(container).SMILES(logger))
    
        reaction.steps.reverse().map((step, i) => {
    
            console.log('STEP: '+(step.index) + ' ' + reaction.reaction_name + ' ' + step.mechanism)
    
            step.starting_reagents.map((reagent_smiles) => {
                const reagent = ["RA:", "B:", "A:", "CB:", "CA:"].indexOf(reagent_smiles) !== -1? reagent_smiles
                :MoleculeFactory(
                    AtomsFactory(reagent_smiles, logger),
                    false,
                    false,
                    logger
                )
                container.addReagent(reagent, 1, logger)
            })

            step.side_products.map((side_product_smiles) => {
                const side_product = MoleculeFactory(
                    AtomsFactory(side_product_smiles, logger),
                    false,
                    false,
                    logger
                )
                container.addSideProduct(side_product, logger)
            })

            // Apply mechanism
            console.log("Running " + step.mechanism)
            const pathways = _.cloneDeep(mechanism_map[step.function](container, logger))

            container = pathways[0][pathways.length-1]
            //container.getSubstrate()[0].smiles_string = container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)
            container.reagents = []

            /*
            if (step.precursor_substrate_SMILES !== container.getSubstrate()[0].smiles_string) {
                logger.log('info', "Expected " + step.precursor_substrate_SMILES + ' but got ' + container.getSubstrate()[0].smiles_string)
                console.log("Expected " + step.precursor_substrate_SMILES + ' but got ' + container.getSubstrate()[0].smiles_string)
                throw new Error('Product does not match the expected product ' + reaction.reaction_name + ' ' + step.mechanism)
            }
            */
    
        })
    
        console.log('Container after running reaction:')
        console.log(ContainerView(container).SMILES(logger))
    
        
    } catch(e) {
        logger.log('error', 'reactionTest() ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}



// Process through reactions
const FetchReactions = (reactions_db, logger) => {


    Typecheck(
        {name: "reactions_db", value: reactions_db, type: "object"},
        {name: "logger", value: logger, type: "object"}
    )

    // @see https://www.guru99.com/mongodb-query-document-using-find.html
    reactions_db.collection('known_reactions').find().forEach((reaction) => {

        console.log("Running reaction " + reaction._id.toString() + ' (' + reaction.reaction_name + ')')

        let container = null

        container = ContainerFactory(null, [], null, logger)
        reactionTest(container, reaction, logger)

    })

}


client.connect(err => {

    try {
        Typecheck(
            {name: "logger", value: logger, type: "object"}
        )
    } catch(e) {
        logger.log('error', e.stack)
        console.log(e.stack)
        process.exit()
    }

    assert.equal(err, null) // Check database connection was successful
    console.log("Database connection successful")
    const db = client.db("chemistry")
    console.log("Fetching reactions")
    FetchReactions(db, logger)


})
