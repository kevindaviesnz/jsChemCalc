const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const FindBreakBondToCarbonAtom =  require('../reflection/FindBreakBondToCarbonAtom')
const _ = require('lodash');

const colors = require('colors');

colors.enable()

const RemoveAtoms = require('../actions/RemoveAtoms')
/*

Bond two atoms together within the same molecule.


 */

/*

Params in: container

 */

/*

IF CALL getSourceAtomTargetAtomBond using source atom, target atom
    REMOVE electron pair from source atom
ELSE
    COPY electron pair from source atom to target atom
ENDIF

 */

const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const FormatAs = require('../factories/FormatAs');
const { N, C } = require("../factories/PeriodicTable");
const MakeCarbocation = require('../actions/MakeCarbocation')
const MoleculeFactory = require('../factories/MoleculeFactory')

const env = require('../env')

const BondAtomToAtomInSameMolecule = (container, logger) => {


    try {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "molecule atoms", value: container.getSubstrate()[0].atoms, type: "array"},
            {name: "logger", value: logger, type: "logger"},
        )
    
    //    const starting_substrate = _.cloneDeep(container.getSubstrate()[0])

        // Lewis base is a molecule that can donate an electron pair
        const base_atom = LewisBaseAtom(container.getSubstrate()[0], logger)

        if (undefined === base_atom) {
            if (env.debug) {
                logger.log(env.debug_log, '[BondAtomToAtomInSameMolecule] Could not find base atom so no proceeding with bonding atom to atom in same molecule.')
            }
            return false
        }

        /*if (!Array.isArray(base_atom)) {
            throw new Error('Base atom should be an array')
        }*/

        const base_atom_free_electrons = base_atom.freeElectrons().filter((electron_pair)=>{
            return electron_pair.length === 1
        })

        if (base_atom_free_electrons.length < 2) {
            return false
        }

        let target_atom = null

        // Look for acid atom
        target_atom = LewisAcidAtom(container.getSubstrate()[0], logger)

        if (undefined === target_atom) {

            // @todo - See Wittig
            // https://courses.lumenlearning.com/suny-potsdam-organicchemistry2/chapter/20-4-the-wittig-reaction/
            // Look for a phosphorous atom
            target_atom = _.find(container.getSubstrate()[0].atoms, (atom)=>{
                    return 'C' !== base_atom.atomicSymbol && 'P' === atom.atomicSymbol
            })
        

            if (undefined === target_atom) {
                // Find atom that can accept an electron pair.
                // Look for X[C+] bond first, then XC
                let target_atom_bond = null
                if (undefined === target_atom) {
                    target_atom_bond = _.find(base_atom.bonds(container.getSubstrate()[0].atoms), (bond)=>{
                        return (bond.atom.isCarbocation(container.getSubstrate()[0].atoms, logger) === true)
                    })
                }   
                if (undefined === target_atom_bond) {
                    target_atom_bond = _.find(base_atom.bonds(container.getSubstrate()[0].atoms), (bond)=>{
                        return bond.atom.atomicSymbol === 'C'
                    })
                }
                if (undefined === target_atom_bond) {
                    return false
                }
                target_atom = target_atom_bond.atom
            }

            if (target_atom.atomicSymbol === "C" && target_atom.bondCount() === 4 && base_atom.isDoubleBondedTo(target_atom)) {
                return false
            }

            // @todo
            // @see https://en.wikipedia.org/wiki/Ritter_reaction
            /*
                'O' === base_atom.atomicSymbol 
                && 'C' === target_atom.atomicSymbol 
                && 1 !== target_atom.tripleBonds(container.getSubstrate()[0].atoms).length
                && false === target_atom.isCarbocation(container.getSubstrate()[0].atoms, logger)) {
                    logger.log('debug', '[BondAtomToAtomInSameMolecule] Not bonding oxygen to carbon')
                return false
            }
            */

            if (undefined === target_atom || false === target_atom) {
                if (env.debug) {
                    logger.log(env.debug_log, ('[BondAtomToAtomInSameMolecule] Target atom not found.').bgRed)
                }
                return false
            }


        }


        /*
        const base_atom_electron_pair = [
            base_atom.atomicSymbol + target_atom.atomicSymbol + '.' + base_atom.atomId + '.new', // pushed to target atom as second electron in pair
            target_atom.atomicSymbol + base_atom.atomicSymbol + '.' + target_atom.atomId + '.new' // pushed to target atom as first electron in pair
        ]
        */
    
        const target_atom_free_slots = target_atom.freeSlots()
        if (target_atom_free_slots.length === 0 && target_atom.atomicSymbol !== "C") {
            return false
        }
    
        let extracted_atoms = []


        // Special case - phosphorous
        // @todo
        // @see https://courses.lumenlearning.com/suny-potsdam-organicchemistry2/chapter/20-4-the-wittig-reaction/
        try {
            if ("P" === target_atom.atomicSymbol) {
    
                // need to remove one of the bonds to carbon.
                if (target_atom.bondCount() === 5) {
                    // Break PC bond where C is not a ring bond parent
                    const non_parent_bonds = target_atom.bonds(container.getSubstrate()[0].atoms, logger).filter((bond)=>{
                        return 'C' === bond.atom.atomicSymbol && 'parent' !== bond.atom.ringbondType()
                    })
                    if (non_parent_bonds.length > 1) {
                     //   console.log(non_parent_bonds.length)
                        throw new Error('Phosphorous is target atom but unable to determine what C-P bond to break')
                    }
                    // Break bond between P-C, moving electrons to carbon atom. C should now have a negative charge.
                   // non_parent_bonds[0].atom.breakBond(target_atom, container.getSubstrate()[0], logger)
                   target_atom.breakBond(non_parent_bonds[0].atom, container.getSubstrate()[0], logger)
                   // console.log(non_parent_bonds[0].atom)
                    container.getSubstrate()[0].atoms.map((a)=>{
                        if(a.atomicSymbol!=='H') {
                           //  console.log(a)
                        }
                        return a
                    })
//                    throw new Error('got here')
                }
            }
        } catch(e) {
            return false
        }

        // If target atom is a carbon then it must be a carbocation
        if (false === target_atom.isCarbocation(container.getSubstrate()[0].atoms, logger)) {
            return false
        }



        // 20 Feb 2023
        // Changed from container.getSubstrate()[0].atoms = base_atom.bondAtomToAtom(target_atom, false, container.getSubstrate()[0].atoms, logger)
        container.getSubstrate()[0].atoms = base_atom.makeDativeBond(target_atom, false, container.getSubstrate()[0].atoms, logger)

        if (extracted_atoms.length > 0) {
            const MoleculeFactory = require('./factories/MoleculeFactory')

            extracted_atoms_molecule = MoleculeFactory = (
                extracted_atoms,
                false,
                false,
                logger
            )
            container.getSubstrate()[0] = RemoveAtoms(container.getSubstrate()[0], extracted_atoms, logger)    
        }


    } catch(e) {
        console.log(e.stack)
        if (env.errors) {
            logger.log(env.error_log, '[BondAtomToAtomInSameMolecule] '+e.stack)
        }
        process.exit()
    }

 


}


module.exports = BondAtomToAtomInSameMolecule