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
const LewisAcidBaseReverse = require("../reactions/LewisAcidBaseReverse")

const RitterReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        // @see https://en.wikipedia.org/wiki/Ritter_reaction
        // @see https://www.organic-chemistry.org/namedreactions/ritter-reaction.shtm
        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        // Product must be an amide.
        if (false === container_after_previous_mechanism_was_applied.substrate.functionalGroups(logger).amide.length === 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[RitterReverse] - Product must be an amide').bgRed)
            }
            return false
        }

        const reaction_name = "ritter"
        const carbenium_ion = MoleculeFactory(
            AtomsFactory('[C+](C)(C)C', logger),
            false,
            false,
            logger
        )
        const acetonitrile = MoleculeFactory(
            AtomsFactory('CC#N', logger),
            false,
            false,
            logger
        )

        // 0. CC(C)(C)[N+]#CC" -> CC(C)(C)N=[C+]C break bond
        // 1. CC(C)(C)N=[C+]C -> CC(C)(C)N=C(C)[O+] hydrate
        // 2. CC(C)(C)N=C(C)[O+] -> CC(C)(C)N=C(C)O deprotonate
        // 3, CC(C)(C)N=C(C)O -> CC(C)(C)[N+]=C(C)O protonate 
        // 4. CC(C)(C)[N+]=C(C)O ->  CC(C)(C)N[C+](C)O break bond
        // 5. CC(C)(C)N[C+](C)O -> CC(C)(C)NC(=[O+])C bond correct
        // 6. CC(C)(C)NC(=[O+])C -> CC(C)(C)NC(C)=O deprotonate 
        const reagents = [[], [], [], [], [carbenium_ion]]
        const sequence = [DeprotonateReverse, BondAtomToAtomInSameMoleculeReverse, BreakBondInSameMoleculeReverse, ProtonateReverse, DeprotonateReverse, HydrateReverse, BreakBondInSameMoleculeReverse, LewisAcidBaseReverse]
        //container_after_previous_mechanism_was_applied.substrate.smiles_string = container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger)
        const containers = ReactionReverse(container_after_previous_mechanism_was_applied, sequence, reaction_name, reagents, logger)
        
        // For Ritter we swap the substrate and reagent around as the substrate will have a carbocation
        const substrate = containers[0].substrate
        const reagent = containers[0].reagents[0]
        containers[0].reagents = []
        containers[0].addReagent(substrate, 0, logger)
        containers[0].substrate = reagent
        containers[1].reagents = []
        const w = MoleculeFactory(
            AtomsFactory('O', logger),
            false,
            false, 
            logger
        )
        containers[1].addReagent(w, 1, logger)
        containers[2].reagents = []
        containers[2].addReagent("B:", 1, logger)
        containers[3].reagents = []
        containers[3].addReagent("A:", 1, logger)
        containers[4].reagents = []
        containers[4].addReagent("A:", 1, logger)
        containers[5].reagents = []
        containers[5].addReagent("B:", 1, logger)

        const pathways = []
        pathways.push(containers)

        return pathways

    } catch(e) {
        logger.log('error', '[RitterReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = RitterReverse