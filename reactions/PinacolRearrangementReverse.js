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
const AkylShift = require('../mechanisms/AkylShift')
// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env');
const ReduceReverse = require("../mechanisms/ReduceReverse");
const DeprotonateReverse = require("../mechanisms/DeprotonateReverse");
const ProtonateReverse = require("../mechanisms/ProtonateReverse");
const HydrateReverse = require("../mechanisms/HydrateReverse");
const BreakBondInSameMoleculeReverse = require("../mechanisms/BreakBondInSameMoleculeReverse")
const BondAtomToAtomInSameMoleculeReverse = require("../mechanisms/BondAtomToAtomInSameMoleculeReverse")
const LewisBaseAtom = require("../reflection/LewisBaseAtom");
const ExtractAtomGroup = require("../actions/ExtractAtomGroup")
const RemoveAtoms = require("../actions/RemoveAtoms");
const DehydrateReverse = require("../mechanisms/DehydrateReverse");
const AkylShiftReverse = require("../mechanisms/AkylShiftReverse")
const ReactionReverse = require("../reactions/ReactionReverse")

const PinacolRearrangementReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        // Product must be a ketone.
        if (false === container_after_previous_mechanism_was_applied.substrate.functionalGroups(logger).ketone.length === 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[PinacolRearrangementReverse] - Product must be a ketone').bgRed)
            }
            return false
        }

        const reaction_name = "pinacol rearrangemnt"

        // 1. CC(O)(C)C(O)(C)C -> CCC(O)(C)C([O+])(C)C protonation
        // 2. CC(O)(C)C([O+])(C)C -> CC(O)(C)[C+](C)C dehydration
        // 3. CC(O)(C)[C+](C)C -> CC([C+](O)C)(C)C akyl shift
        // 4. CC([C+](O)C)(C)C -> CC(C(=[O+])C)(C)C bond
        // 5. CC(C(=[O+])C)(C)C -> CC(C(=O)C)(C)C Deprotonate
        const reagents = []
        const sequence = [DeprotonateReverse, BondAtomToAtomInSameMoleculeReverse, AkylShiftReverse, DehydrateReverse, ProtonateReverse]
        const containers = ReactionReverse(container_after_previous_mechanism_was_applied, sequence, reaction_name, reagents, logger)
        
        // Set reagents
        containers[0].reagents = []
        containers[0].addReagent("A:", 1, logger) 
        containers[1].reagents = []
        containers[1].addReagent("A:", 1, logger) 
        containers[2].reagents = []
        containers[2].addReagent("A:", 1, logger) 
        containers[3].reagents = []
        containers[3].addReagent("A:", 1, logger) 
        containers[4].reagents = []
        containers[4].addReagent("B:", 1, logger) 

        const pathways = []
        pathways.push(containers)

        return pathways

    } catch(e) {
        logger.log('error', '[PinacolRearrangementReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = PinacolRearrangementReverse