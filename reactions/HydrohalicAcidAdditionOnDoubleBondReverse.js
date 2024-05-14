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
const E1 = require("./E1");

const HydrohalicAcidAdditionOnDoubleBondReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "container_after_previous_mechanism_was_applied substrate", value: container_after_previous_mechanism_was_applied.substrate, type: "object"},
            {name: "container_after_previous_mechanism_was_applied substrate atoms", value: container_after_previous_mechanism_was_applied.substrate.atoms, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('HydrohalicAcidAdditionOnDoubleBondReverse', logger)
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
        // Remove any base reagents as we add B: as a separate step after the acid has been consumed.
        computed_previous_container.removeReagent('A:', logger)
        computed_previous_container.addReagent('B:', 1, logger)

        if (false === E1(computed_previous_container, logger)) {
            return false
        }

        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false


       /* if (typeof computed_previous_container.getSubstrate()[0] !== "object" || Object.prototype.toString.call(computed_previous_container.getSubstrate()[0]) === '[object Array]') {
            throw new Error('Substrate should be an array')
        }*/

       /* if(Object.prototype.toString.call(computed_previous_container.getSubstrate()[0].atoms) !== '[object Array]'){
            throw new Error('Substrate atoms should be an array')
        }*/
             
        pathways.push([computed_previous_container])

        return pathways

    

    } catch(e) {
        logger.log('error', '[HydrohalicAcidAdditionOnDoubleBondReverse] ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = HydrohalicAcidAdditionOnDoubleBondReverse