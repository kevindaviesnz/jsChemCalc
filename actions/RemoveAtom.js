
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')


const RemoveAtom = (molecule, atom, logger, return_molecule) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"atom", value:atom, type:"array"},
            {name:"logger", value:logger, type:"object"}
        )

        const molecule_atoms = molecule.atoms

        _.remove(molecule_atoms, (a)=>{
            if (_.isEqual(a.atomId, atom.atomId)){
                 return true
             }
             return false
        })

        return return_molecule === false? molecule_atoms:MoleculeFactory (
            molecule_atoms,
            false,
            false,
            logger
        )
    

    } catch(e) {
        logger.log('error', 'RemoveAtom() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = RemoveAtom