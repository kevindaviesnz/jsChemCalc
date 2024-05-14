const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('../mechanisms/Hydrate')
const Protonate = require('../mechanisms/Protonate');
const AcidBase = require("../reactions/AcidBase");
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom");
const ExtractAtomGroup = require('../actions/ExtractAtomGroup');
const { at } = require("lodash");
const RemoveAtoms = require("../actions/RemoveAtoms")

const env = require('../env');
const OzonolysisReverse = require("../reactions/OzonolysisReverse");

/*
Important note:
Here we have a ketone and we are applying different reactions in reverse to determine possible pathways to get to the ketone.
*/

const ToKetone = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "container_after_previous_mechanism_was_applied.substrate", value: container_after_previous_mechanism_was_applied.substrate, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        const side_product = computed_previous_container.side_products[0]
        if (undefined === side_product) {
            return false
        }

        if (computed_previous_container.getSubstrate()[0].functionalGroups.carboxylicAcid || side_product.functionalGroups.carboxylicAcid) {
            return false
        }

        const pathways = OzonolysisReverse(container_after_previous_mechanism_was_applied, logger)

        if (pathways === false) {
            return false
        }
        
        return pathways


    } catch(e) {
        logger.log('error', '[ToKetone] ' + e)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = ToKetone