

const Typecheck = require('../Typecheck')
const _ = require('lodash');
const uniqid = require('uniqid');
const FormatAs = require('../factories/FormatAs')
const Constants = require('../Constants')
// Pinacol rearrangement
// Reductive amination (in process)
const ReduceReverse = require('../mechanisms/ReduceReverse')
//const DehydrateReverse = require('../mechanisms/DehydrateReverse')
const BreakBondInSameMoleculeReverse = require('../mechanisms/BreakBondInSameMoleculeReverse')
const OneTwoEliminationReverse = require('../mechanisms/OneTwoEliminationReverse')
const OneTwoAdditionReverse = require('../mechanisms/OneTwoAdditionReverse')
const ProtonTransferReverse = require('../mechanisms/ProtonTransferReverse')
const ProtonationReverse = require('../mechanisms/ProtonateReverse')
const DeprotonationReverse = require('../mechanisms/DeprotonateReverse')
const AkylShiftReverse = require('../mechanisms/AkylShiftReverse')
const DehydrateReverse = require('../mechanisms/DehydrateReverse')
//const AddPathwaysToDatabase = require('../actions/AddPathwaysToDatabase')
const LookupMolecule = require('../actions/LookupMolecule')
const PubChemLookup = require('../actions/LookupPubChem')
const AddReactionStepToDatabase = require('../actions/AddReactionStepToDatabase')
const BondAtomToAtomInSameMoleculeReverse = require('../mechanisms/BondAtomToAtomInSameMoleculeReverse');
const AcidBase = require('../reactions/AcidBase');
const pkl = PubChemLookup((err)=>{
    console.log(err)
    process.exit()
})

const colors = require('colors');
colors.enable()

const Pathways = require('../view/Pathways');
//const PathwaysViewer = Pathways()

const getMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps = require('../actions/GetMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps')

/**
 * 
 * @param {*} container 
 * @param {*} previous_container_state 
 * @param {*} max_steps 
 * @param {*} pathway_id 
 * @param {*} logger 
 * @param {*} last_action 
 * @param {*} reaction_steps 
 * @param {*} db 
 * @param {*} last_mechanism 
 * @param {*} resolve 
 * @returns 
 */
const Synthesise = (synth_id, container, previous_container_state, max_steps, pathways, pathway_number, pathway_id, logger, last_action, reaction_steps, db, last_mechanism, resolve) => {

    try {

        Typecheck(
            {name: "synth_id", value: synth_id, type: "string"},
            {name: "container", value: container, type: "object"},
            {name: "previous_container_state", value: previous_container_state, type: "object"},
            {name: "last_action", value: last_action, type: "function"},
            {name: "pathways", value: pathways, type: "array"},
            {name: "pathway_number", value: pathway_number, type: "string"},
            {name: "pathway_id", value: pathway_id, type: "string"},
            {name: "logger", value: logger, type: "object"},
            {name: "resolve", value: resolve, type: "function"}
        )

        logger.log('info', ("[Synthesise] Copy Max steps: " + max_steps).bgGreen)
        pathway_number = pathway_number + '.0'
    
        // Lookup molecule to synthesise
        let mechanisms = []
    
        // Container will be null if ?
        if (container === null) { // ????
            logger.log('debug', ('[Synthesise] Copy Reaction step was found in database so skipping calculation of next reaction step and terminating pathway.').bgRed)
            mechanisms = []
        } else {
    
            Typecheck(
                {name: "container", value: container, type: "object"},
            )
        
            //logger.log('debug', ('[Synthesise] Synthesising  (last action:' + last_mechanism + ') ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) + ' ' + pathway_id).bgGreen)
    
            const synth = Synthesise
    
            /*
            const mechanisms = [
    
                BreakBondInSameMoleculeReverse,
                ProtonationReverse,
                DeprotonationReverse,
                OneTwoAdditionReverse,
                AkylShiftReverse,
                DehydrateReverse,
                ReduceReverse,
                OneTwoEliminationReverse,
                ProtonTransferReverse,
                BondAtomToAtomInSameMoleculeReverse
    
            ]
            */

            const mechanism_names = [
                'DeprotonateReverse',
                'BondAtomToAtomInSameMoleculeReverse',
                'AkylShiftReverse',
                'DehydrateReverse',
                'ProtonateReverse'
            ]

            const mechanism_reversal_names_map = {
                'deprotonate':'DeprotonateReverse',
                'bond atom to atom':'BondAtomToAtomInSameMoleculeReverse',
                'dehydration':'DehydrateReverse',
                'akyl shift':'AkylShiftReverse',
                'reduction':'ReduceReverse',
                'break bond in same molecule':'BreakBondInSameMoleculeReverse',
                '1,2 addition':'OneTwoAdditionReverse',
                '1,2 elimination':'OneTwoEliminationReverse',
                'protonation':'ProtonateReverse',
                'proton transfer':'ProtonTransferReverse'
            }

            // Run each reverse mechanism in the order listed, filter mechanisms where the last action is not null
            // and the last action is not the same as the current action.
            const mechanisms = [
                DeprotonationReverse,
                BondAtomToAtomInSameMoleculeReverse,
                AkylShiftReverse,
                DehydrateReverse,
                ProtonationReverse
            ].filter((mechanism, i) => {
                if (last_action !== null && last_action.toString() === mechanism.toString()) {
                    //logger.log('info', ('Last action same as current action so not using mechanism ' + mechanism_names[i]).bgRed)
                    //return false
                }
                return true
            })
            
            const mechanism_index = 0

            getMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps(
                synth_id,
                container, 
                previous_container_state,
                last_action,
                mechanisms, 
                mechanism_names, 
                mechanism_index,
                reaction_steps, 
                max_steps,
                pathways,
                pathway_id,
                synth, 
                mechanism_reversal_names_map, 
                pathway_number, 
                db,
                resolve,
                logger
            )


            if (mechanisms.length === 0) {
                logger.log('verbose', 'Synthesising - No usable mechanisms available')
            }

        }
    
        // Mechanisms is an array of promises
        Promise.allSettled(mechanisms)
            .then((values) => {
                values.forEach((val) => {
    //                    console.log(val.status)
    //                    console.log(val.value)
                })
            })
            .catch((err) => {
                console.log(
                    `Promise.allSettled() Failed! \n${err.errorType}: ${err.message}`
                );
            })
            .finally(() => {



                if(pathways.length > 0) {
                    console.log('[Synthesise] Copy Pathways (catch finally):')
                 //   console.log(pathways)
                    Pathways(synth_id, pathways, logger).console()
                    //process.exit()
                }


                //console.log(pathways)
                /*
                pathways.map((r_steps)=>{
                    console.log('Pathway')
                    r_steps.map((r)=>{
                        console.log('===>' + r.precursor_substrate_SMILES + ' -> ' + r.chemical_substrate_SMILES + ' ' + r.mechanism)
                        return r
                    })
                    return r_steps
                })
                */


                if (reaction_steps.length > 0) { // 0
                    try {
                        resolve(reaction_steps, logger)
                       // logger.log('verbose', 'Synthesise(), saving pathways to database (reaction steps count = ' + reaction_steps.length + ')')
                      /*  AddPathwaysToDatabase(db, reaction_steps, logger,(reaction_steps, logger) => {
                            logger.log('verbose', 'Operations for Promise.allSettled() have finished.')
                            const Pathways = require('../view/Pathways')(reaction_steps, logger)
                            Pathways.console()
                            // process.exit()
                        })
                       */
                    } catch(e) {
                        console.log(e)
                        logger.log('verbose', 'Synthesising - ' + e)
                    }
    
                } else {
                    logger.log('verbose', 'Synthesising - ' + 'no pathways found')
                    //resolve()
                    //  process.exit()
                }
            });
    
    //    return container
        return this


    } catch(e) {
        logger.log('error', '[Synthesise] Copy' + e)
        console.log(e.stack)
        process.exit()
    }
}
module.exports = Synthesise