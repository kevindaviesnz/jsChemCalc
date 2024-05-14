
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')
const RemoveAtoms = require('../actions/RemoveAtoms')


const RemoveLeavingGroup = (molecule, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"logger", value:logger, type:"object"}
        )

        const molecule_atoms = molecule.atoms

        let leaving_groups = null
        try {
            leaving_groups = ExtractLeavingGroups(molecule, logger)
            if (leaving_groups.length === 0) {
                throw new Error('RemoveLeavingGroup() No leaving group found')
            }
        } catch(e) {
            logger.log('info','RemoveLeavingGroup() ' + e)
            return false
        }

        // Remove leaving group
        const leaving_group_atom = leaving_groups[0][0]

        // Determine parent carbon (the point at which the leaving group breaks)
        try {
            if (leaving_group_atom.carbonBonds(molecule_atoms).length === 0) {
                throw new Error('RemoveLeavingGroup() Leaving group atom should have a bond to carbon.')
            }
        } catch(e) {
            console.log(e)
            logger.log('debug',e)
            return false
        }

        const parent_carbon = leaving_group_atom.carbonBonds(molecule_atoms)[0].atom
        // Break bond between leaving group atom and parent carbon
        // 'this' is the atom that will keep the electrons.
        // Break bond by "collapsing" electron pair onto "this"
        // After breaking the bond the "this" should have an additional charge and
        // the "atom" should have one less charge.
        // Protypes.breakBond(atom, molecule, logger)
        //leaving_group_atom.breakBond(parent_carbon, molecule, logger)
        parent_carbon.breakBond(leaving_group_atom, molecule, logger)

         // Verify that the leaving group atom now has a neutral charge
        if(leaving_group_atom.charge( leaving_groups[0],logger) !== 0){
            throw new Error("RemoveLeavingGroup() Removal of leaving group should have resulted in a positive charge on the leaving group atom")
        }

        // Create new molecule using the leaving group atoms
        const leaving_group_molecule =  MoleculeFactory(
            leaving_groups[0],
            logger
        )

        RemoveAtoms(molecule,leaving_group_molecule.atoms, logger)

        const new_molecule =  MoleculeFactory (
            molecule_atoms,
            logger
        )
        return {
            'molecule':new_molecule,
            'leaving_group':leaving_group_molecule
        }
    

    } catch(e) {
        logger.log('error', 'RemoveAtom() '+e.stack)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = RemoveLeavingGroup