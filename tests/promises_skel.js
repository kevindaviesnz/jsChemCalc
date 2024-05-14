

/*
Overview

See promises_allsettled.js

FOR EACH pathway

    Get pathway from pathways and remove it from pathways as we are going to replace it.

    Get the first item in the pathway. This will either be a container or null. If null then we know that
    it is a completed pathway

    IF first item is NOT NULL

        FOR EACH reverse mechanism

            Create a promise instance that will apply the mechanism to the first item and add the result to the pathway.
            Once all the promises have been settled add the resulting pathways to the pathways array.

        END FOR

    END IF


END FOR

*/
const { first } = require('lodash');
const uniqid = require('uniqid');
const { child, loggers } = require('winston');

try {

    const _ = require('lodash');

    const removeNulls = (pathways) => {
        return pathways_no_null = pathways.map((pathway)=>{
            if (null === pathway[0]) {
                pathway.shift()
            }
            return pathway
        })

    }
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

    const replacePathway = (pathways, pathway_to_replace, replacement) => {
         const index = _.findIndex(pathways, (pathway)=>{
            return _isEqual(pathway, pathway_to_replace)
         }); 
         pathways[index] = replacement
         return pathways
    }

    const removePathway = (pathways, pathway_to_remove) => {
        _.remove(pathways, (pathway)=>{
            return _isEqual(pathway, pathway_to_remove)
        })
        return pathways
    }

    const generatePathways = (reverse_mechanisms, pathways, max_length, depth, max_depth) => {

        const starting_pathways = _.cloneDeep(pathways).map((pathway)=>{
            if (null !== pathway[0]) {
                pathway.unshift(null)
            }
            return pathway
        })

        const pathways_promises = []

        // Generate array of promises where each promise gets an array of parent pathways for each pathway, with the last container on the pathway being 
        // the child container
        for(pathway_index in pathways) {
            pathways_promises.push(generateParentPathways(reverse_mechanisms, pathways[pathway_index], max_length))
        }

        // Wait for promises that get parent promises for each pathway in the current set of pathways to finish.
        Promise.allSettled(pathways_promises).then((pathway_results) => {
            /*
            { status: 'fulfilled', value: <parent pathways> }
            { status: 'rejected', reason: <child pathway> }
            { status: 'fulfilled', value: <parent pathways> }
            */
            // @todo
            // If all results are status rejected then we add 'null' to the child pathway.
            // If we have at least one fulfilled result then we need to remove the child pathway
            // and replace it with the pathway results.
            const fullfilled_promises = pathways_promises.filter((promise)=>{
                return 'fulfilled' === promise.status
            })

            const rejected_promise = _.find(pathway_results, (pathway_result)=>{
                return 'rejected' === pathway_result.status
            })


            pathway_results.map((pathway_result)=>{
                if ('fulfilled' === pathway_result.status) {
                    pathways = [...pathways, ... pathway_result.value]
                }
            })

        })
        .catch((err) => {
            console.log(
                `Promise.allSettled() Failed! \n${err.errorType}: ${err.message}`
            );
            reject(err)
        })
        .finally(() => {
            // We have got the parent pathways for the current pathway 
           // console.log('Operations for Promise.allSettled() have finished (generatePathways).');
            // If we have made no changes then call the callback function and exit.
            // Otherwise call this function again, passing in the new set of pathways
            if (_.isEqual(starting_pathways, pathways) || depth + 1 > max_depth) {
                const merge_pathways = mergePathways(removeNulls(pathways))
                console.log('All done')
                console.log(pathways)
                process.exit()
            } else {
                generatePathways(reverse_mechanisms, mergePathways(pathways), max_length, depth+1, max_depth)
            }
        });
        
    }
    
    const reverseMechanismPromise = (reverse_mechanism, container) => {
        return new Promise((resolve, reject) => {
            // Apply reverse mechanism to current container
            const container_after_reverse_mechanism_applied = reverse_mechanism == 1// Reverse()
            if(false !== container_after_reverse_mechanism_applied) {
                resolve('parent container ' + uniqid().substr(uniqid().length-3,3))
            } else {
                reject(false)
            }
        })
    }

    /**
     * Get parent pathways for a single container as a promise.
     * 
     * @param {*} reverse_mechanisms 
     * @param {*} pathway 
     * @param {*} cummulative_pathways 
     */
    const generateParentPathways = (reverse_mechanisms, child_pathway, max_length) => {

        return new Promise((resolve, reject) => {

            const parent_pathways = []

            if (child_pathway.length > max_length) {
                // Maximum pathway length reached
                if (null !== child_pathway[0]) {
                    child_pathway.unshift(null)
                }
                reject(child_pathway)
            } else {


                // Get the first item in the pathway. This will either be a container or null. If null then we know that
                // it is a completed pathway and we can return from this function without doing anything.
                const first_item_item_in_pathway = child_pathway[0]
            
                if (null === first_item_item_in_pathway) { // pathway  complete
                    reject(child_pathway)
                } else {

                    const pathway_promises = []
                    // Simulate all mechanisms failing etc
                    if (1 === Math.round(Math.random())) { // 1 === Math.round(Math.random())
                        pathway_promises.push(
                            reverseMechanismPromise(0, first_item_item_in_pathway) // first_item_item_in_pathway is a container
                        )
                        pathway_promises.push(
                            reverseMechanismPromise(0, first_item_item_in_pathway) // first_item_item_in_pathway is a container
                        )
                        pathway_promises.push(
                            reverseMechanismPromise(0, first_item_item_in_pathway) // first_item_item_in_pathway is a container
                        )
                    } else {
                        reverse_mechanisms.map((reverse_mechanism)=>{
                            //   Create a promise instance that will apply the mechanism to the first item and add the result to the pathway.   
                            pathway_promises.push(
                                reverseMechanismPromise(Math.round(Math.random()), first_item_item_in_pathway) // first_item_item_in_pathway is a container
                            )
                            return reverse_mechanism
                        })
                    }
                        
                    // Wait for promises to be settled.
                    // Once all the promises have been settled add the resulting parent pathways to the cummulative pathways array.
                    Promise.allSettled(pathway_promises ).then((pathway_results) => {
                        /*
                        { status: 'fulfilled', value: 'parent container' }
                        { status: 'rejected', reason: false }
                        { status: 'fulfilled', value: 'parent container' }
                        */
                        // Check that we have added at least one new container and if not
                        // mark the pathway as complete
                        if (pathway_results.filter((pathway_result)=>{
                            return 'fulfilled' === pathway_result.status 
                        }).length === 0) {
                            // We weren't able to find any parent pathways for the current pathway.
                            child_pathway.unshift(null)
                            parent_pathways.push(child_pathway)
                        } else {
                            pathway_results.map((pathway_result)=>{
                                if ('fulfilled' === pathway_result.status) {
                                    parent_pathways.push([pathway_result.value,...child_pathway, ])
                                } 
                            })
            
                        }
                    })
                    .catch((err) => {
                        console.log(
                            `Promise.allSettled() Failed! \n${err.errorType}: ${err.message}`
                        );
                        reject(err)
                    })
                    .finally(() => {
                        // We have got the parent pathways for the current pathway 
                        // reject if we have no parent pathways
                       // console.log('Operations for Promise.allSettled() have finished (generateParentPathways).');
                        if (parent_pathways.length === 1 && parent_pathways[0][0] === null)  {
                            reject(child_pathway)
                        } else {
                            resolve(parent_pathways)
                        }
                    });
                
                    // ENDFOR
                                




                }



            }
            
            
                
              
    
        })

    
    }

    // Put in separate function.
    const reverse_mechanisms = [true, false, true]
    const pathways = [['child_container1']]
    const max_length = 4
    const depth = 0
    const max_depth = 10
    generatePathways(reverse_mechanisms, pathways, max_length -1, depth, max_depth)
    
    
} catch(e) {
    logger.log('error', e.stack)
    console.log(e.stack)
    process.exit()
}

