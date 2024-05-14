
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')

const LookupMolecule = require('../actions/LookupMolecule')
const PubChemLookup = require('../actions/LookupPubChem')
const AddReactionStepToDatabase = require('../actions/AddReactionStepToDatabase')
const AddReactionStepToPathway = require('../actions/AddReactionStepToPathway')
const AddReactionStepToReactionSteps = require('../actions/AddReactionStepReactionSteps')
//const AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse = require('../actions/AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse')
const uniqid = require('uniqid');

 const matching_reaction_step_found = (reaction_steps, container) =>{
    const matching_reaction_step = _.find(reaction_steps, (r)=>{
        const matching_reverse_mechanism = mechanism_reversal_names_map[r.mechanism]
        return matching_reverse_mechanism === mechanism_names[i] && r.precursor_substrate_SMILES === container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)
   })
   return undefined !== matching_reaction_step
}

const getPathwaysRecursive = function(pathways, mechanism, mechanism_index) {
    
    return mechanism(

        container, // container_after_previous_mechanism_was_applied
        previous_container_state, // container_before_previous_mechanism_was_applied
        max_steps, // max_steps
        synth, // synth
        pathway_id + '.' + uniqid().substring(uniqid().length - Constants().pathway_id_segment_length, Constants().pathway_id_segment_length), // pathway id
        logger, // logger
        last_action, // last_action
        db, // db
        // onPathwayEndedCallback
        () => {

         //  AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse(logger)
          //  console.log(i)
           //logger.log('info', '[Synthesise] Mechanism returned false so end of pathway(s) ' + mechanism_names[i])
           // logger.log('debug',('[Synthesise] Pathways before adding new pathway').bgRed)
          // AddReactionStepToPathway(pathways, reaction_steps, logger)
            return

           
           
           
        },

    )
}


const GetMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps = (
    synth_id,
    container,
    previous_container_state,
    last_action,
    mechanisms, 
    mechanism_names, 
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
) =>{

    try {

        Typecheck(
            {name: "synth_id", value: synth_id, type: "string"},
            {name: "container", value: container, type: "object"},
            {name: "previous_container_state", value: previous_container_state, type: "object"},
            {name: "last_action", value: last_action, type: "function"},
            {name: "mechanisms", value: mechanisms, type: "array"},
            {name: "mechanism_names", value: mechanism_names, type: "array"},
            {name: "reaction_steps", value: reaction_steps, type: "array"},
            {name: "max_steps", value: max_steps, type: "number"},
            {name: "pathways", value: pathways, type: "array"},
            {name: "pathway_id", value: pathway_id, type: "string"},
            {name: "synth", value: synth, type: "function"},
            {name: "mechanism_reversal_names_map", value: mechanism_reversal_names_map, type: "object"},
            {name: "pathway_number", value: pathway_number, type: "string"},
            {name: "db", value: db, type: "object"},
            {name: "resolve", value: resolve, type: "function"},
            {name: "logger", value: logger, type: "object"},
        )


        // get if pathway number is 0.1 we want the next pathway number to 0.2, and not 0.1.2
        const pathway_numbers = pathway_number.split('.')
        pathway_numbers[pathway_numbers.length-1] = i
        pathway_number = pathway_numbers.join('.')


        // Check for duplicate reaction step
        if (true === matching_reaction_step_found(reaction_steps, container)) {
            return mechanism
        }

        // Run the reverse mechanism. The callback will be applied if the mechanism matching the reverse mechanism (eg if the reverse mechanism
             // is AkylShiftReverse() then the matching mechanism will be AkylShift()) did not return false.
             // Note that synth is called as part of the callback.
             // Important: The container substrate only changes when a recursive call it synth() is made, that is the calls to each mechanism are made
             // asynchronously. 
             // For example if we are trying to synthesise CC(=O)C(C)(C)C then we first call DeprotonateReverse() using CC(=O)C(C)(C)C, and then 
             // we call BondAtomToAtomInSameMoleculeReverse() on CC(=O)C(C)(C)C, and NOT on the result of applying DeprotonateReverse() on CC(=O)C(C)(C)C.

        
        getPathwaysRecursive(pathways, mechanism, mechanism_index)



        // All up, we shouldn't be making a recursive synth call in a loop
        _.cloneDeep(mechanisms).map((mechanism, i) => {

             
             
            return mechanism(
                container, // container_after_previous_mechanism_was_applied
                previous_container_state, // container_before_previous_mechanism_was_applied
                max_steps, // max_steps
                synth, // synth
                pathway_id + '.' + uniqid().substring(uniqid().length - Constants().pathway_id_segment_length, Constants().pathway_id_segment_length), // pathway id
                logger, // logger
                last_action, // last_action
                db, // db
                // onPathwayEndedCallback
                () => {

                 //  AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse(logger)
                  //  console.log(i)
                   //logger.log('info', '[Synthesise] Mechanism returned false so end of pathway(s) ' + mechanism_names[i])
                   // logger.log('debug',('[Synthesise] Pathways before adding new pathway').bgRed)
                   AddReactionStepToPathway(pathways, reaction_steps, logger)

                },
                 // dbCallback
                 (container, mechanism_name, computed_previous_container_state, synth, mechanism, max_steps_copy, pathway_id, logger) => {
     
                     const testing = false
                     //console.log(mechanism_name + ' returned true')
 
                     if (false) {
                         // 
                     } else {

                         //logger.log('info', ('[Synthesise] meahanism ' + mechanism).//.black)
 
                         // ------------------------------------------
                         //  pkl.searchBySMILES(search.replace(/\(\)/g, ""), db, (molecule_from_pubchem) => {
                         // Lookup molecule and add to database if required. We then create a reaction step object
                         // using the current chemical and precursor and add to the reaction steps array.
                         LookupMolecule(db, computed_previous_container_state.substrate.canonicalSmiles(false, computed_previous_container_state.substrate.atoms,logger), "SMILES", logger, PubChemLookup, [pathway_id]).then(
                             // "resolves" callback
                             (parent_chemical) => {
                                 let last_reaction_step = null
                                 LookupMolecule(db, container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger), "SMILES", logger, PubChemLookup).then(
                                     (child_chemical) => {
                                        /*
                                        AddReactionStepToReactionSteps(
                                            container, 
                                            computed_previous_container_state, 
                                            parent_chemical, 
                                            child_chemical,
                                            pathways, 
                                            pathway_id, 
                                            pathway_number, 
                                            mechanism,
                                            mechanism_name,
                                            matching_reaction_step_found,
                                            reaction_steps, 
                                            max_steps_copy,
                                            resolve,
                                            synth,
                                            db,
                                            logger
                                        )
                                        */
                                        let product_canonicalSMILES = container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)
                                        let precursor_canonicalSMILES = computed_previous_container_state.substrate.canonicalSmiles(false, computed_previous_container_state.substrate.atoms,logger)
                                        if (undefined === parent_chemical.CanonicalSMILES) {
                                            parent_chemical = null
                                        }
                                        if (undefined === child_chemical.CanonicalSMILES) {
                                            child_chemical = null
                                        }
                                        const reaction_step = {
                                            'pathway': pathway_id,
                                            'pathway_number':pathway_number,
                                            'mechanism': mechanism_name,
                                            'precursor_substrate_SMILES': precursor_canonicalSMILES,
                                            'chemical_substrate_SMILES': product_canonicalSMILES,
                                            'parent_substrate': parent_chemical,
                                            'child_substrate': child_chemical
                                        }
                                        // AddReactionStepToDatabase = (db, reaction_step, reactionStepFoundCallback, reactionStepAddedCallback)
                                        if (true === matching_reaction_step_found(reaction_steps, container)) {
                                            return
                                        }
                                        if ('dehydration' === reaction_step.mechanism && 'dehydration' === reaction_steps[reaction_steps.length-1].mechansism) {
                                            logger.log('info', ('[Synthesise] GetMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps() Not adding reaction step as it is dehydration and last reaction step was dehydration').bgRed)
                                        } else {
                                            const previous_reaction_step = reaction_steps[reaction_steps.length-1]
                                            if ('dehydration' === reaction_step.mechanism && 'dehydration' === previous_reaction_step.mechanism) {
                                            } else if (undefined !== reaction_step && undefined !== previous_reaction_step && 'deprotonate' === reaction_step.mechanism && 'protonation' === previous_reaction_step.mechanism) {
                                            } else if ('protonation' === reaction_step.mechanism && 'deprotonate' === previous_reaction_step.mechanism) {
                                            } else  {
                                                reaction_steps.push(reaction_step)
                                                last_reaction_step = reaction_step
                                            }
                                        }
                                        if (false) {
                                            return synth(computed_previous_container_state, container, max_steps_copy, pathway_id, logger, mechanism, reaction_steps, db, mechanism_name, resolve)
                                        } else {
                                            AddReactionStepToDatabase(
                                                db,
                                                logger,
                                                reaction_step,
                                                () => {
                                                    return synth(uniqid(), null, previous_container_state, max_steps, pathways, pathway_id, logger, last_action, reaction_steps, db, last_mechanism, resolve)
                                                },
                                                () => {
                                                    if (true === matching_reaction_step_found(reaction_steps, container)) {
                                                    } else {
                                                      //  console.log('Added reaction step 2')
                                                       // reaction_steps.push(reaction_step)
                                                    }
                                                  return synth(uniqid(), computed_previous_container_state, container, max_steps_copy--, pathways, pathway_number, pathway_id, logger, mechanism, reaction_steps, db, mechanism_name, resolve)
                                                }
                                            )
                                        }

                                     },
                                     // Error
                                     (err) => {
                                         console.log('Failed to lookup molecule (child substrate)')
                                         console.log(err)
                                         process.exit()
                                     }
                                 )
                             },
                             // Error
                             (err) => {
                                 console.log('Failed to lookup molecule (parent substrate)')
                                 console.log(err)
                                 process.exit()
                             }
                         )
                         //---------------------------------------------------------
 
                     }
 
                 }
             )
         }) // end map

    } catch(e) {
        logger.log('error', '[GetMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps] '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = GetMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps