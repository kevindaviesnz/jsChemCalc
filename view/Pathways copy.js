
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const Pathway = require('./Pathway')

const Pathways = (reaction_steps, logger) => {

    Typecheck(
        {name: "reaction_steps", value: reaction_steps, type: "array"},
    )

    const JSON = function() {

    }


    const Console = function() {

/*
/*
SET pathways to array
Extract reaction_steps where the last element of the reaction_step property is unique.
 reaction_step: '42g5a.42ps1.42qex.42sfj',
 FOR EACH of reaction step
      SET pathway to array
      GET reaction step elements by splitting reaction step property by '.' and reverse
      FOR EACH reaction step element
          FIND reaction step where the reaction step property last element matches the current reaction step element
          ADD reaction step to pathway
      END FOR
      ADD pathway to pathways
 END FOR
 */

        logger.log('debug', 'Pathways->Console() Rendering pathways')

        try {

            const pathways = []

            // Extract reaction_steps where the last element of the reaction_step property is not
            // in any of the other pathways.
            const distinct_reaction_steps = _.filter(_.cloneDeep(reaction_steps), (current_reaction_step)=>{
                // Get last element of the pathway
                const current_reaction_step_element = current_reaction_step.pathway.split('.').pop()
                // Check if the last element is in any of the other pathways but don't
                // match on the last element or the other pathways. If so, then
                // don't include the reaction step.
                const element_is_used = _.findIndex(reaction_steps, (reaction_step)=>{
                    if (reaction_step.pathway === current_reaction_step.pathway) {
                        return false
                    }
                    const reaction_step_pathway_elements = reaction_step.pathway.split('.')
                    reaction_step_pathway_elements.pop()
                    return reaction_step_pathway_elements.indexOf(current_reaction_step_element) !==-1
                })
                return element_is_used === -1
            })


/*
 FOR EACH of reaction step
      SET pathway to array
      GET reaction step elements by splitting reaction step property by '.' and reverse
      FOR EACH reaction step element
          FIND reaction step where the reaction step property last element matches the current reaction step element
          ADD reaction step to pathway
      END FOR
      ADD pathway to pathways
 END FOR
 */
            distinct_reaction_steps.map((reaction_step, i )=>{
                const pathway_reaction_steps = []
                //  pathway: '42g5a.42ija.42jtk.42lvf',
                // [ '42lvf', '42jtk', '42ija', '42g5a' ]
                const pathway_elements = reaction_step.pathway.split('.').reverse()
                pathway_reaction_steps.push(reaction_step)
                pathway_elements.map((pathway_element)=>{
                    const matched_reaction_step = _.find(reaction_steps, (reaction_step_to_match)=>{
                        if (reaction_step_to_match.pathway === reaction_step.pathway) {
                            return false
                        }
                        const pathway_element_to_match = reaction_step_to_match.pathway.split('.').pop()
                        return pathway_element === pathway_element_to_match
                    })
                    if (matched_reaction_step!==undefined) {
                        pathway_reaction_steps.push(matched_reaction_step)
                    }
                })
                Pathway(pathway_reaction_steps).console(i+1)
            })


        } catch(e) {
            console.log(e)
            process.exit()
        }

        return true

    }

    return {
        'JSON':JSON,
        'console':Console
    }

}

module.exports = Pathways