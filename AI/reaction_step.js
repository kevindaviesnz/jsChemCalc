

const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const Constants = require('../Constants')
const FunctionalGroups = require('../reflection/FunctionalGroups')
const SN1 = require('../reactions/SN1')
const SN2 = require('../reactions/SN2')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBaseReaction')
const Protonate = require('../mechanisms/Protonate')
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const FormatAs = require('../factories/FormatAs')
const AkylShift = require('../mechanisms/AkylShift')
const BondAtomToAtom = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BreakBond = require('../mechanisms/BreakBondInSameMolecule')
const Deprotonate = require('../mechanisms/Deprotonate')
//const Dehydrate = require('../mechanisms/Dehydrate')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const Reduce = require('../mechanisms/Reduce')
const Hydrate = require('../mechanisms/Hydrate')
const _ = require('lodash');
const { loggers } = require('winston')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBaseReaction')
const ContainerView = require('../view/Container')
const AcidBaseReaction = require('../reactions/AcidBase')

const colors = require('colors');

colors.enable()

// Pinacol rearrangement
// Protonate
// Reductive amination (in process)

// Deprotonation -> Leaving group removal -> Akyl shift -> Deprotonate

/**
 * The mechanism index is reset if we have no more mechanisms to process for the current reaction and the mechanism history is set to empty.
 * If we have no more mechanisms to process and mechanism history is empty, then we stop the reaction.
 * 
 * @param object container Container to hold results of each step in the reaction
 * @param number mechanism_index Incremental index to get next mechanism from mechanism map
 * @param array container_history This is an array of container "snapshots" as each reverse mechanism is applied.
 * @param array mechanism_history 
 * @param boolean terminate 
 * @param object logger 
 * @returns 
 */

// @see docs/step.draw.io.png
const ReactionStep = (container, logger) => {

    try {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        if (container.getSubstrate()[0].isUnstable()) {
            container.getSubstrate()[0].stabilise()
        } else if(container.reagents.length > 0) {
            // @todo what if we have multiple reagents?
            container.react()
            container.getSubstrate()[0].stabilise()
        } else {
            // Indicate that the reaction has finished.
            return false
        }

        return container
       
    } catch(e) {
        logger.log('error', ('[ReactionStep] ' + e.stack).red)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = ReactionStep