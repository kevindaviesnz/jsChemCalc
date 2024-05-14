
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ExtractAtomGroup = require('../actions/ExtractAtomGroup')

const ExtractOHLeavingGroups = (molecule) =>{


        const atoms = molecule.atoms

        const oxygen_atoms = atoms.filter((atom)=>{
            if (atom.atomicSymbol === 'O') {
                const charge = atom.charge(atoms)
                const number_of_hydrogens = atom.hydrogens(atoms).length
                const is_terminal_atom = atom.isTerminalAtom(atoms)
                return charge === 1 && is_terminal_atom && number_of_hydrogens === 2
            }
            return false
        })

        if (oxygen_atoms.length === 0) {
            return []
        }

        let oh_leaving_groups = []
        oxygen_atoms.map((oxygen_atom)=>{
                const carbons = oxygen_atom.carbons(atoms)
                if (carbons.length ===1) {
                    const leaving_group = ExtractAtomGroup(molecule,atoms, carbons[0], oxygen_atom)
                    oh_leaving_groups.push(leaving_group)
                }
            return oxygen_atom
        })

        return oh_leaving_groups

    




}

module.exports = ExtractOHLeavingGroups