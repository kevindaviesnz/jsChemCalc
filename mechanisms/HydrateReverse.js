const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('./Reverse')
const uniqid = require('uniqid');
const FindLewisAcidAtom = require('../reflection/LewisAcidAtom')
const Dehydrate = require('../mechanisms/Dehydrate')
const AtomsFactory = require("../factories/AtomsFactory");
const ENV = require("../env");

const HydrateReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {


        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        if (ENV.debug) {
            if (undefined === container_after_previous_mechanism_was_applied.substrate.smiles_string) {
                container_after_previous_mechanism_was_applied.substrate.smiles_string = container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger)
            }
            logger.log(ENV.debug_log, 
                "[HydrateReverse] Reversing hydration of " + container_after_previous_mechanism_was_applied.substrate.smiles_string
            )
        }

        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        // Add water
        const water = {
            'atoms': AtomsFactory('O', logger),
            'smiles':'O'
        }
        computed_previous_container.addReagent(
            water,
            1,
            logger
        )

        const dehydrate_result = Dehydrate(computed_previous_container, logger)
        if (false === dehydrate_result) {
            return false
        }
        
      //  if (ENV.debug) {
           // computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
      //  }
        
        pathways.push([computed_previous_container])

        return pathways


    } catch(e) {
        logger.log('error', ('[HydrateReverse] ' +e).bgRed)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = HydrateReverse