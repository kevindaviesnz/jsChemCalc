
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')


const AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse_not_used = (pathways, reaction_steps, mechanism_names, logger) =>{

    try {

        Typecheck(
            {name:"pathways", value:pathways, type:"array"},
            {name:"reaction_steps", value:reaction_steps, type:"array"},
            {name:"mechanism_names", value:mechanism_names, type:"array"},
            {name:"logger", value:logger, type:"object"}
        )

        
                   //  console.log(i)
                //   logger.log('debug', '[Synthesise] Mechanism returned false so end of pathway(s) ' + mechanism_names[i])
                   // logger.log('debug',('[Synthesise] Pathways before adding new pathway').bgRed)

                   // console.log(pathways)

                    reaction_steps.map((reaction_step)=>{
                        // If no pathways create a new pathway and add reaction step to it
                        if (0 ===pathways.length) {
                            pathways.push([reaction_step])
                        } else {

                            // Look for matching steps having the same precursor and chemical
                            let matching_reaction_step_found = _.find(pathways, (pw)=>{
                                //console.log('checking for matching pathway')
                                //console.log('reaction step')
                                //console.log('precursor:' + reaction_step.precursor_substrate_SMILES)
                                //console.log('product:'+reaction_step.chemical_substrate_SMILES)
                                /*
                                console.log(_.find(pw, (r)=>{
                                    console.log('r precursor:'+r.precursor_substrate_SMILES)
                                    console.log('r chemical product:' + r.chemical_substrate_SMILES)
                                    console.log(r.precursor_substrate_SMILES === reaction_step.precursor_substrate_SMILES && r.chemical_substrate_SMILES === reaction_step.chemical_substrate_SMILES)
                                    return r.precursor_substrate_SMILES === reaction_step.precursor_substrate_SMILES && r.chemical_substrate_SMILES === reaction_step.chemical_substrate_SMILES
                                }))
                                */
                                return undefined !==  _.find(pw, (r)=>{
                                    return r.precursor_substrate_SMILES === reaction_step.precursor_substrate_SMILES && r.chemical_substrate_SMILES === reaction_step.chemical_substrate_SMILES
                                })
                            }) !== undefined
                            // Look for reaction step where the precursor is the same as the chemical of the current reaction step
                            // If found add the reaction step to the pathway containing the matching reaction step is in.
                            if (false === matching_reaction_step_found) {
                                pathways.map((pw)=>{
                                    pw.map((r)=>{
                                        if (r.precursor_substrate_SMILES === reaction_step.chemical_substrate_SMILES) {
                                            pw.push(reaction_step)
                                            matching_reaction_step_found = true
                                        }
                                    })
                                    return pw
                                })
                            }
                            if (false === matching_reaction_step_found) {
                                // Create new pathway and add reaction step to it
                                pathways.push([reaction_step])
                            }
                        }
                        return reaction_step
                    })

                   // logger.log('debug',('[Synthesise] Pathways after adding new pathway(s)').bgRed)
                  //  console.log(pathways)
                    
                    /*
                    console.log('Pathways after successfully applying mechanism ' + mechanism_names[i])
                    pathways.map((r_steps)=>{
                        console.log('Pathway')
                        r_steps.map((r)=>{
                            console.log('===>' + r.precursor_substrate_SMILES + ' -> ' + r.chemical_substrate_SMILES + ' ' + r.mechanism)
                            return r
                        })
                        return r_steps
                    })
                    */

    

    } catch(e) {
        logger.log('error', '[AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse] '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = AddPreviousMechanismToReactionStepsAfterCurrentMechanismReturnedFalse_not_used