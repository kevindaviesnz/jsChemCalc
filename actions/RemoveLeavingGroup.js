
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')
const RemoveAtoms = require('../actions/RemoveAtoms')


const RemoveLeavingGroup = (molecule) =>{

   if (typeof molecule === "string") {
      return false
   }
         // Get molecule atoms
         const atoms = molecule.atoms

         // Get leaving group (group of atoms)
         const leaving_group = ExtractLeavingGroups(_.cloneDeep(molecule))[0]
         if (undefined === leaving_group || false === leaving_group){
            return false
        }

         const leaving_group_atom_ids = leaving_group.map((a)=>{
            return a.atomId
         })


         _.remove(molecule.atoms, (atom) => {
            return leaving_group_atom_ids.indexOf(atom.atomId)!== -1
         })
          
         // Determine parent carbon (the point at which the leaving group breaks)
         const parent_carbon = leaving_group[0].carbonBonds(atoms)[0].atom
         
         // Remove electon pair from carbon
        const shared_carbon_atom_electron_pair = parent_carbon.sharedElectronPairs(leaving_group[0])[0];
        _.remove(parent_carbon.electronPairs, (ep) => _.isEqual(ep, shared_carbon_atom_electron_pair));

        // Convert electron pair on leaving group atom to single electrons.
        const shared_target_atom_electron_pair = [...shared_carbon_atom_electron_pair].reverse();
        _.remove(leaving_group[0].electronPairs, (ep) => _.isEqual(ep, shared_target_atom_electron_pair));
        leaving_group[0].electronPairs.push([shared_target_atom_electron_pair[0]])
        leaving_group[0].electronPairs.push([shared_target_atom_electron_pair[1]])


         // Create new molecule using the leaving group atoms
         const leaving_group_molecule = MoleculeFactory(
             leaving_group,
             false,
             false
         )
 
         molecule = MoleculeFactory(
            molecule.atoms,
            false,
            false
        )

        return [molecule, leaving_group_molecule]
    




}

module.exports = RemoveLeavingGroup