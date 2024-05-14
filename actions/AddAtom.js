
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')


const AddAtom = (molecule, atom, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"atom", value:atom, type:"array"},
            {name:"logger", value:logger, type:"object"}
        )

        const molecule_atoms = molecule.atoms

        _.remove(molecule_atoms, (a)=>{
            return _.isEqual(a.atomId, atom.atomId)
        })

        molecule_atoms.push(atom)

        return molecule.atoms
    

    } catch(e) {
        logger.log('error', 'AddAtom() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = AddAtom