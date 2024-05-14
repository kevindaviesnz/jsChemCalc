const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('./Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('./Hydrate')
const HydrideShift = require('./HydrideShift')
// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env')

const HydrideShiftReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        if (env.profiler_on) {
            console.time('HydrideShiftReverse()')
        }


        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('HydrideShiftReverse', logger)
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

         if (false === HydrideShift(computed_previous_container, logger)) {

            return false
        }


        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false

        pathways.push([computed_previous_container])

        return pathways

    

    } catch(e) {
        logger.log('error', '[HydrideShiftReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = HydrideShiftReverse