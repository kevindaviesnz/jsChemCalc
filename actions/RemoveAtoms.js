
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')


const RemoveAtoms = (molecule, atoms_to_remove, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"molecule atoms", value:molecule.atoms, type:"array"},
            {name:"atoms_to_remove", value:atoms_to_remove, type:"array"},
            {name:"logger", value:logger, type:"object"}
        )

        const molecule_atoms = molecule.atoms

        atoms_to_remove.map((atom)=>{
            try {
                _.remove(molecule_atoms, (molecule_atom)=>{
                    return molecule_atom.atomId === atom.atomId
                })
            } catch(e) {
                logger.log('error', 'RemoveAtoms() '+e.stack)
                console.log(e.stack)
                process.exit()
            }
        })


        if (typeof molecule !== "object" || Object.prototype.toString.call(molecule) === '[object Array]') {
            throw new Error('Molecule should be an array')
        }

        if(Object.prototype.toString.call(molecule.atoms) !== '[object Array]'){
            throw new Error('Molecule atoms should be an array')
        }

        return molecule_atoms

    } catch(e) {
        logger.log('error', 'RemoveAtom() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = RemoveAtoms