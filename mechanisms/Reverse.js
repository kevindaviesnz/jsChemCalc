const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')

const Synthesise = require('../AI/Synthesise')
const uniqid = require('uniqid');
const { reverse } = require("lodash");

// Reverse(container, max_steps, 'Reverse reduce', ReduceReverse, last_action, logger, pathway_id, reduce_reverse_fn())
// return Reverse(container_after_previous_mechanism_was_applied, container_before_previous_mechanism_was_applied,  max_steps, 'protonation reduce', ProtonateReverse, last_action, logger, pathway_id, protonation_reverse_fn(), onSuccess)

// if (false !== Reverse(previous_container, container, reverse_mechanism)) { // ProtonateReverse ---> T, previous_container.getSubstrate()[0] ---> CC(=[O+])C(C)(C)C
const Reverse = function(
        container, 
        reverse_mechanism, // eg ProtonateReverse()
        logger
    )
 {

    Typecheck(
        {name: "container", value: container, type: "object"},
        {name: "container.getSubstrate()[0]", value: container.getSubstrate()[0], type: "object"},
        {name: "reverse_mechanism", value: reverse_mechanism, type: "function"},
        {name: "logger", value: logger, type: "object"},
    )

    //console.log(reverse_mechanism)

    // This returns the container before the mechanism was applied but should not change container
   // container.getSubstrate()[0].atoms.checkHydrogens('Reverse1', logger)
    const result = reverse_mechanism(container, logger)
   // container.getSubstrate()[0].atoms.checkHydrogens('Reverse2', logger)


    return result

}

module.exports = Reverse