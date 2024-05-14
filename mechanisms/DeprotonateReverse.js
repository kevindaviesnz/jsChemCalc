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
const AcidBase = require("../reactions/AcidBase");
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom");
const { at } = require("lodash");



const env = require('../env')



// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const DeprotonateReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {

    /*    if (env.profiler_on) {
            console.time('deprotonateReverse')
        } */

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "container_after_previous_mechanism_was_applied.substrate", value: container_after_previous_mechanism_was_applied.substrate, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        /*const actual_number_of_hydrogens2 = container_after_previous_mechanism_was_applied.substrate.atoms.actualNumberOfHydrogens('DeprotonateReverse1', logger)
        const calculated_number_of_hydrogens2 = container_after_previous_mechanism_was_applied.substrate.atoms.calculatedNumberOfHydrogens('DeprotonateReverse1', logger)
        if (actual_number_of_hydrogens2 !== calculated_number_of_hydrogens2) {
            console.log('DeprotonateReverse2 incorrect hydrogens')
            process.exit()
        }*/

        //container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('DeprotonateReverse', logger)
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        /*if (computed_previous_container.getSubstrate()[0].atoms.filter((a)=>{
            return a.charge(
                computed_previous_container.getSubstrate()[0].atoms,
                logger
            ) === 1
        }).length > 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[DeprotonateReverse] The molecule we are attempting to reverse deprotonate has an atom with a positive charge.').bgYellow)
            }
          //  return false
        }*/

       /* const actual_number_of_hydrogens1 = computed_previous_container.getSubstrate()[0].atoms.actualNumberOfHydrogens('DeprotonateReverse1', logger)
        const calculated_number_of_hydrogens1 = computed_previous_container.getSubstrate()[0].atoms.calculatedNumberOfHydrogens('DeprotonateReverse1', logger)
        if (actual_number_of_hydrogens1 !== calculated_number_of_hydrogens1) {
            console.log('DeprotonateReverse1 incorrect hydrogens')
            process.exit()
        }*/
        
        // Remove any base reagents as we add A: as a separate step after the base has been consumed.
        computed_previous_container.removeReagent('B:', logger)
        computed_previous_container.addReagent('A:', 1, logger)

        // Get the atom most likely to have been deprotonated, excluding atoms that most likely were protonated.
        const atoms = computed_previous_container.getSubstrate()[0].atoms.filter((a)=>{
            return a.atomicSymbol !== 'C' 
            && a.charge(computed_previous_container.getSubstrate()[0].atoms, logger) !== 1
           // && 0 === a.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length
        })
        if (0 === atoms.length) {
            if (env.debug) {
                logger.log(env.debug_log, ('[DeprotonateReverse] Could not find any atoms that could have been deprotonated').bgRed)
            }
            return false
        }
        
        const base_molecule = _.cloneDeep(computed_previous_container.getSubstrate()[0])
        base_molecule.atoms = atoms

        // @todo need to get all possible deprotonated atoms
        let base_atom = null
        // Look for oxygen with double bond
        // @see https://en.wikipedia.org/wiki/Ritter_reaction
        base_atom = _.find(base_molecule.atoms, (a)=>{
            return 'O' === a.atomicSymbol && a.doubleBonds(computed_previous_container.getSubstrate()[0].atoms, logger).length === 1
        })

        if (undefined === base_atom) {
             // Look for terminal oxygen
            // @see https://en.wikipedia.org/wiki/Ritter_reaction
            base_atom = _.find(base_molecule.atoms, (a)=>{
                return 'O' === a.atomicSymbol && a.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms) === true
            })
        }

        if (undefined === base_atom) {
            base_atom = BronstedLoweryBaseAtom(base_molecule, logger)
        }

        if (undefined !== base_atom) {
            atom_to_protonate = computed_previous_container.getSubstrate()[0].atoms.getAtomByAtomId(base_atom.atomId)
        }

        if (null === atom_to_protonate) {
            if (env.debug) {
                logger.log(env.debug_log, ('[DeprotonateReverse] Could not find an atom that could have been deprotonated').bgRed)
            }
            return false
        }

        // @rule if atom to protonate is a nitrogen and already has a hydrogen then do not protonate
        if ('N' === atom_to_protonate.atomicSymbol && atom_to_protonate.hydrogens(atoms).length > 1) {
            if (env.debug) {
                logger.log(env.debug_log, ('[DeprotonateReverse] Cannot protonate a nitrogen that has two or more hydrogens').bgRed)
            }
            return false
        }

        const carbocation_bonds = atom_to_protonate.bonds(computed_previous_container.getSubstrate()[0].atoms).filter(b=>{
            return b.atom.isCarbocation(computed_previous_container.getSubstrate()[0].atoms, logger)
        })
        
        if (carbocation_bonds.length > 0 && 0 === atom_to_protonate.charge(computed_previous_container.getSubstrate()[0].atoms, logger)){
            // @rule If atom to protonate has a neutral charge and is attached to a carbocation do not protonate
            if (env.debug) {
                logger.log(env.debug_log, ('[DeprotonateReverse] Cannot protonate an atom with a neutral charge that is bonded to a carbocation as otherwise we will end up with a carbocation bonded to a positive atom').bgRed)
            }
            return false
        }

        const proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)
        proton[Constants().electron_index] = []

        computed_previous_container.getSubstrate()[0].atoms.push(proton)

        computed_previous_container.getSubstrate()[0].atoms = atom_to_protonate.bondAtomToAtom(
            proton,
            true, 
            computed_previous_container.getSubstrate()[0].atoms, 
            logger
        )

        computed_previous_container.mechanism = "deprotonate"
        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
        computed_previous_container.removeReagent('A:', logger)
        computed_previous_container.removeReagent('B:', logger)
        computed_previous_container.addReagent('B:', 1, logger)
        pathways.push([computed_previous_container])

        return pathways


    } catch(e) {
        logger.log('error', '[DeprotonateReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = DeprotonateReverse