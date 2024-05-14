const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('../mechanisms/Hydrate')
const Protonate = require('../mechanisms/Protonate');
const AcidBase = require("./AcidBase");
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom")
const ExtractAtomGroup = require('../actions/ExtractAtomGroup');
const RemoveAtoms = require("../actions/RemoveAtoms");
// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env');
const { enable } = require("colors");
const HydrohalicAcidAdditionOnDoubleBond = require("./HydrohalicAcidAdditionOnDoubleBond");

const E1Reverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {
        

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('E1Reverse', logger)
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
         // Temporarily add 'HX' so that HydrohalicAcidAdditionOnDoubleBond() doesn't fail
         computed_previous_container.addReagent('HX', 1, logger)
         if (false === HydrohalicAcidAdditionOnDoubleBond(computed_previous_container, logger)) {
            return false
        }

        computed_previous_container.removeReagent('HX', logger)
        container_after_previous_mechanism_was_applied['side_products'].push('X-')
        container_after_previous_mechanism_was_applied['side_products'].push('HB:')
             
        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
        
        computed_previous_container.removeReagent('A:', logger)
        computed_previous_container.removeReagent('B:', logger)
        computed_previous_container.addReagent('B:', 1, logger)

        computed_previous_container.mechanism = "E1"

        pathways.push([computed_previous_container])

        return pathways

    

    } catch(e) {
        logger.log('error', '[E1Reverse] ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = E1Reverse