const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const { C } = require("../factories/PeriodicTable");

const env = require('../env')


const BondAtomToAtomInSameMoleculeReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    // @todo This should not result in the formation of two separate molecules.
        
    try {


        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)


        // For now look for just double bonds where parent atom is carbon and child atom is non carbon
         const double_bonds = computed_previous_container.getSubstrate()[0].atoms.filter((atom) => {
            return (atom.atomicSymbol === 'O' || atom.atomicSymbol === 'N') && atom.doubleBonds(computed_previous_container.getSubstrate()[0].atoms).length === 1
         }).map((atom) => {
            return atom.doubleBonds(container_after_previous_mechanism_was_applied.substrate.atoms)[0]
        })
        
        if (double_bonds.length === 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[BondAtomToAtomInSameMoleculeReverse] Could not find a double bond to reverse').bgRed)
            }
            return false
        }

        const bond_to_reverse = double_bonds[0]


        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
// "CC(C)([N+]C(=O))CC"
        const base_atom = bond_to_reverse.parent 
        const target_atom = bond_to_reverse.atom // carbon
        const base_atom_in_computed_previous_container = computed_previous_container.getSubstrate()[0].atoms.getAtomByAtomId(base_atom.atomId)
        const target_atom_in_computed_previous_container = computed_previous_container.getSubstrate()[0].atoms.getAtomByAtomId(target_atom.atomId)

        const target_atom_shared_electron_pairs = target_atom_in_computed_previous_container.sharedElectronPairs(base_atom_in_computed_previous_container)
        const base_atom_shared_electron_pairs = base_atom_in_computed_previous_container.sharedElectronPairs(target_atom_in_computed_previous_container)


       //computed_previous_container.getSubstrate()[0].atoms.checkBonds('BondAtomToAtomInSameMoleculeReverse1',logger)
    
       // Remove a shared electron pair from the target atom
      //  if (env.debug) {
       //     logger.log(env.debug_log, ('[BondAtomToAtomReverse] Removing shared electron pairs from target atom ' + target_atom_in_computed_previous_container.atomicSymbol + ' charge ' + target_atom_in_computed_previous_container.charge(container_after_previous_mechanism_was_applied.substrate.atoms, logger)).bgYellow)
        //}
        _.remove(target_atom_in_computed_previous_container.electronPairs, (electron_pair)=>{
            return _.isEqual(electron_pair, target_atom_shared_electron_pairs[0])
        })

        // Remove "same" shared electron pair from the base atom
        if (env.debug) {
            logger.log(env.debug_log, ('[BondAtomToAtomReverse] Removing shared electron pairs from base atom ' + base_atom_in_computed_previous_container.atomicSymbol + ' charge ' + base_atom_in_computed_previous_container.charge(container_after_previous_mechanism_was_applied.substrate.atoms, logger)).bgYellow)
        }
        _.remove(base_atom_in_computed_previous_container.electronPairs, (electron_pair)=>{
            return _.isEqual(electron_pair, base_atom_shared_electron_pairs[0])
        })

        // Readd electron pair to base atom as single electrons
        if (env.debug) {
            logger.log(env.debug_log, ('[BondAtomToAtomReverse] Re-adding shared electron pairs to base atom as single electrons ' +base_atom_in_computed_previous_container.atomicSymbol + ' charge ' + base_atom_in_computed_previous_container.charge(container_after_previous_mechanism_was_applied.substrate.atoms, logger)).bgYellow)
        }
        base_atom_in_computed_previous_container.electronPairs.push([base_atom_shared_electron_pairs[0][0]])
        base_atom_in_computed_previous_container.electronPairs.push([base_atom_shared_electron_pairs[0][1]])

        // Check we don't have a positive atom bonded to a carbocation
        const target_atom_bonds = target_atom_in_computed_previous_container.bonds(computed_previous_container.getSubstrate()[0].atoms, false)

        // 23 Feb
        /*
        if (target_atom_in_computed_previous_container.isCarbocation(computed_previous_container.getSubstrate()[0].atoms, logger)) {
            const atom_with_positive_charge = _.find(target_atom_bonds, (bond)=>{
                return bond.atom.charge( atoms, logger) === 1 
            })
            if (undefined !== atom_with_positive_charge) {
                if (env.errors) {
                    logger.log(env.error_log, ('[BondAtomToAtomInSameMoleculeReverse] Error. Carbocation found that is bonded to an atom with a positive charge - '
                    + container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger)).bgRed)
                }
                return false
            }
        }
        */

        // Check if the base atom is a carbocation
        // If it is and is attached to a nitrogen then create a N=C bond.
        // @see ritter reaction
        if (target_atom_in_computed_previous_container.isCarbocation(computed_previous_container.getSubstrate()[0].atoms, logger)) {
            const nitrogen_bond = _.find(target_atom_in_computed_previous_container.singleBonds(computed_previous_container.getSubstrate()[0].atoms), (bond)=>{
                                return bond.atom.atomicSymbol === 'N'
            })
                                                    
                                            
             if (undefined !== nitrogen_bond && nitrogen_bond.atom.freeElectrons() > 1) {
                target_atom_in_computed_previous_container.atoms = target_atom_in_computed_previous_container.bondAtomToAtom(
                    nitrogen_bond.atom, 
                    false, 
                    logger
                )
             }

        }



        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false

        if (env.debug) {
            if (env.debug) {
                logger.log(env.debug_log, ('[BondAtomToAtomInSameMoleculeReverse] Updated computed previous container substrate').bgYellow)
            }
        }


                
        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false
        // CC(C)([N+]C(=O))CC -> CC(C)([N+][C+](C))[O-]C
        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
        
        pathways.push([computed_previous_container])

        return pathways


    } catch(e) {
        console.log('[BondAtomToAtomInSameMoleculeReverse] ' + e.stack)
        process.exit()
        if (env.errors) {
            logger.log(env.error_log, ('[BondAtomToAtomInSameMoleculeReverse] ' + e.stack).bgRed)
        }
    }
}

module.exports = BondAtomToAtomInSameMoleculeReverse