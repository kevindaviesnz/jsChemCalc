
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const _ = require('lodash');
const should = require('should')

const RenderMolecule = (molecule) =>{

    Typecheck(
        {name:"molecule", value:molecule, type:"object"}
    )

    const atoms = _.cloneDeep(molecule.atoms)
    return molecule.atoms.reduce((carry, atom) => {
        if (atom.atomicSymbol !=="H") {
            if (!Array.isArray(atom)) {
                console.log(atom)
                throw new Error('Atom should be an array')
            }
            carry += atom.atomicSymbol
            const hydrogens = atom.hydrogens(molecule.atoms)
            if(hydrogens.length > 1) {
                carry += "H" + hydrogens.length
            }
            // Charge
            carry += atom.charge( atoms, logger) !==""?atom.charge( atoms, logger):""

        }
        return carry
    }, "")


}

module.exports = RenderMolecule