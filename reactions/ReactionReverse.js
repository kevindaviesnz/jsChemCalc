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

const ReactionReverse = function(
    container_after_previous_mechanism_was_applied, 
    sequence,
    reaction_name,
    reagents,
    logger
    ) {

    try {

        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "sequence", value: sequence, type: "array"},
            {name: "reaction_name", value: sequence, type: "reaction_name"},
            {name: "reagents", value: reagents, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )

        const containers = []

        let next_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        for (let i=0; i < sequence.length; i++) {
            const fn = sequence[i]
            const container_pathways = fn(next_container, logger)
            if (false === container_pathways) {
                return false
            }
            const reverse_container = container_pathways[0][0]
            reverse_container.getSubstrate()[0].smiles_string = reverse_container.getSubstrate()[0].canonicalSmiles(false, reverse_container.getSubstrate()[0].atoms, logger)
            reverse_container.mechanism = reaction_name
            containers.unshift(reverse_container)
            next_container = _.cloneDeep(reverse_container)
        }
        
        return containers

    } catch(e) {
        logger.log('error', '[PinacolRearrangementReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = ReactionReverse