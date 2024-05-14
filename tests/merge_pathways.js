
    const mergePathways = (pathways) => {
        // Remove the null from the start of each pathway
        const pathways_no_null = pathways.map((pathway)=>{
            console.log('pathway')
            console.log(pathway)
            if (null === pathway[0]) {
                pathway[0].shift()
            }
        })

        do {
            // Get the first pathway
            let matching_pathway_found = false
            const first_pathway = pathways_no_null[0]
            // Look for a pathway where the last containers match the containers in the first pathway, and in order.
            const matching_pathway = _.find(pathways_no_null, (pathway)=>{
                if (pathway.length <= first_pathway) {
                    return false
                }
                let i = null
                for(i=first_pathway.length;i >=0;i--) {
                    return false
                }
                return true
            })
            // If we have a "matching pathway" then remove from pathways
            if (undefined !== matching_pathway) {
                pathways_no_null.shift()
                matching_pathway_found = true
            }

        } while(matching_pathway_found)

        return pathways_no_null
    }