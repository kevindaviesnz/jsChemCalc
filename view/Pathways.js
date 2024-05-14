
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const Pathway = require('./Pathway')
const PubChemLookup = require('../actions/LookupPubChem')
const LookupMolecule = require('../actions/LookupMolecule')

 // https://stackoverflow.com/questions/14249506/how-can-i-wait-in-node-js-javascript-l-need-to-pause-for-a-period-of-time
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
const sleep = require('atomic-sleep');
const { terminal } = require('terminal-kit');
const { reject } = require('lodash');
const term = require( 'terminal-kit' ).terminal
  
const Pathways = (synth_id, pathways, logger, strict, db) => {

    try {

        Typecheck(
            {name: "synth_id", value: synth_id, type: "string"},
            {name: "pathways", value: pathways, type: "array"},
            {name: "logger", value: logger, type: "object"},
            {name: "strict", value: strict, type: "boolean"},
            {name: "db", value: db, type: "object"},
        )
    

        const JSON = function() {
    
        }

        // Filter any pathways that are empty
        pathways = pathways.filter((pathway)=>{
            return null !== pathway && pathway.length > 0
        })

        async function validatePathwayRecursive (pathway, container_index) {
            if (undefined === pathway[container_index]) {
                return null
            }
            if (undefined !== pathway[container_index].substrate.smiles_string) {
                pathway[container_index].substrate.smiles_string = pathway[container_index].substrate.canonicalSmiles(false, pathway[container_index].substrate.atoms,logger)
            }
            if (-1 !== pathway[container_index].substrate.smiles_string.indexOf('-')|| -1 !== pathway[container_index].substrate.smiles_string.indexOf('+')) {
                validatePathwayRecursive(pathway, container_index+1)
            } else  {
                const chemical = await LookupMolecule(db, pathway[container_index].substrate.smiles_string, "SMILES", logger, PubChemLookup)
                if (undefined !== chemical['IUPACName'] && '' !== chemical['IUPACName']) {
                    pathway[container_index].substrate['IUPACName'] = chemical['IUPACName']
                    return pathway.splice(container_index)
                } else {
                    validatePathwayRecursive(pathway, container_index+1)
                }
            }
        }

        async function Console() {

            let i = 0
            term.eraseLine()

            // Each pathway is an array of containers, each with a mechanism property.
            // The numbers over or under the reaction arrow indicate separate steps.
            // When no numbers are present over (or under the arrow); this indicates that
            // the reagents are all added togehter in the same pot.
            let starting_pathway = pathways[0].filter((c)=>{
                return c !== null
            })

            let current_pathway = undefined

            do {
                
                current_pathway = pathways[0]
                
                let current_pathway_validated = current_pathway
                if (strict) {
                    current_pathway_validated = validatePathwayRecursive(current_pathway_validated, 0)
                }

                // Remove containers where the reagents are the same as in the previous container

                const steps = current_pathway_validated.reduce((carry, container, i)=>{
                    if (i === current_pathway.length -1 || carry.length === 0 || !_.isEqual(container.reagents, current_pathway[i-1].reagents)) {
                        carry.push(container)
                    }
                    return carry
                }, [])

                const first_container = steps[0]
                const starting_substrate = first_container.getSubstrate()[0] 
                const starting_reagents = first_container.reagents
                
                // Output pathway
                let p = starting_substrate.canonicalSmiles(false, starting_substrate.atoms, logger)
                let step_number = 1
                
                if (starting_reagents.length > 0) {
                   p =  p + ' ' + step_number + '.'  +  first_container.renderReagentsAsSmiles() + './'
                }

                for(let i=1;i<steps.length;i++) {
                    if (i === steps.length -1) {
                        const product_substrate = steps[i].substrate
                        p = p + ' >>> ' + product_substrate.canonicalSmiles(false, product_substrate.atoms, logger)
                        if (steps[i].side_products.length > 0) {
                            p = p + ' + ' + steps[i].side_products
                        }
                    } else {
                        const reagents_smiles = steps[i].renderReagentsAsSmiles()
                        p = p + (step_number+i) + '.' + reagents_smiles + '.'
                    }
                }

                console.log(p)

                pathways.shift()

            } while(pathways.length > 0)
            
            // Only show pathway if it starts with a known compound.

            

            
            /*
            else if (starting_pathway_validated.length > 2) {
                for (let i=1;i<starting_pathway_validated.length;i++) { // pathways[0] is the next pathway
                    const container = starting_pathway_validated[i]
                    p = p + (step_number + i) + '. ' + container.renderReagentsAsSmiles() + ','
                }
            }*/

            // Remove the first pathway
           


           
            
        }

    
        return {
            'JSON':JSON,
            'console':Console
        }
    
    } catch(e) {
        logger.log('error', '[view/Pathways] ' + e.stack)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = Pathways