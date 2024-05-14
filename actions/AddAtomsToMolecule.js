
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')

const AddAtomsToMolecule = (molecule, atoms, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"atoms", value:atoms, type:"array"},
            {name:"logger", value:logger, type:"object"}
        )

        const molecule_atoms = molecule.atoms
    
        atoms.map((atom)=>{
            molecule_atoms.push(atom)
        })

        
       return MoleculeFactory(
             molecule_atoms,
             molecule.conjugateBase,
             molecule.conjugateAcid,
             logger
       )
    

    } catch(e) {
        logger.log('error', 'AddAtomsToMolecule() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = AddAtomsToMolecule