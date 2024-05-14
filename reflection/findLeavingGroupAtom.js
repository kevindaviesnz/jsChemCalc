/*
Leaving groups in order

tosylate @todo
I, Br, Cl, F

hydroxide ion (OH-), alkoxdies (RO-), and amide ion (NH20) make bond leaving groups as they are strong bases.

SET leaving group to null
SET leaving group atoms to I,Br,CL,F
GET leaving group atom
CALL findLeavingGroupAtom using leaving group atom
    IF leaving group atom found
        BREAK BOND between leaving group atom and non terminal carbon
        GET atoms bonded to leaving group atom
        REMOVE leaving group atom and atoms bonded to leaving group from molecule EXCEPT carbon atom
        CREATE new molecule USING leaving group atom AND atoms bonded to leaving group atom
    ELSE
       CALL findLeavingGroupAtom using next leaving group atom
    END

RETURN leaving group

 */

const MoleculeFactory = require('../factories/MoleculeFactory')
const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const _ = require('lodash');

const findLeavingGroupAtom = (molecule) => {

    Typecheck(
        {name: "molecule", value: molecule, type: "object"},
    )

    const findLeavingGroupAtomRecursive = (index, leaving_group_atoms_symbols) =>{

        const leaving_group_atom_symbol_to_find = leaving_group_atoms_symbols[index]

        const atoms = molecule.atoms.filter((atom)=>{
            return atom.atomicSymbol !=='H'
        })

        let leaving_group_atom = _.find(atoms, (atom)=>{
            if (atom.atomicSymbol !== leaving_group_atom_symbol_to_find) {
                return false
            }
            if (atom.bondCount(atoms) !== 1) {
                return false
            }
            // Checking atom is attached to carbon
            const carbon_bond = atom.carbonBonds(atoms).pop()
            return carbon_bond !==null
        })

        if (leaving_group_atom !==false) {
            return leaving_group_atom
        } else {
            leaving_group_atom = findLeavingGroupAtomRecursive(index+1, leaving_group_atoms_symbols)
        }

        return leaving_group_atom
    }

    const leaving_group_atoms_symbols = ['Br', 'I','Br','Cl','F']
    const leaving_group_atom = findLeavingGroupAtomRecursive(0, leaving_group_atoms_symbols)

    return leaving_group_atom


}

module.exports = findLeavingGroupAtom