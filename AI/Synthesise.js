

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
const OneTwoAdditionReverse = require('../mechanisms/OneTwoAdditionReverse.old')
const ProtonTransferReverse = require('../mechanisms/ProtonTransferReverse')
const ProtonationReverse = require('../mechanisms/ProtonateReverse')
const DeprotonationReverse = require('../mechanisms/DeprotonateReverse')
const AkylShiftReverse = require('../mechanisms/AkylShiftReverse')
const HydrideShiftReverse = require('../mechanisms/HydrideShiftReverse')
const DehydrateReverse = require('../mechanisms/DehydrateReverse')
const E1Reverse = require('../reactions/E1Reverse')
const HydrateReverse = require('../mechanisms/HydrateReverse')
//const AddPathwaysToDatabase = require('../actions/AddPathwaysToDatabase')
const LookupMolecule = require('../actions/LookupMolecule')
const PubChemLookup = require('../actions/LookupPubChem')
const AddReactionStepToDatabase = require('../actions/AddReactionStepToDatabase')
const BondAtomToAtomInSameMoleculeReverse = require('../mechanisms/BondAtomToAtomInSameMoleculeReverse');
const AcidBase = require('../reactions/AcidBase');
const LewisAcidBaseReverse = require('../reactions/LewisAcidBaseReverse')
const OxidiseReverse = require('../mechanisms/OxidationReverse')
const OxymercurationReverse = require('../reactions/OxymercurationReverse')
const ReductiveAminationReverse = require('../reactions/ReductiveAminationReverse')
const PinacolRearrangementReverse = require('../reactions/PinacolRearrangementReverse')
const RitterReverse = require('../reactions/RitterReverse')

const pkl = PubChemLookup((err)=>{
    console.log(err)
    process.exit()
})

const colors = require('colors');
colors.enable()

const Pathways = require('../view/Pathways');
//const PathwaysViewer = Pathways()

const getMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps = require('../actions/GetMechanismThatCouldHaveBeenUsedToGetCurrentSubstrateAndAddToReactionSteps');
const Reverse = require('../mechanisms/Reverse');
const { Br, C } = require('../factories/PeriodicTable');
const { rest, first } = require('lodash');
const ENV = require('../env');
const HydrohalicAcidAdditionOnDoubleBondReverse = require('../reactions/HydrohalicAcidAdditionOnDoubleBondReverse');
const MoleculeFactory = require('../factories/MoleculeFactory');
const FindAlkeneCarbonAtoms = require('../actions/FindAlkeneCarbonAtoms');

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

const term = require( 'terminal-kit' ).terminal ;

const used_smiles = []

let cursor = '/'


const mergePathways = (pathways) => {
    // Remove the null from the start of each pathway

    let matching_pathway_found = null

    do {
        // Get the first pathway
        matching_pathway_found = false
        const first_pathway = pathways[0]
        // Look for a pathway where the last containers match the containers in the first pathway, and in order.
        const matching_pathway = _.find(pathways, (pathway)=>{

            if (pathway.length <= first_pathway.length) {
                return false
            }
            let i = null

            for(i=first_pathway.length-1;i >=0;i--) {
                if (!_.isEqual(pathway[pathway.length-1-i], first_pathway[i])){
                    return false
                } 
            }
            return true
        })

        // If we have a "matching pathway" then remove from pathways
        if (undefined !== matching_pathway) {
            pathways.shift()
            matching_pathway_found = true
        }

    } while(matching_pathway_found)

    return pathways
}


/**
 * This is called by generateParentPathways() inside a loop, passing a different reverse mechanisim each time. 
 * Each call is called concurrently and then processed together using Promise.allSettled()
 * 
 * @param {*} pathway 
 * @param {*} reverse_mechanism 
 * @param {*} last_added_container_state 
 * @param {*} caller_promise_id 
 * @param {*} promise_id 
 * @param {*} renderPathway 
 * @param {*} logger 
 * @returns Promise
 */
const reverseMechanismPromise = (db, pathway, reverse_mechanism,  caller_promise_id, promise_id, renderPathway, logger) => {

    Typecheck(
        {name: "db", value: db, type: "object"},
        {name: "pathway", value: pathway, type: "array"},
        {name: "reverse_mechanism", value: reverse_mechanism, type: "object"},
        {name: "caller_promise_id", value: caller_promise_id, type: "string"},
        {name: "promise_id", value: promise_id, type: "string"},
        {name: "renderPathway", value: renderPathway, type: "function"},
        {name: "logger", value: logger, type: "object"}
    )

    const last_added_container_state = pathway[0]

    return new Promise((resolve, reject) => {
        // Apply reverse mechanism to current container
        last_added_container_state.substrate.smiles_string = last_added_container_state.substrate.canonicalSmiles(false, last_added_container_state.substrate.atoms, logger)
        // @todo A reaction will occur only if the products are more stable than the reactants and the energy barrier is low enough.
        // @see Organic Chemistry - 8th Edition (2017) p184-187 (@todo gibbs free energy)
        const container_after_reverse_mechanism_applied  = Reverse(last_added_container_state, reverse_mechanism.fn, logger) 
        if(false !== container_after_reverse_mechanism_applied) {
            // Check if the container has already been generated
            const s = container_after_reverse_mechanism_applied.substrate.canonicalSmiles(false, container_after_reverse_mechanism_applied.substrate.atoms, logger)
            container_after_reverse_mechanism_applied.substrate.smiles_string = s
            if(_.find(pathway,(container)=>{
                if (undefined === container.getSubstrate()[0].smiles_string) {
                    container.getSubstrate()[0].smiles_string = canonicalSmiles(false, container.getSubstrate()[0].atoms, logger)
                } 
                return _.isEqual(container.getSubstrate()[0].smiles_string, container_after_reverse_mechanism_applied.substrate.smiles_string)
            })!==undefined) {
                // Container is already in the pathway
                reject('container is already in the pathway')
            } else {
                // Render the pathway
                const reaction_steps = _.cloneDeep(pathway)
                if (reverse_mechanism.name === 'E1') {
                    container_after_reverse_mechanism_applied.reagents.push('B:')
                }
                reaction_steps.unshift(container_after_reverse_mechanism_applied)
                if (reaction_steps.length > 1) {
                    renderPathway(db, reaction_steps, logger)
                }
                container_after_reverse_mechanism_applied.mechanism = reverse_mechanism.name
                // Pass container_after_reverse_mechanism_applied to Promise.allSettled()
                resolve([container_after_reverse_mechanism_applied,...pathway])
            }
        } else {
          //  console.timeEnd('reverseMechanismPromise_'+reverse_mechanism.name+t)
            renderPathway(db, pathway, logger)
            //console.timeEnd('reverseMechanismPromise_'+reverse_mechanism.name)
            reject('reversal returned false')
        }
    })
}

/**
 * This is called by generateParentPathways() inside a loop, passing a different reverse mechanisim each time. 
 * Each call is called concurrently and then processed together using Promise.allSettled()
 * 
 * @param {*} pathway 
 * @param {*} reverse_mechanism 
 * @param {*} last_added_container_state 
 * @param {*} caller_promise_id 
 * @param {*} promise_id 
 * @param {*} renderPathway 
 * @param {*} logger 
 * @returns container or false
 */
const reverseMechanism = (db, pathway, reverse_mechanism,  caller_promise_id, promise_id, renderPathway, logger) => {

    Typecheck(
        {name: "db", value: db, type: "object"},
        {name: "pathway", value: pathway, type: "array"}, // [CCNC]
        {name: "reverse_mechanism", value: reverse_mechanism, type: "object"},
        {name: "caller_promise_id", value: caller_promise_id, type: "string"},
        {name: "promise_id", value: promise_id, type: "string"},
        {name: "renderPathway", value: renderPathway, type: "function"},
        {name: "logger", value: logger, type: "object"}
    )

    // Note: A pathway is an array of containers with at least one container. The first container will be the last
    // container added.

    const last_added_container_state = pathway[0] // this will contain the substrate we are attempting to synthesise.

    // Apply reverse mechanism to current container
    // CCNC - substrate we are attempting to synthesise.
    last_added_container_state.substrate.smiles_string = last_added_container_state.substrate.canonicalSmiles(false, last_added_container_state.substrate.atoms, logger)
    // @todo A reaction will occur only if the products are more stable than the reactants and the energy barrier is low enough.
    // @see Organic Chemistry - 8th Edition (2017) p184-187 (@todo gibbs free energy)
    // Get the pathways to add by applying the reverse mechanism. In most cases this will return a single pathway with just one container - the container created as
    // a result of applying the reverse mechanism to the last added container. Exceptions are ReductiveAminationReverse(), OxymercurationReverse() etc.
    let pathways_to_add = Reverse(last_added_container_state, reverse_mechanism.fn, logger) // containers_or_container_object eg // C=O, C=[O+], CC[N+]CO, CC[N+]C[O+], CCNC[O+], CC[N+]=C
    if(false !== pathways_to_add) {

        const pathways = []
    
        for (let p=0; p<pathways_to_add.length;p++) {

            let current_pathway_containers = pathways_to_add[p] // [  C=O, C=[O+], CC[N+]CO, CC[N+]C[O+], CCNC[O+], CC[N+]=C   ]

            // Check if the pathway to add has already been added.
            // We do this by checking if the last item in the current pathway and seeing
            // if it is the pathway parameter.
            if(_.find( pathway,(container)=>{
                if (undefined === container.getSubstrate()[0].smiles_string) {
                    container.getSubstrate()[0].smiles_string = canonicalSmiles(false, container.getSubstrate()[0].atoms, logger)
                } 
                if (undefined === current_pathway_containers[current_pathway_containers.length-1].substrate.smiles_string) {
                    current_pathway_containers[current_pathway_containers.length-1].substrate.smiles_string = canonicalSmiles(false, current_pathway_containers[current_pathway_containers.length-1].substrate.atoms, logger)
                } 
                return _.isEqual(container.getSubstrate()[0].smiles_string, current_pathway_containers[current_pathway_containers.length-1].substrate.smiles_string)
            }) ===undefined) {
                 // Container is not in the pathway
                 if (reverse_mechanism.name === 'E1') {
                    current_pathway_containers[current_pathway_containers.length-1].addReagent('B:', 1, logger)
                 }
                 // Add the current pathway to pathways.
                 current_pathway_containers = [...current_pathway_containers, ... pathway] // [  C=O, C=[O+], CC[N+]CO, CC[N+]C[O+], CCNC[O+], CC[N+]=C, CCNC ]
                 const reaction_steps = _.cloneDeep(current_pathway_containers) 
                 if (reaction_steps.length > 1) {
                    renderPathway(db, reaction_steps, logger)
                 }
                 pathways.push(current_pathway_containers)

            }


        }

        return pathways // [  [  C=O, C=[O+], CC[N+]CO, CC[N+]C[O+], CCNC[O+], CC[N+]=C, CCNC ] ]

    } else {
       // renderPathway(db, pathway, logger)
        return false // No pathways to add.
    }

}



/**
     * Get parent pathways for a single container as a promise. This is called by generatePathways() inside a loop.
     * Each call to generateParentPathways() by generatePathways() is called synchronously.
     * 
     * @param {*} reverse_mechanisms 
     * @param {*} pathway 
     * @param {*} cummulative_pathways 
     */
const generateParentPathwaysPromises = (db, reverse_mechanisms, current_pathway, max_length, promise_id,  renderPathway, logger) => {

    Typecheck(
        {name: "db", value: db, type: "object"},
        {name: "reverse_mechanisms", value: reverse_mechanisms, type: "array"},
        {name: "current_pathway", value: current_pathway, type: "array"},
        {name: "promise_id", value: promise_id, type: "string"},
        {name: "renderPathway", value: renderPathway, type: "function"},
        {name: "logger", value: logger, type: "object"}
    )

    return new Promise((res, reject) => {


        if (current_pathway.length > max_length) {
            // Maximum pathway length reached
            // set the return value from await generateParentPathways() to null
            res(null)
        } else {

            // Get the first item in the pathway. This will either be a container or null. If null then we know that
            // it is a completed pathway and we can return from this function without doing anything.
            if (null === current_pathway[0]) { // pathway  complete
                // set the return value from await generateParentPathways() to null
                res(null)
            } else {

                const pathway_results = []
                // Simulate all mechanisms failing etc
                reverse_mechanisms.map((reverse_mechanism)=>{
                    //   Create a promise instance that will apply the mechanism to the first item and add the result to the pathway.   
                    pathway_results.push(
                        reverseMechanism(db, _.cloneDeep(current_pathway), reverse_mechanism, promise_id,  uniqid().substr(uniqid().length-3,3), renderPathway, logger) // first_item_item_in_pathway is a container
                    )
                })

                res(
                    pathway_results.filter((pathway_result)=>{
                        return pathway_result !== false
                    })
                )

                // Using promises
                // Wait for promises to be settled.
                // Once all the promises have been settled add the resulting parent pathways to the cummulative pathways array.
                /*
                Promise.allSettled(pathway_promises).then((pathway_results) => {
                    // Check that we have added at least one new container and if not
                    // mark the pathway as complete
                    const results = pathway_results
                    res(
                        pathway_results.filter((pathway_result)=>{
                            return 'fulfilled' === pathway_result.status && null !== pathway_result.value
                        }).map((pathway_result)=>{
                            return pathway_result.value
                        })
                    )
                })
                .catch((err) => {
                    console.log(
                        `Promise.allSettled() Failed! \n${err.errorType}: ${err.message}`
                    );
                    //reject(err)
                    process.exit('generateParentPathways()')
                    throw new Error(err)
                })
                .finally(() => {
                    // We have got the parent pathways for the current pathway 
                    resolve(null === parent_pathways || parent_pathways.length === 0?null:parent_pathways)
                });
                */

            }



        }
          

    })


}

/**
     * Get parent pathways for a single container as a promise. This is called by generatePathways() inside a loop.
     * Each call to generateParentPathways() by generatePathways() is called synchronously.
     * 
     * @param {*} reverse_mechanisms 
     * @param {*} pathway 
     * @param {*} cummulative_pathways 
     */
const generateParentPathways = (db, reverse_mechanisms, current_pathway, max_length, promise_id,  renderPathway, logger) => {

    Typecheck(
        {name: "db", value: db, type: "object"},
        {name: "reverse_mechanisms", value: reverse_mechanisms, type: "array"},
        {name: "current_pathway", value: current_pathway, type: "array"},
        {name: "promise_id", value: promise_id, type: "string"},
        {name: "renderPathway", value: renderPathway, type: "function"},
        {name: "logger", value: logger, type: "object"}
    )

    if (current_pathway.length > max_length) {
        // Maximum pathway length reached
        return null
    } else {

        // Get the first item in the pathway. This will either be a container or null. If null then we know that
        // it is a completed pathway and we can return from this function without doing anything.
        if (null === current_pathway[0]) { // pathway  complete
            return null
        } else {

            let pathway_results = []
            // Simulate all mechanisms failing etc
            reverse_mechanisms.map((reverse_mechanism)=>{
                //  Create a promise instance that will apply the mechanism to the first item and add the result to the pathway.   
                // 20 Feb 2023
                const reverse_mechanism_results = reverseMechanism(db, _.cloneDeep(current_pathway), reverse_mechanism, promise_id,  uniqid().substr(uniqid().length-3,3), renderPathway, logger) // first_item_item_in_pathway is a container
                pathway_results = [...reverse_mechanism_results, ...pathway_results]
                /*
                pathway_results.push(
                    // returns an array of pathways
                    reverseMechanism(db, _.cloneDeep(current_pathway), reverse_mechanism, promise_id,  uniqid().substr(uniqid().length-3,3), renderPathway, logger) // first_item_item_in_pathway is a container
                )
                */
            })

            return pathway_results.filter((pathway_result)=>{
                return pathway_result !== false
            })

        }


    }
      

        

}


/**
 * Note: async functions return a promise
 * @param {*} reverse_mechanisms 
 * @param {*} pathways 
 * @param {*} max_length 
 * @param {*} depth 
 * @param {*} max_depth 
 * @param {*} renderPathway 
 * @param {*} callback 
 * @param {*} logger 
 * @returns Promise
 */
 async function generatePathways(db, reverse_mechanisms, pathways, max_length, depth, max_depth, renderPathway, callback, allow_invalid, logger)  {

    Typecheck(
        {name: "db", value: db, type: "object"},
        {name: "reverse_mechanisms", value: reverse_mechanisms, type: "array"},
        {name: "pathways", value: pathways, type: "array"},
        {name: "max_length", value: max_length, type: "number"},
        {name: "depth", value: depth, type: "number"},
        {name: "renderPathway", value: renderPathway, type: "function"},
        {name: "callback", value: callback, type: "function"},
        {name: "allow_invalid", value: allow_invalid, type: "bool"},
        {name: "logger", value: logger, type: "object"},
    )

   
    let pathways_with_parents = ['']
    // @todo this should use ids.
    const hydrate_mechanism_index = _.findIndex(reverse_mechanisms, (mechanism)=>{
        return mechanism.name === "hydrate"
    })

    const dehydrate_mechanism_index = _.findIndex(reverse_mechanisms, (mechanism)=>{
        return mechanism.name === "dehydrate"
    })

    const e1_mechanism_index = _.findIndex(reverse_mechanisms, (mechanism)=>{
        return mechanism.name === "E1"
    })

    const h_acid_mechanism_index = _.findIndex(reverse_mechanisms, (mechanism)=>{
        return mechanism.name === "Hydrohalic acid addition on double bond"
    })

    const a_shift_mechanism_index = _.findIndex(reverse_mechanisms, (mechanism)=>{
        return mechanism.name === "akyl shift"
    })

    let counter = 0 
    let non_complete_pathways = undefined
    let pathway_index= 0

    // At start pathways will contain one array consisting of a container containing the substance we are trying to synthesise.
    // eg [[container]]
    do {

        // Add parent pathways to start of each pathway in the current pathway set
        let pathway_index = 0
        non_complete_pathways = pathways.filter((pathway)=>{
            return pathway[0] !== null
        })

        for (pathway_index =0; pathway_index < pathways.length;pathway_index++) {

            // Note each parent pathway includes the current pathway unless null is returned
            // This is the container we are attempting to reverse
            const current_pathway = pathways[pathway_index]
            const last_container = current_pathway[0]

            // Last container will be set to null if the container has a substrate that is not an intermediate.
            if (null !== last_container) {

                const reverse_mechanisms_filtered = _.cloneDeep(reverse_mechanisms)
        
                // Look for an oxygen atom
                if (_.find(last_container.getSubstrate()[0].atoms, (atom)=>{
                    return 'O' === atom.atomicSymbol
                }) === undefined) {
                    reverse_mechanisms_filtered[hydrate_mechanism_index] = null
                }
                
                // Look for C=C bond
                if (false === FindAlkeneCarbonAtoms(last_container.getSubstrate()[0], logger)){
                    reverse_mechanisms_filtered[e1_mechanism_index] = null
                }
        
                // Look for halide
                if (_.find(last_container.getSubstrate()[0].atoms, (atom)=>{
                    return atom.isHalide()
                }) === undefined) {
                    reverse_mechanisms_filtered[h_acid_mechanism_index] = null
                }
        
                // Look for terminal carbon
                // akyl shift
                if (_.find(last_container.getSubstrate()[0].atoms, (atom)=>{
                    return 'C' === atom.atomicSymbol && atom.isTerminalAtom(last_container.getSubstrate()[0].atoms)
                }) === undefined) {
                    reverse_mechanisms_filtered[a_shift_mechanism_index] = null
                }
        
                // Look for carbocation
                if (_.find(last_container.getSubstrate()[0].atoms, (atom)=>{
                    return 'C' === atom.atomicSymbol && atom.isCarbocation(last_container.getSubstrate()[0].atoms, logger)
                }) === undefined) {
                    reverse_mechanisms_filtered[dehydrate_mechanism_index] = null
                }
    
                // Get the parent pathways for the last item in the current pathway
                let pathway_parents = generateParentPathways( // await
                    db, 
                    reverse_mechanisms_filtered.filter((m)=>{
                        return null !== m
                    }), 
                    current_pathway, 
                    max_length,  
                    uniqid().substr(uniqid().length-3,3),  
                    renderPathway, 
                    logger
                )
    

                // For each pathway add null to start if the first container's substrate is a non-intermediate molecule and exists.
                if (pathway_parents !== null) {
                    for (let pathway_parent_index = 0; pathway_parent_index < pathway_parents.length; pathway_parent_index++){
                        const pathway = pathway_parents[pathway_parent_index]
                        const first_container = pathway[0]
                        if (undefined !== first_container.getSubstrate()[0].smiles_string) {
                            first_container.getSubstrate()[0].smiles_string = first_container.getSubstrate()[0].canonicalSmiles(false, first_container.getSubstrate()[0].atoms,logger)
                        }
                        if (first_container.getSubstrate()[0].smiles_string.indexOf('+') === -1 && first_container.getSubstrate()[0].smiles_string.indexOf('-') === -1) {
                            // Check if molecule exists
                            const chemical = await LookupMolecule(db, first_container.getSubstrate()[0].smiles_string, "SMILES", logger, PubChemLookup)
                            if (undefined !== chemical['IUPACName'] && '' !== chemical['IUPACName']) {
                                    first_container.getSubstrate()[0]['IUPACName'] = chemical['IUPACName']
                                    pathway.unshift(null)
                            }
                        }
    
                    }
    
                }

                if (null !== pathway_parents && pathway_parents.length > 0) {
                    parent_pathway_added = true
                    do {
                          pathways_with_parents.push(pathway_parents[0])
                          pathway_parents.shift()
                    } while(pathway_parents.length > 0)
                }
    
            }
                



        }// while(pathways.length > 0)

        pathways = mergePathways(_.cloneDeep(pathways_with_parents))

        counter++


    } while(counter < max_length && non_complete_pathways.length > 0)

    // Remove empty pathways, remove incomplete pathways
    pathways = pathways.filter((pathway)=>{
        return null !== pathway && '' !== pathway
    }).filter((pathway)=>{
        return allow_invalid || pathway[0] === null
    }).map((pathway)=>{
        // Hack
        // Remove reducing agent from any pathway container having two or more reagents.
        // This is because adding a reducing agent is treated as a separate step.
        // At the same time remove any duplicate reagents and remove nulls from start of pathways.
        pathway = pathway.filter((container)=>{
            return null !== container
        }).map((container)=>{
            container.reagents = [...new Set(container.reagents)]
            if (container.reagents.length > 1) {
                container.removeReagent('RA:', logger)
            }
            return container
        })
        return pathway
    }).map((pathway)=>{
        // Propogate side products
        pathway = pathway.reduce((carry, container, i)=>{
            if (undefined !== pathway[i-1] && pathway[i-1].side_products.length > 0 && container.side_products.length === 0) {
                container.side_products = pathway[i-1].side_products
            }
            carry.push(container)
            return carry
        }, [])
        return pathway
    })

    callback(pathways)


}


 



const Synthesise = (final_container, logger, db, max_number_of_steps, renderPathway, callback, allow_invalid) => {

    try {

        Typecheck(
            {name: "final_container", value: final_container, type: "object"},
            {name: "logger", value: logger, type: "object"},
            {name: "db", value: db, type: "object"},
            {name: "max_number_of_steps", value: max_number_of_steps, type: "number"},
            {name: "renderPathway", value: renderPathway, type: "function"},
            {name: "allow_invalid", value: allow_invalid, type: "bool"},
        )

       let reverse_mechanisms = [

        {
            fn:LewisAcidBaseReverse,
            name:'lewis acid base'
        },
        {
            fn:ProtonationReverse,
            name:'protonate'
        },
        
            {
                fn:DeprotonationReverse,
                name:'deprotonate'
            },
            {
                fn:BondAtomToAtomInSameMoleculeReverse,
                name:'bond atoms'
            },


            {
                fn:DehydrateReverse,
                name:'dehydrate'
            },

            {
                fn: HydrateReverse,
                name:'hydrate'
            },



            {
                fn:ReduceReverse,
                name:'reduce'
            },

            
            {
                fn:OxidiseReverse,
                name:'oxidise'
            },
    
        
            {
                fn:AkylShiftReverse, 
                name:'akyl shift'
            },

            {
                fn: E1Reverse, 
                name:'E1'
            },


            {
                fn: HydrohalicAcidAdditionOnDoubleBondReverse, 
                name:'Hydrohalic acid addition on double bond'
            },
    
        {
            fn:HydrideShiftReverse, 
            name:'hydride shift reverse'
        },


        {
            fn:BreakBondInSameMoleculeReverse,
            name:'break bond'
        },

        {
            fn: OxymercurationReverse,
            name:'oxymercuration'
        },

        {
            fn: ReductiveAminationReverse,
            name:'reductive amination'
        },

        {
            fn: PinacolRearrangementReverse,
            name:'pinacol rearrangement'
        },

        {
            fn: RitterReverse,
            name:'ritter rearrangement'
        }

       ]

       reverse_mechanisms = [

        {
            fn:  RitterReverse,
            name:'ritter rearrangment'
        }

       ]
      
       let pathways = [[final_container]]

       const max_length = max_number_of_steps

       const depth = 0
       const max_depth = 2
       //console.time('Synthesise')
       return generatePathways(db, reverse_mechanisms, pathways, max_length, depth, max_depth, renderPathway, callback, allow_invalid, logger)

    } catch(e) {
        logger.log('error', '[Synthesise] Caught error ' + e.stack)
        console.log(e.stack)
        process.exit()
    }
}
module.exports = Synthesise