const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory');
const { C } = require("../factories/PeriodicTable");


const ExtractAtomGroup = (molecule, atoms, parent_atom, first_child_atom) => {



     //   molecule.atoms.checkBonds('ExtractAtomGroup')

        const extractAtomsRecursively = (leaving_group, parent_atom, current_child_atom, safety) =>{


            const leaving_group_atom_ids =  leaving_group.map((atom) => {
                return atom.atomId
            })

            if (leaving_group_atom_ids.indexOf(current_child_atom.atomId) !== -1) {
                //console.log('extractAtomsRecursively()')
                const ringbond_type = current_child_atom.ringbondType()
                if ('' !== ringbond_type) {
                    return
                }
                throw new Error('atom id has already been used ' +ringbond_type)
            }

            leaving_group.push(current_child_atom)
               
            if (safety > 100) {
                throw new Error('Too much recursion')
            }

            const atoms_bonded_to_current_atom = current_child_atom.bonds(atoms, false).filter((bond) => {
                return bond.atom.atomId !== parent_atom.atomId
            }).map((bond) => {
                    return bond.atom
            })

            if (atoms_bonded_to_current_atom.length === 0) {
                return
            }

            // Check for leaving group that can't be removed
            for(i in atoms_bonded_to_current_atom) {
                extractAtomsRecursively(leaving_group, current_child_atom, atoms_bonded_to_current_atom[i], safety++)
            }

        }


        /*
            Extract a group of bonded atoms. As a requirement the atoms must be
            able to be attached at a single point, defined by parent atom and child atom.
            Child atom will be the first atom in the groups of atoms. We do this by reiterating
            through atoms starting from the child atom, saving each terminal atom to an array (including hydrogens),
            removing each terminal atom until there are atoms in the group left. If we end up
            with the same amount of atoms as in the whole molecule then return false. Otherwise return
            the saved atoms
             */

            if (first_child_atom.isSingleBondedTo(parent_atom) === false &&  first_child_atom.isDoubleBondedTo(parent_atom) === false && first_child_atom.isTripleBondedTo(parent_atom) === false) {
                const parent_atom_bonds = parent_atom.bonds(molecule.atoms, false)
                const first_child_atom_bonds = first_child_atom.bonds(molecule.atoms, false)
                const is_single_bonded_to = first_child_atom.isSingleBondedTo(parent_atom)
                const is_double_bonded_to = first_child_atom.isSingleBondedTo(parent_atom)
                const is_triple_bonded_to = first_child_atom.isTripleBondedTo(parent_atom)
                const is_ionic_bonded_to = first_child_atom.isIonicBondedTo(parent_atom)
                throw new Error('Child atom is not bonded to parent atom')
            }

       if (first_child_atom.isDoubleBondedTo(parent_atom) === true
            || first_child_atom.isTripleBondedTo(parent_atom) === true) {
            throw new Error('ExtractAtomGroup() Child atom is double or triple bonded to parent atom')
        }

     //   molecule.atoms.checkBonds('ExtractAtomGroup')            

        // This is the latest point at which we can break the first child parent bond.
        // Error: creates carbon with lone pairs
        if ('C' === parent_atom.atomicSymbol) {
            // Get shared electrons
            const shared_electron_pairs = parent_atom.sharedElectronPairs(first_child_atom)
            // Removing matching shared electron pair from carbon atom
            parent_atom.electronPairs = parent_atom.electronPairs.filter((p)=>{
                return !_.isEqual(p, shared_electron_pairs[0])
            })
            molecule.atoms = molecule.atoms.map((a)=>{
                if (a.atomId === parent_atom.atomId) {
                    a = parent_atom
                }
                return a
            })
        } else {
            molecule.atoms = parent_atom.breakBond(first_child_atom, molecule)
        }

    //    molecule.atoms.checkBonds('ExtractAtomGroup')            


            // Move hydrogens from child atom to leaving group
        let leaving_group = []

        // eg [O+], Halide
        // Extracting a single atom
        const first_child_atom_bonds = (first_child_atom).bonds(atoms)
        const atoms_copy = _.cloneDeep(atoms)
            if (first_child_atom_bonds.filter((bond)=>{
                return bond.atom.atomicSymbol !== 'H'
            }).length === 0) {
                leaving_group.push(first_child_atom)
                atoms.map((atom)=>{
                    if (atom.atomicSymbol==='H' && atom.isSingleBondedTo(first_child_atom)) {
                        leaving_group.push(atom)
                        _.remove(atoms_copy, (_atom)=>{
                                return _atom.atomId ===atom.atomId
                        })

                    }
                })


                return leaving_group
        }

        let current_child_atom = first_child_atom
        let first_atom_bonded_to_current_atom = null
        // leaving_group.push(first_child_atom)

        let safety = 0
        let child_atom = first_child_atom

        extractAtomsRecursively(leaving_group, parent_atom, current_child_atom, 0)

        if (leaving_group !== false) {

                // Get hydrogens for each leaving group atom and add to leaving group
                leaving_group_hydrogens = []
                for(i in leaving_group) {
                    //console.log(leaving_group[i])
                    const hydrogens = leaving_group[i].hydrogens(molecule.atoms)
                    //console.log(hydrogens)
                    leaving_group_hydrogens = [...leaving_group_hydrogens,...hydrogens]
                }

                leaving_group = [...leaving_group, ...leaving_group_hydrogens]

                const leaving_group_atom_ids = leaving_group.map((a)=>{
                    return a.atomId
                })


                molecule.atoms = molecule.atoms.filter((atom)=>{
                    return leaving_group_atom_ids.indexOf(atom.atomId) === -1
                })

               // molecule.atoms.checkBonds('ExtractAtomGroup')
               molecule.conjugateAcid = false
                 molecule.conjugateBase = false



        }
        // This is an array of atoms.
        return leaving_group



 
 }



module.exports = ExtractAtomGroup