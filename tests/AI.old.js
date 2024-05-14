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
const Constants = require('../Constants')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const AtomFactory = require('../factories/AtomFactory')
const Log = require('../Log')
const AI = require('../AI/AI')
const _ = require('lodash');
const Typecheck = require('../Typecheck')


// https://www.npmjs.com/package/winston
const winston = require('winston');

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
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});



console.log('Connecting to database, please wait ...')

// Install using npm install dotenv
require("dotenv").config()

const assert = require('assert');
const AtomsFactory = require('../factories/AtomsFactory')

const uri = "mongodb+srv://" + process.env.MONGODBUSER + ":" + process.env.MONGODBPASSWORD + "@cluster0.awqh6.mongodb.net/chemistry?retryWrites=true&w=majority";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {

    assert.equal(err, null) // Check database connection was successful

    const db = client.db("chemistry")

    console.log("Database connection successful")


    // Process through reactions
    const FetchReactions = (reactions_db, logger)=> {


        // @see https://www.guru99.com/mongodb-query-document-using-find.html
        reactions_db.collection('known_reactions').find().forEach((reaction)=>{

            /*
            {
              _id: new ObjectId("5ffe76f9aa57e37f1739664a"),
              reaction: 'pinacol Rearrangement',
              substrate: { name: 'pinacol', smiles: 'CC(C)(C(C)(C)O)O' },
              reagents: [ { name: 'strong acid', smiles: 'SA' } ],
              products: [ { name: 'pinacolone', smiles: 'CC(=O)C(C)(C)C' } ]
            }
            {
              _id: new ObjectId("62366f6d98f7c423842ef82d"),
              reaction: 'acid base',
              substrate: { name: 'sulphuric acid', smiles: 'OS(=O)(=O)O' },
              reagents: [ [ [Object] ] ],
              products: [alkylShiftTest
                { name: 'hydrogen sulfate', smiles: 'OS(=O)(=O)[O-]' }
                { name: 'hydronium', smiles: '[O+]' }
              ]
            }
*/
            Log("Running reaction " +reaction._id.toString() + ' (' + reaction.reaction + ')')

            // Create container and add reaction substrate etc.
            const substrate = MoleculeFactory(AtomsFactory(reaction.substrate.smiles, logger), logger)
            const solvent = reaction.solvent === null || reaction.solvent === undefined?null:MoleculeFactory(AtomsFactory(reaction.solvent.smiles, logger),logger)
            const reagents = reaction.reagents.map((row)=>{
                return row.map((reagent)=>{
                    return  MoleculeFactory(AtomsFactory(reagent['smiles'], logger), logger)
                })
            })

            const container = ContainerFactory(substrate, reagents, null, null)


            switch(reaction.reaction) {
                case 'acid base (proton)':
                    //console.log("Doing acid base reaction (proton)")
//                    acidBaseReactionProtonTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'acid base (electron pair share)':
                    //console.log("Doing acid base reaction (electron pair share)")
  //                  acidBaseReactionElectronPairShareTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'proton transfer':
                    //console.log("Doing proton transfer")
            //        protonTransferTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'carbocation rearrangement (hydride shift)':
                    // console.log("Doing carbocation rearrangement (hydride shift)")
                   // hydrideShiftTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'carbocation rearrangement (akyl shift)':
                    //console.log("Doing carbocation rearrangement (akyl shift)")
          //          alkylShiftTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'leaving group removal':
                    //console.log("Doing leaving group removal")
//                    leavingGroupRemovalTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'protonation':
                    //console.log("Doing protonation")
        //            protonationTest(_.cloneDeep(container), _.cloneDeep(reaction.products))
                    break
                case 'pinacol rearrangement':



                    if (true) {

                        const pa_container_copy = _.cloneDeep(container)
                        pa_container_copy.removeReagent('*')
                        const proton_molecule = MoleculeFactory(AtomsFactory("[H+]", logger),logger)
                        pa_container_copy.reagents.push([proton_molecule])


                        AI(pa_container_copy, [])

                        try {
                            if(FormatAs(pa_container_copy.substrate).SMILES(logger)!=='CC(C)(C)C(=[O+])C') {
                                throw new Error('Incorrect return from pinacol rearrangement')
                            }
                            console.log(' - Pinacol rearrangement AI (part 1) [OK]')
                        } catch(e) {
                            console.log('Expected: '+'CC(C)(C)C(=[O+])C')
                            console.log('Actual:' + FormatAs(pa_container_copy.substrate).SMILES(logger))
                            console.log(e)
                        }

                        // Add base reagent
                        pa_container_copy.removeReagent('*')
                        pa_container_copy.reagents.push(['B:'])
                        AI(pa_container_copy, [])

                        try {
                            if(FormatAs(pa_container_copy.substrate).SMILES(logger)!=='CC(C)(C)C(=O)C') {
                                throw new Error('Incorrect return from pinacol rearrangement')
                            }
                            console.log(' - Pinacol rearrangement (part 2) AI [OK]')
                        } catch(e) {
                            console.log('Expected: '+'CC(C)(C)C(=O)C')
                            console.log('Actual:' + FormatAs(pa_container_copy.substrate).SMILES(logger))
                            console.log(e)
                        }

                        //process.exit()
                        //pinacolRearrangementTest(container, reaction)

                    }
                    break

                case 'reductive amination':

                    console.log('Reductive amination')

                    // Here the only thing we should do is protonate
                    const ra_container_copy = _.cloneDeep(container)
                    ra_container_copy.removeReagent('*')
                    const proton_molecule = MoleculeFactory(AtomsFactory("[H+]", logger))
                    ra_container_copy.reagents.push([proton_molecule])

                    /*
                    console.log('Starting substrate:')
                    console.log(FormatAs(ra_container_copy.substrate).SMILES(logger))
                    console.log("Reagents")
                    console.log(ra_container_copy.reagents)
                    process.exit()
*/

                    AI(ra_container_copy, [])

                    try {
                        if(FormatAs(ra_container_copy.substrate).SMILES(logger)!=='CC(C)=[O+]') {
                            throw new Error('Incorrect return from Protonate when reductive amination')
                        }
                        console.log(' - Reductive amination (part 1) AI [OK]')
                    } catch(e) {
                        console.log('Expected: '+'CC(C)=[O+]')
                        console.log('Actual:' + FormatAs(ra_container_copy.substrate).SMILES(logger))
                        console.log(e)
                    }

                   // console.log('Starting substrate after protonation:')
                   // console.log(FormatAs(ra_container_copy.substrate).SMILES(logger))
                   // process.exit()


                    ra_container_copy.removeReagent('*')

                    // Lewis,
                    // Add methylamine (amine) to container
                    const methylamine = MoleculeFactory(AtomsFactory('CN', logger),logger)
                    ra_container_copy.reagents =[]
                    ra_container_copy.reagents[0] = []
                    ra_container_copy.reagents[0].push(methylamine)

                    AI(ra_container_copy,[])

                    try {
                        if(FormatAs(ra_container_copy.substrate).SMILES(logger)!=='C[N+]=C(C)C') {
                            throw new Error('Incorrect return from reductive ammination AI (part 2')
                        }
                        console.log(' - Reductive amination (part 2) AI [OK]')
                    } catch(e) {
                        console.log('Expected: '+'C[N+]=C(C)C')
                        console.log('Actual:' + FormatAs(ra_container_copy.substrate).SMILES(logger))
                        console.log(e)
                    }

                    ra_container_copy.reagents[1] = []
                    ra_container_copy.reagents[1].push('RA:')

                    AI(ra_container_copy,[])

                    try {
                        if(FormatAs(ra_container_copy.substrate).SMILES(logger)!=='CNC(C)C') {
                            throw new Error('Incorrect return from reductive ammination AI (part 2')
                        }
                        console.log(' - Reductive amination (part 3) AI [OK]')
                    } catch(e) {
                        console.log('Expected: '+'CNC(C)C')
                        console.log('Actual:' + FormatAs(ra_container_copy.substrate).SMILES(logger))
                        console.log(e)
                    }

                    console.log('Reductive ammination AI [OK]')
                    break

                case 'ritter reaction':
    //                ritterReactionTest(container, reaction)
                    console.log('Ritter AI')

                    const ritter_container_copy = _.cloneDeep(container)
                    ritter_container_copy.removeReagent('*')
                    const acetonitrile = MoleculeFactory(AtomsFactory("CC#N", logger),logger)
                    ritter_container_copy.reagents.push([acetonitrile])

                    AI(ritter_container_copy,[])

                    try {
                        if(FormatAs(ritter_container_copy.substrate).SMILES(logger)!=='CC#[N+]C(C)(C)C') {
                            throw new Error('Incorrect return from Ritter ')
                        }
                        console.log(' - Ritter AI (Part 1) [OK]')
                    } catch(e) {
                        console.log('Expected: '+'CC#[N+]C(C)(C)C')
                        console.log('Actual:' + FormatAs(ritter_container_copy.substrate).SMILES(logger))
                        console.log(e)
                    }

                    ritter_container_copy.removeReagent('*')
                    //ritter_container_copy.reagents.push(['B:'])
                    const water = MoleculeFactory(AtomsFactoryt("O"),logger)
                    ritter_container_copy.reagents.push([water])

                    //console.log(container.lookUpReagent(water))
                    //progress.error()

                    AI(ritter_container_copy,[])

                    try {
                        if(FormatAs(ritter_container_copy.substrate).SMILES(logger)!=='CC(=O)NC(C)(C)C') {
                            throw new Error('Incorrect return from Ritter ')
                        }
                        console.log(' - Ritter AI (Part 2) [OK]')
                    } catch(e) {
                        logger.log('error', e.stack)
                        console.log('Expected: '+'CC(=O)NC(C)(C)C')
                        console.log('Actual:' + FormatAs(ritter_container_copy.substrate).SMILES(logger))
                        console.log(e)
                        process.exit()
                    }



                    break
            }



        })

    }

    console.log("Fetching reactions (AI)")


    FetchReactions(db)


})