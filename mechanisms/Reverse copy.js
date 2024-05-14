const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')

const Synthesise = require('../AI/Synthesise')
const uniqid = require('uniqid')

// Reverse(container, max_steps, 'Reverse reduce', ReduceReverse, last_action, logger, pathway_id, reduce_reverse_fn())
// return Reverse(container_after_previous_mechanism_was_applied, container_before_previous_mechanism_was_applied,  max_steps, 'protonation reduce', ProtonateReverse, last_action, logger, pathway_id, protonation_reverse_fn(), onSuccess)


const Reverse = function(
    pathways, 
    container, 
    container_before_previous_mechanism_was_applied, 
    max_steps, 
    mechanism_name, 
    mechanism, 
    last_action, 
    logger, 
    pathway_id, 
    function_to_test_mechanism_reversal, 
    onSuccess)
 {

    Typecheck(
        {name: "pathways", value: pathways, type: "array"},
        {name: "container", value: container, type: "object"},
        {name: "container_before_previous_mechanism_was_applied", value: container_before_previous_mechanism_was_applied, type: "object"},
        {name: "max steps", value: max_steps, type: "number"},
        {name: "mechanism_name", value: mechanism_name, type: "string"},
        {name: "mechanism", value: mechanism, type: "function"},
        {name: "function_to_test_mechanism_reversal", value: function_to_test_mechanism_reversal, type: "function"},
        {name: "onSuccess", value: onSuccess, type: "function"}
    )

    if (0 === max_steps) {
        return
    }

    function_to_test_mechanism_reversal(pathways, container_before_previous_mechanism_was_applied)

    /*
    return new Promise((resolve, reject) => {

        // last_action === null || last_action.toString() !== mechanism.toString()
        if (max_steps === 0) {
            resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Max steps reached'))
            return container
        }

        if (last_action !== null && last_action.toString() === mechanism.toString()) {
            resolve(onSuccess(container, container_before_previous_mechanism_was_applied,'Last action was ' + mechanism_name))
            return container
        }

        return fn(resolve, reject, max_steps)

    });
    */

}

module.exports = Reverse