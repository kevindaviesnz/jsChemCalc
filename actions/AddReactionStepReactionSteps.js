
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')

const AddReactionStepToDatabase = require('../actions/AddReactionStepToDatabase')

const AddReactionStepToReactionSteps_remove = (
    container, 
    computed_previous_container, 
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
    synth,
    resolve,
    db,
    logger
) =>{

    try {

        Typecheck(
            {name:"container", value: container, type:"object"},
            {name:"computed_previous_container", value: computed_previous_container, type:"object"},
            {name:"parent_chemical", value: parent_chemical, type:"object"},
            {name:"child_chemical", value: child_chemical, type:"object"},
            {name:"pathways", value: pathways, type:"array"},
            {name:"pathway_id", value: pathway_id, type:"string"},
            {name:"pathway_number", value: pathway_number, type:"string"},
            {name:"mechanism", value: mechanism, type:"function"},
            {name:"mechanism_name", value: mechanism_name, type:"string"},
            {name:"matching_reaction_step_found", value: matching_reaction_step_found, type:"boolean"},
            {name:"reaction_steps", value: reaction_steps, type:"array"},
            {name:"max_steps_copy", value:max_steps_copy, type:"number"},
            {name:"synth", value:synth, type:"function"},
            {name:"resolve", value:resolve, type:"function"},
            {name:"db", value:db, type:"object"},
            {name:"logger", value:logger, type:"object"}
        )

        let product_canonicalSMILES = FormatAs(container.getSubstrate()[0]).SMILES(logger)
        let precursor_canonicalSMILES = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)
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
            logger.log('info', ('[AddReactionStepToReactionSteps] Not adding reaction step as it is dehydration and last reaction step was dehydration').bgRed)
        } else {
            console.log('[AddReactionStepToReactionSteps] Reaction steps before adding reaction step ' + reaction_step.mechanism)
            reaction_steps.map((reaction_step)=>{
                console.log(reaction_step.mechanism)
            })
            reaction_steps.push(reaction_step)
            last_reaction_step = reaction_step
            console.log('[AddReactionStepToReactionSteps] Reaction steps before after reaction step ' + reaction_step.mechanism)
            reaction_steps.map((reaction_step)=>{
                console.log(reaction_step.mechanism)
            })
        }
        if (false) {
            return synth(computed_previous_container, container, max_steps_copy, pathway_id, logger, mechanism, reaction_steps, db, mechanism_name, resolve)
        } else {
            AddReactionStepToDatabase(
                db,
                logger,
                reaction_step,
                () => {
                    return synth(null, previous_container, max_steps, pathways, pathway_id, logger, last_action, reaction_steps, db, last_mechanism, resolve)
                },
                () => {
                    if (true === matching_reaction_step_found(reaction_steps, container)) {
                    } else {
                      //  console.log('Added reaction step 2')
                       // reaction_steps.push(reaction_step)
                    }
                  return synth(computed_previous_container, container, max_steps_copy, pathways, pathway_number, pathway_id, logger, mechanism, reaction_steps, db, mechanism_name, resolve)
                }
            )
        }
        //return synth(computed_previous_container, container, max_steps_copy, pathway_id, logger, mechanism, reaction_steps, db, mechanism_name, resolve)

    } catch(e) {
        logger.log('error', '[AddReactionStepToReactionSteps] '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = AddReactionStepToReactionSteps_remove