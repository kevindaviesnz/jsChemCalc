
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');

/**
 * Given two atoms determines what atom is the most base.
 * Atoms do not have to be from the same molecule. 
 * Returns -1 if the first atom is more base than the second atom
 * and 1 if the second atom is more base than the firsts atom. 
 * 
 * @see https://gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/
 * 
 * @param {*} base_atom_1 
 * @param {*} base_atom_2 
 * @param {*} base_atom_1_molecule 
 * @param {*} base_atom_2_molecule 
 * @returns int
 */
const FindMostBaseLewisAtom = (base_atom_1, base_atom_2, base_atom_1_molecule, base_atom_2_molecule, logger) =>{


    // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Supplemental_Modules_(Organic_Chemistry)/Amines/Synthesis_of_Amines/Gabriel_Synthesis
    // An atom bonded to a carbon that has a double bond is less base.
    // For now atoms must be terminal atoms
    if (
        base_atom_1.charge(base_atom_1_molecule.atoms, logger) === -1 
        && base_atom_1.atomicSymbol == 'O'
        && base_atom_1.isTerminalAtom(base_atom_1_molecule.atoms)
        && base_atom_2.charge(base_atom_2_molecule.atoms, logger) === -1 
        && base_atom_2.isTerminalAtom(base_atom_2_molecule.atoms)
        && base_atom_2.atomicSymbol == 'O'
    ) {

        const base_atom_1_carbon_bonds = base_atom_1.carbonBonds(base_atom_1_molecule.atoms)
        let base_atom_1_has_distributed_charge = false
        if (base_atom_1_carbon_bonds.length ===1) {
            const carbon = base_atom_1_carbon_bonds[0].atom
            const carbon_double_bonds = carbon.doubleBonds(base_atom_1_molecule.atoms)
            if(carbon_double_bonds.length > 0 ) {
                base_atom_1_has_distributed_charge = true
            }
        }

        const base_atom_2_carbon_bonds = base_atom_2.carbonBonds(base_atom_2_molecule.atoms)
        let base_atom_2_has_distributed_charge = false
        if (base_atom_2_carbon_bonds.length ===1) {
            const carbon = base_atom_2_carbon_bonds[0].atom
            const carbon_double_bonds = carbon.doubleBonds(base_atom_2_molecule.atoms)
            if(carbon_double_bonds.length > 0 ) {
                base_atom_2_has_distributed_charge = true
            }
        }


        if (base_atom_1_has_distributed_charge && !base_atom_2_has_distributed_charge) {
            return -1
        }
        if (base_atom_2_has_distributed_charge && !base_atom_1_has_distributed_charge) {
            return 1
        }

    }

    if (true) {

    // Most base atom will be the last atom.

     /*
        If compare(a,b) is less than zero, the sort() method sorts a to a lower index than b. In other words, a will come first.
        If compare(a,b) is greater than zero, the sort() method sort b to a lower index than a, i.e., b will come first.
        If compare(a,b) returns zero, the sort() method considers a equals b and leaves their positions unchanged.
     */
    
    // Chlorine is more acidic than oxygen
    // If atom 1 is chlorine and atom 2 is oxygen then put chlorine before oxygen
    if (base_atom_1[Constants().atom_charge_index]==="Cl") {
        if(base_atom_2[Constants().atom_charge_index]==="O") {
            return 1
        }
    }

    // If atom 1 is nitrogen and atom 1 has a double bond and atom 2 is oxygen
    // and atom 2 has no double bonds then pit oxygen before nitrogen.
    // @see https://en.wikipedia.org/wiki/Ritter_reaction


    if (base_atom_1.atomicSymbol === 'N' 
    && base_atom_1.doubleBonds(base_atom_1_molecule.atoms).length ===1
    && base_atom_2.atomicSymbol === 'O'
    && base_atom_2.doubleBonds(base_atom_2_molecule.atoms).length ===0
    ) {
        return -1
    }

    if (base_atom_2.atomicSymbol === 'O' 
        && base_atom_2.doubleBonds(base_atom_2_molecule.atoms).length ===1
        && base_atom_1.atomicSymbol === 'N'
    ) {
        return -1
    }

    if (base_atom_1.atomicSymbol === 'O' && base_atom_2.atomicSymbol === 'N') {
        return -1 
    }


    // The greater the charge on the atom holding the proton the less basic
    if (base_atom_1[Constants().atom_charge_index] < base_atom_2[Constants().atom_charge_index]) return 1;
    if (base_atom_2[Constants().atom_charge_index] > base_atom_1[Constants().atom_charge_index]) return -1;
    
    // The more electronegative an atom is the more it is able to hold onto electrons and the less base.
    if (base_atom_1[Constants().atom_electronegativity_index] < base_atom_2[Constants().atom_electronegativity_index]) return 1;
    if (base_atom_2[Constants().atom_electronegativity_index] > base_atom_1[Constants().atom_electronegativity_index]) return -1;

    // The bigger an atom is the more it is able to hold onto a proton and therefore the more base.
    if (base_atom_1[Constants().atom_size_index] < base_atom_2[Constants().atom_size_index]) return -1;
    if (base_atom_2[Constants().atom_size_index] > base_atom_1[Constants().atom_size_index]) return 1;
    }

    // Most base atom will be the last atom.
    
    // @todo resonance
    // @todo induction
    // @todo oribital

    return 0


}

module.exports = FindMostBaseLewisAtom