
const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const _ = require('lodash');
//const { loggers } = require('winston')
const AddAtomsToMolecule = require('../actions/AddAtomsToMolecule');
const RemoveAtom = require('../actions/RemoveAtom');
const AddAtom = require('../actions/AddAtom');
const MoleculeFactory = require('../factories/MoleculeFactory');

const NucleophillicAttack = (
    electron_pair_acceptor_molecule, // pass a copy
    electron_pair_acceptor_atom, // pass a copy
    electron_pair_donor_molecule,
    electron_pair_donor_atom,

) => {


       //  @see https://en.wikiversity.org/wiki/Reactivity_and_Mechanism
       if (_.isEqual(electron_pair_acceptor_atom, electron_pair_donor_molecule)) {
           throw new Error('[NucleophilicAttack] Electron pair acceptor molecule and electon pair donor molecule cannot be the same.')
       }


       // If required make a carbocation.
       let double_bond_to_oxygen = null
       if (electron_pair_acceptor_atom.atomicSymbol === 'C' && electron_pair_acceptor_atom.freeElectrons().length === 0) {
            // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
            // Check if the atom is a carbonyl carbon where the carbonyl carbon has a positive charge and if it is break one of the C=O bonds.
            double_bond_to_oxygen = _.find(electron_pair_acceptor_atom.doubleBonds(electron_pair_acceptor_molecule[0].atoms), (db)=>{
                return db.atom.atomicSymbol == 'O' && db.atom.charge(electron_pair_acceptor_molecule[0].atoms)
            })
            if (undefined !== double_bond_to_oxygen) {
                // @todo
               // electron_pair_acceptor_atom.breakBond(double_bond_to_oxygen.atom, electron_pair_acceptor_molecule)
               const electron_pair_acceptor_atom_shared_electron_pairs = electron_pair_acceptor_atom.sharedElectronPairs(double_bond_to_oxygen.atom)
               const double_bond_to_oxygen_shared_electron_pairs = double_bond_to_oxygen.atom.sharedElectronPairs(electron_pair_acceptor_atom)
               electron_pair_acceptor_atom.electronPairs = electron_pair_acceptor_atom.electronPairs.filter((ep)=>{
                    return !_.isEqual(ep, electron_pair_acceptor_atom_shared_electron_pairs[0]) // only remove one of the electron pairs
               })
               double_bond_to_oxygen.atom.electronPairs = double_bond_to_oxygen.atom.electronPairs.filter((ep)=>{
                    return !_.isEqual(ep, double_bond_to_oxygen_shared_electron_pairs[0]) // only remove one of the electron pairs
               })
               double_bond_to_oxygen.atom.electronPairs.push([double_bond_to_oxygen_shared_electron_pairs[0][0]])
               double_bond_to_oxygen.atom.electronPairs.push([double_bond_to_oxygen_shared_electron_pairs[0][1]])
            }
       }

       electron_pair_donor_atom.makeDativeBond(electron_pair_acceptor_atom, false, electron_pair_acceptor_molecule)

       electron_pair_donor_molecule[0].atoms.map((atom)=>{
           electron_pair_acceptor_molecule[0].atoms.push(atom)
           return atom
       })


       electron_pair_acceptor_molecule[0] = MoleculeFactory(
            electron_pair_acceptor_molecule[0].atoms,
            false,
            false
       )

       return electron_pair_acceptor_molecule



    return electron_pair_donor_molecule

}


module.exports = NucleophillicAttack