
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')


const ExtractHalideLeavingGroups = (molecule, atoms) =>{


        let halide_leaving_groups = []
        atoms.map((atom, atom_index) => {
            if (atom.isHalide()) {
                const halide_atom = atom
                if (halide_atom.bonds(atoms).length === 1) {
                    const carbon = halide_atom.carbons(atoms)[0]
                    if (undefined !== carbon && null !== carbon) {
                        halide_leaving_groups.push([halide_atom])
                    }
                }
            }
            return atom
        })

        return halide_leaving_groups
    




}

module.exports = ExtractHalideLeavingGroups