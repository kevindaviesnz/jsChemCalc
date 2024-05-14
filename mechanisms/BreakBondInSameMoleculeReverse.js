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
const Protonate = require('../mechanisms/Protonate')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')

// @see Ritter reaction
const env = require('../env')

const BreakBondInSameMoleculeReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

        
    // @todo This should not result in a reagent being added
    
        try {

            // @see https://chem.libretexts.org/Courses/Purdue/Purdue%3A_Chem_26605%3A_Organic_Chemistry_II_(Lipton)/Chapter_11.__Addition_to_pi_Systems/11.1%3A_Electrophilic

            Typecheck(
                {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
                {name: "logger", value: logger, type: "object"}
            )

            const pathways = []

            if (env.debug) {
                const smiles_string = container_after_previous_mechanism_was_applied.substrate.smiles_string === undefined?
                    container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger)
                    : container_after_previous_mechanism_was_applied.substrate.smiles_string
                logger.log(env.debug_log, '[BreakBondInSameMoleculeReverse] Reversing ' + smiles_string)
            }


            const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

            if (false === BondAtomToAtomInSameMolecule(computed_previous_container, logger)) {
                if (env.debug) {
                    logger.log(env.debug_log, ('[BreakBondInSameMoleculeReverse] Path ended - no suitable atoms found').bgRed)
                }
                return false
            }

      //      computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
        pathways.push([computed_previous_container])

        return pathways

                
        } catch(e) {
            logger.log('error', ('[BreakBondInSameMoleculeReverse] ' + e).bgRed)
            console.log(e.stack)
            process.exit()
        }


}

module.exports = BreakBondInSameMoleculeReverse