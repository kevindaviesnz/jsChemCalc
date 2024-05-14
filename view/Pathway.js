const Typecheck = require('../Typecheck')

const Pathway = (synth_id, containers, logger) => {

    try {

        Typecheck(
            {name: "synth_id", value: synth_id, type: "string"},
            {name: "containers", value: containers, type: "array"},
            {name: "logger", value: logger, type: "object"},
        )

        const toJSON = function() {

        }

        const toString = function() {

            const pathway_as_string = containers.reduce((carry, container) => {

                if (null === container) {
                    return carry
                }

                const mechanism = undefined === container.mechanism? '': ' [' + container.mechanism + ']'
                return carry + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) + mechanism + ' ---> '
                
            }, "") // "Pathway: " + starting_chemical_as_string

            return  pathway_as_string.substr(0, pathway_as_string.length-5).trim()
        }
        
        return {
            'toJSON':toJSON,
            'toString':toString,
        }

    } catch(e) {
        logger.log('error', '[view/Pathway] ' + e.stack) 
        console.log(e.stack)
        process.exit()
    }


}

module.exports = Pathway