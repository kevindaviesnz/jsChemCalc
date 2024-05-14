
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')


const ReplaceAtom = (molecule, atom, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"atom", value:atom, type:"array"},
            {name:"logger", value:logger, type:"object"}
        )

        const molecule_atoms = molecule.atoms

        atom_index = _.findIndex(molecule_atoms, (_atom)=>{
            return _atom.atomId === atom.atomId
        })

        molecule_atoms[atom_index] = atom

        return MoleculeFactory(
            molecule_atoms,
            false,
            false,
            logger
        )



    } catch(e) {
        logger.log('error', 'ReplaceAtom() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = ReplaceAtom