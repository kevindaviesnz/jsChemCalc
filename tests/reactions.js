const MongoClient = require('mongodb').MongoClient


const FindLewisAcidAtom = require('../reflection/LewisAcidAtom')
const FindLewisBaseAtom = require('../reflection/LewisBaseAtom')
const NucleophilicAttack = require('../mechanisms/NucleophilicAttack')
const CarbocationRearrangement = require('../mechanisms/CarbocationRearrangement')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBaseReaction')
const AkylShift = require('../mechanisms/AkylShift')
const BondAtomToAtom = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BreakBond = require('../mechanisms/BreakBondInSameMolecule')
const Hydrate = require('../mechanisms/Hydrate')
const Reduce = require('../mechanisms/Reduce')
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const HydrideShift = require('../mechanisms/HydrideShift')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const Deprotonate = require('../mechanisms/Deprotonate')
const Protonate = require('../mechanisms/Protonate')
const Distill = require('../mechanisms/Distill')
const Constants = require('../Constants')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBaseReaction')
const AI = require('../AI/AI')
const _ = require('lodash');
const Typecheck = require('../Typecheck')
const OneTwoElimination = require('../mechanisms/OneTwoElimination')
const OneTwoAddition = require('../mechanisms/OneTwoAddition')
const CacheClient = require('../cache/CacheClient')
const SN2 = require('../reactions/SN2')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const ContainerView = require('../view/Container')
const AtomsFactory = require('../factories/AtomsFactory')


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


if (false) {
    
    try {
        let s = "CCC[C-][P+](C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3"
        s = "CCC[C-][P+](C1=CC=CC=C1)(C2=CC=CC=C2)ONBr"
        s = 'C(N)BrO'
        s = 'C1=CC=CC=C1'
        s = 'Br(C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3'
        s = 'CCl(FC1=BC2=I(C=F1)OCBr2)(NC)'
        s = 'CC(CC1=CC2=C(C=C1)OCO2)NC'
        s = "CCC[C-][P+](C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3"
        s = 'CC(CC1=CC2=C(C=C1)OCO2)NC'
        s = "CC(CC1=CC=CC=C1)NC"
        s= "CC(C)(C)C(C)=O"
        s="CC(C(=[O+])C)(C)C"
        s= "CC(C)(C)[N+]#CC"
        s = "C1=CC=C2Cl(=Br1)C(=O)NC2=O"
        //   C1=CC=C2Cl(Br1)C(=O)NC2=O
        s = 'O=C([N-]2)C1=CC=CC=C1C2=O'
        s = 'O=C(N2)C1=CC=CC=C1C2=O'
        s = 'O=C([N-]2[K+])C1=CC=CC=C1C2=O'
        
        s = 'O=C([N-]2[K+])C1=CC=CC=C1C2=O'
        
        //   O=C(N2[K+])C1=CC=CC=C1C2=O
      //  s = '[K+]O'
        //   O=C([N-]2[K+])C1=CC=CC=C1C2=O
        //s = 'O=C(N2[K+])C1=CC=CC=C1C2=O'
        s = '[K+][O-]'
  //      s = '[K+]O' // Does not exist
        
        //s = '[K+]Br'
        s = '[O-]'
        s = 'O=C([N-]2[K+])C1=CC=CC=C1C2=O'
        s = '[C-](CCC)[P+](C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3'
     // s - '[C-](CCC)[P+](C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C'   
     s = 'O=[P](C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3'
     s = 'C(O[P](CCCC)(C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3)CC'
     //    C(O[P](CCCC)(C1=CC=CC=C1)(C2=CC=CC=C2)C3=CC=CC=C3)CC
        console.log(s)

      const atoms = AtomsFactory(s, logger)
        
        atoms.map((a)=>{
           // console.log(a)
            return a
        })
        //throw new Error('testing')
        //console.log('reactions atoms')
        /*
        atoms.map((a)=>{
            if (a.atomicSymbol!=='H') {
                console.log(a)
            }
            return a
        })
        */
        //throw new Error('testing')
        const m = MoleculeFactory(
            atoms,
            logger
        )
            
        if (s !== m.canonicalSmiles) {
            throw new Error('Molecule should be ' + s + ' but got ' + m.canonicalSmiles)
        }
        console.log(m.canonicalSmiles)
        throw new Error('Success')

    } catch(e) {
        logger.log('error', 'Reactions testing - specific test (Wittig) ' + e)
        console.log(e.stack)
        process.exit()
    }
    
}

const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    
const reactionTest = (container, reaction) => {
    // @see JSON/gabrielsynthesis.json
// @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Supplemental_Modules_(Organic_Chemistry)/Amines/Synthesis_of_Amines/Gabriel_Synthesis


    try {


        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )
    
        const mechanism_map = {
            'deprotonation': Deprotonate,
            'protonation': Protonate,
            'lewis acid base': LewisAcidBaseReaction,
            'SN2':SN2,
            'bond':BondAtomToAtomInSameMolecule,
            'proton transfer': ProtonTransfer,
            'bronsted lowery acid base': BronstedLoweryAcidBase,
            'reduction': Reduce,
            "leaving group removal":LeavingGroupRemoval,
            "alkyl shift":AkylShift,
            "hydrate":Hydrate,
            "distill":Distill,
            "break bond":BreakBond
        }
    
         
        const substrate = MoleculeFactory(
            AtomsFactory(reaction.steps[0].precursor_substrate_SMILES, logger),
            logger
        )
    
        container.addSubstrate(substrate, 1, logger)
    
        console.log('Container after running reaction:')
        console.log(ContainerView(container).SMILES(logger))
    
        reaction.steps.map((step, i) => {
    
    
            try {
                if (undefined === mechanism_map[step.mechanism]) {
                    console.log(step)
                    throw new Error('Mechanism ' + step.mechanism + ' has not been defined.')
                }
            } catch (e) {
                console.log(e)
                process.exit()
            }
    
            console.log('STEP: '+(step.index) + ' ' + reaction.reaction_name + ' ' + step.mechanism)
    
            console.log(step)
    
            if (null === container.reagents) {
                container.reagents = []
            }

            step.starting_reagents.map((reagent_smiles) => {
                try {
                    const reagent = ["RA:", "B:", "A:", "CB:", "CA:"].indexOf(reagent_smiles) !== -1? reagent_smiles
                    :MoleculeFactory(
                        AtomsFactory(reagent_smiles, logger),
                        logger
                    )
                   container.addReagent(reagent, 1, logger)

                   //throw new Error('Testing')
                } catch (e) {
                    logger.log('error', 'Reactions testing ' + e)
                    logger.log('error', reagent_smiles)
                    console.log(e.stack)
                    process.exit()
                }
            })
    

            const reagents_at_start_of_step = container.reagents.map((reagent)=>{
                return reagent.canonicalSmiles
            })
            logger.log('info', 'Reagents at start of reaction step ' + step.index + ' ' + reagents_at_start_of_step)
            
            // Apply mechanism
            console.log("Running " + step.mechanism)
            mechanism_map[step.mechanism](container, logger)


    
            if (step.chemical_substrate_SMILES !== container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) {
                logger.log('info', "Expected " + step.chemical_substrate_SMILES + ' but got ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger))
                //console.log("Atoms after applying "+step.index+step.mechanism)
                container.getSubstrate()[0].atoms.map((a)=>{
                    if(a.atomicSymbol!=='H') {
                        //console.log(a)
                    }
                    return a
                })
                console.log(container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)Debug)
                throw new Error('Product does not match the expected product ' + reaction.reaction_name + ' ' + step.mechanism)
            }
    
            const reagents_smiles = container.reagents.map((reagent, i) => {
                return reagent.canonicalSmiles === undefined?reagent:reagent.canonicalSmiles
            })

            logger.log('info', 'Reagents at end of reaction step ' + step.index + ' ' + reagents_smiles)

            if (!_.isEqual(reagents_smiles, step.end_reagents[step.index])) {
                logger.log('error', 'Expected reagents to be ' + step.end_reagents[step.index])
                throw new Error('Expected reagents do not match')
            }
    
        }
        )
    
    
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

        switch (reaction.reaction_name) {

            case 'pinacol rearrangement':
                container = ContainerFactory(null, [], null, logger)
                reactionTest(container, reaction)
                break
            case 'reductive amination':
               container = ContainerFactory(null, [], null, logger)
               reactionTest(container,reaction)
                break
            case 'gabriel synthesis':
                // See JSON/gabrielsynthesis.json
               container = ContainerFactory(null, [], null, logger)
                reactionTest(container, reaction)
                break
            case 'ritter reaction':
                container = ContainerFactory(null, [], null, logger)
                reactionTest(container, reaction, logger)
                break
             case 'wittig reaction':
                container = ContainerFactory(null, [], null, logger)
              reactionTest(container, reaction, logger)
                break
                    
        }

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

    try {
        assert.equal(err, null) // Check database connection was successful
        console.log("Database connection successful")
        const db = client.db("chemistry")
        console.log("Fetching reactions")
        FetchReactions(db, logger)
    } catch (e) {
        console.log('Could not connect to database. Using cache instead')
        const db = new CacheClient().db('chemistry')
        console.log("Fetching reactions cached")
        FetchReactions(db, logger)
        // reactions_db.collection('known_reactions').find().forEach((reaction)
        /*
        new CacheClient().db('chemistry').collection('known_reactions').find().forEach((reaction)=>{
            console.log('Reaction:')
            console.log(reaction)
        })
         */
    }

})
