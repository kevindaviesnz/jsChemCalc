
const { map } = require('lodash');
const _ = require('lodash');
const { child } = require('winston');
const Constants = require("../Constants")
const Typecheck = require("../Typecheck");
const { P } = require('./PeriodicTable');


const standard_atom_symbols = ['C','N','O', 'H', 'Br', 'Cl', 'I','At','F']
const debug_level = 'debug'

/**
 * Converts a molecule to different formats.
 *
 * @param molecule
 * @returns {{SMILES: SMILES, IUPACName: IUPACName}}
 * @constructor
 *
 * See tests directory for examples of usage.
 */
const FormatAs = (molecule) => {

    if (['B:', 'CB:', 'RA:', 'A:', 'CA:'].indexOf(molecule) === false) {
        Typecheck(
            {name: "molecule", value: molecule, type: "object"}
        )
    }

    
    if (molecule === undefined || molecule === undefined) {
        throw new Error("Molecule is null or undefined")
    }


    const __SMILES = function (smiles, atom, atom_bond_type, atoms, ringbond_count, used_atom_ids) {


        Typecheck(
            {name: "smiles", value: smiles, type: "array"},
            {name: "atom_bond_type", value: atom_bond_type, type: "string"},
            {name: "atoms", value: atoms, type: "array"},
            {name: "ringbond_count", value: ringbond_count, type: "number"},
            {name: "used_atom_ids", value: used_atom_ids, type: "array"},
        )

        const atoms_no_hydrogens = atoms.filter((atom)=>{
            return 'H' !== atom.atomicSymbol
        })

        // Note that the first atom can have more than one bond eg benzene ring
        if ('H' !== atom.atomicSymbol) {
            addAtomToSmiles(smiles, atom, atoms, atom_bond_type)
            used_atom_ids.push(atom.atomId)
        }

        const child_bonds = childBonds(atom, atoms, used_atom_ids)

        // If atom has a ringbond count then we add the ringbond count
        // to smiles. Then we process the atom.
        smiles.push(atomRingBondNumber(atom))

        // If the atom is the end of a branch or a child ringbond atom then
        // add '), and return. Note that __SMILES() is called recursively
        // so even if we return from __SMILES() does not mean that we have
        // processed all the atoms.
        if (0 === child_bonds.length && isEndOfBranchAtom(atom, atoms))  {
            // Don't add ')' if atom is the very last atom
            if (used_atom_ids.length !== atoms_no_hydrogens.length) {
                smiles.push(')')
            }
            return true
        } 

        // If the atom is not the end of a branch then we get the bonds
        // and if there is more than bond we process each bond as
        // a branch. Bonds where the bonded atom has a child ringbond count
        // are not counted as the bonded atom would have already been 
        // processed as part of the parent ring.
        else if(child_bonds.length > 1) {
            for(i in child_bonds) {
                // We don't add ')' if it's the last branch of the current atom.
                if ((i*1) !== (child_bonds.length-1)*1) {
                    smiles.push('(')
                } else {
                }
                __SMILES(smiles, child_bonds[i].atom, child_bonds[i].bondType, atoms, ringbond_count, used_atom_ids)
            }
        } else if (child_bonds.length === 0) {
            // Child bonds length will be 0 if there are no branches and the next atom is a child ringbond 
        } else {
            // Here atom only has one bond and is not a parent ringbond atom
            __SMILES(smiles, child_bonds[0].atom, child_bonds[0].bondType, atoms, ringbond_count, used_atom_ids)
        }

    }

    const isLastAtom = function(atom, atoms) {
        // @todo this does not work correctly
        Typecheck(
            {name: "atom", value: atom, type: "object"},
        )

        const atoms_no_hydrogens = atoms.filter((a)=>{
            return 'H' !== a.atomicSymbol
        })
        const atom_ids = atoms_no_hydrogens.map((a)=>{
            return a.atomId
        })

        return atom_ids.indexOf(atom.atomId) === atoms_no_hydrogens.length -1
    }

    const isChildRingbondAtomOfCurrentAtom = function(atom, maybe_child_ringbond_atom) {
        
        Typecheck(
            {name: "atom", value: atom, type: "object"},
            {name: "maybe_child_ringbond_atom", value: maybe_child_ringbond_atom, type: "object"},
        )
        return 'parent' === atom.ringbondType()
            && 'child' === maybe_child_ringbond_atom.ringbondType()
            && atom.ringbondNumber() === maybe_child_ringbond_atom.ringbondNumber()
    }

    // Get bonds that are not parent bonds or child ringbond of the current atom.
    const childBonds = function(atom, atoms, used_atom_ids) {
        Typecheck(
            {name: "atom", value: atom, type: "object"},
            {name: "atoms", value: atoms, type: "array"},
            {name: "used_atom_ids", value: used_atom_ids, type: "array"},
        )
        return atom.bonds(atoms, false).filter((bond)=>{
            // We need to do this as otherwise a ring will
            // be erroneously counted as two branches.
            if (isChildRingbondAtomOfCurrentAtom(atom, bond.atom)) {
                return false
            }
            return -1 === used_atom_ids.indexOf(bond.atom.atomId)
        })
    }

    const addAtomToSmiles = function (smiles, atom, atoms, atom_bond_type) {
        Typecheck(
            {name: "smiles", value: smiles, type: "array"},
            {name: "atom", value: atom, type: "object"},
            {name: "atoms", value: atoms, type: "array"},
            {name: "atom_bond_type", value: atom_bond_type, type: "string"},
        )

        let s = atom_bond_type

        if (atom.atomicSymbol==='H') {
            return 
        }

        const charge = atom.charge( atoms)
        
        if (charge !==0 || standard_atom_symbols.indexOf(atom.atomicSymbol) === -1) {
            s +='['
        } 
        s+=atom.atomicSymbol
        if (charge === 1) {
            s+='+'
        }
        if (charge === -1) {
            s+='-'
        }
        if (charge !==0 || standard_atom_symbols.indexOf(atom.atomicSymbol) === -1) {
            s+=']'
        } 

        smiles.push(s)
    }

    const atomRingBondNumber= function(atom) {

        Typecheck(
            {name: "atom", value: atom, type: "object"}
        )

        const atom_ring_bond_number = atom.ringbondNumber()
        return 0===atom_ring_bond_number?'':atom_ring_bond_number
    }


    const isEndOfBranchAtom = function(atom, atoms) {

        Typecheck(
            {name: "atom", value: atom, type: "object"},
            {name: "atoms", value: atoms, type: "array"},
        )
    
        const atom_ids = atoms.map((a)=>{
            return a.atomId
        })

        const atom_index = atom_ids.indexOf(atom.atomId)

        if (0 === atom_index) {
            return false
        }

        // Atom is an end of branch atom if there is only one atom
        if (1 === atoms.length) {
            return true
        }


        if (atom.isTerminalAtom(atoms)) {
            return true
        }


        if ('child' === atom.ringbondType()) {
            return true
        }


        return false
    }



    const nextAtomIndex = function(atom, atoms) {
        Typecheck(
            {name: "atom", value: atom, type: "object"},
            {name: "atoms", value: atoms, type: "array"},
        )
        return 1
    }

    const addRingbondCountToChildRingBondAtom = function(child_atom_id, ringbond_count, atoms) {
        Typecheck(
            {name: "child_atom_id", value: child_atom_id, type: "string"},
            {name: "ringbond_count", value: ringbond_count, type: "number"},
            {name: "atoms", value: atoms, type: "array"},
        )
    }

    const childRingBondAtomId = function(parent_atom, atoms) {
        Typecheck(
            {name: "parent_atom", value: parent_atom, type: "array"},
            {name: "atoms", value: atoms, type: "array"},
        )
        // return either index of the child ring bond atom or false
        return 1

    }




    /**
     *
     * @param trunk_ids
     * @param current_atom_index
     * @param atom The atom we are trying to find the previous atom for
     * @param atoms
     * @returns {(boolean|undefined)|boolean}
     * Recursively find the previous atom. "current_atom_index" should start as
     * one less than the atom we are trying to find the previous atom for.
     */
    const findPreviousAtom = function(trunk_ids, current_atom_index, atom, atoms) {
        Typecheck(
            {name:"trunk_ids", value:trunk_ids, type:"array"},
            {name:"current atom index", value:current_atom_index, type:"number"},
            {name:"atom", value:atom, type:"array"},
            {name:"atoms", value:atoms, type:"array"},
        )

        if (current_atom_index < 0) {
            return false
        }

        if (trunk_ids[current_atom_index] === '(' ||
            trunk_ids[current_atom_index] === ')' ||
            trunk_ids[current_atom_index] === '#' ||
            trunk_ids[current_atom_index] === '=' ||
            trunk_ids[current_atom_index] === ']' ||
            trunk_ids[current_atom_index] === '[' ||
            trunk_ids[current_atom_index] === '+' ||
            trunk_ids[current_atom_index] === '-' ||
            typeof trunk_ids[current_atom_index] === 'number') {
            return findPreviousAtom(trunk_ids, current_atom_index -1, atom, atoms)
        }

        const possible_previous_atom = atoms.getAtomByAtomId(trunk_ids[current_atom_index])
        if (false === atom.isSingleBondedTo(possible_previous_atom) &&
            false === atom.isDoubleBondedTo(possible_previous_atom) &&
            false === atom.isTripleBondedTo(possible_previous_atom)) {
            return findPreviousAtom(trunk_ids, current_atom_index -1, atom, atoms)
        }

        return possible_previous_atom

    }

    /**
     * Convert array of atom ids to SMILES string
     *
     * @param atoms All molecule atoms
     * @param atoms_ids Atom ids of all molecule atoms as well as bond types, branch markers and ring bond markers.
     * @returns {string}
     *
     * Iterates through each atom id converting them to atomic symbol and adding to SMILES string. Bond types, branch and
     * ring bond markers are added to the SMILES string as is.
     */
    const convertAtomIdsToSmiles =  function(atoms, atoms_ids) {

        Typecheck(
            {name:"atoms_ids", value:atoms_ids, type:"array"},
            {name:"atoms", value:atoms, type:"array"},
        )

        let smiles= ''

        atoms_ids.map((atom_id, i)=>{
            if (atom_id === '(' || atom_id === ')' || typeof atom_id === 'number' || atom_id === '=' || atom_id === '#') {
                smiles+=atom_id // ()
            } else {
                const atom = atoms.getAtomByAtomId(atom_id)
                const charge = atom.charge( molecule.atoms)
                // @todo ++ charges etc
                if (charge !==0 || standard_atom_symbols.indexOf(atom.atomicSymbol) === -1) {
                    smiles+='['
                } 
                smiles+=atom.atomicSymbol
                if (charge === 1) {
                    smiles+='+'
                }
                if (charge === -1) {
                    smiles+='-'
                }
                if (charge !==0 || standard_atom_symbols.indexOf(atom.atomicSymbol) === -1) {
                    smiles+=']'
                } 

            }
            return atom_id

        })

        return smiles
    }

    /**
     * Adds bond types (=,#) to atom ids array.
     * @param atoms All atoms in the molecule.
     * @param trunk_ids Array of atom ids
     * @returns {*}
     *
     * Adds "=" and "#" to atom ids to indicate bond type.
     */
    const addBondTypes = function(atoms, trunk_ids) {

        Typecheck(
            {name:"atoms", value:atoms, type:"array"},
            {name:"trunk_ids", value: trunk_ids, type:"array"},
        )

        return trunk_ids.reduce((carry, a_id, i)=>{
            if (i>0 && a_id !== ')' && a_id !== ')' && typeof a_id !== 'number' && a_id !== '=' && a_id !== '#') {


                const current_atom = atoms.getAtomByAtomId(a_id)
                const previous_atom = findPreviousAtom(trunk_ids, i-1, current_atom, atoms)

                if (false !== previous_atom) {
/*
                    console.log('current atom')
                    console.log(current_atom)
                    console.log('previous atom')
                    console.log(previous_atom)
                    progress.error()
*/
                        if (previous_atom.isDoubleBondedTo(current_atom)) {
                            carry.push('=')
                        }
                        if (previous_atom.isTripleBondedTo(current_atom)) {
                            carry.push('#')
                        }
                }


            }
            carry.push(a_id)
            return carry

        }, [])

    }

    /**
     * Adds branch atom ids, bond types, branch and ring bond markers to main trunk atom ids
     *
     * @param atoms All atoms in molecule
     * @param main_trunk_atoms_ids Array of trunk atom ids.
     * @returns {*}
     */
    const addSubstituentAtomsIds = function(atoms, main_trunk_atoms_ids) {

      //  console.log('main trunk atom ids')
      //  console.log(main_trunk_atoms_ids)
        Typecheck(
            {name:"atoms", value:atoms, type:"array"},
            {name:"main_trunk_atoms_ids", value: main_trunk_atoms_ids, type:"array"}
        )

        const all_atoms_ids = atoms.map((atom)=>{
            return atom.atomId
        })

        // Get atom ids that are not in the main trunk atom ids array
        const non_trunk_atom_ids = _.difference(all_atoms_ids, main_trunk_atoms_ids)
        /*
        console.log(non_trunk_atom_ids.map((id)=>{
            if (typeof id === 'number' || ['=','#,','(',')'].indexOf(id) !==-1) {
                return id
            }
            const atom = atoms.getAtomByAtomId(id)
            return atom.atomicSymbol + '.' + id
        }))
        */


        // Convert non trunk atom ids to atoms
        let non_trunk_atoms = non_trunk_atom_ids.map((atom_id)=>{
            return atoms.getAtomByAtomId(atom_id)
        }).filter((atom_id)=>{
            return atom_id !== '(' && atom_id!==')'
        })

        // Set ringbond count to 0
        let ringbond_count = 0

        // Keep track of where to insert the branch, ringbond id.
        let position = 0

        // Step 1
        // Look for ring bond involving only main trunk atoms.
        // Find atom bonded to one of the previous atoms but not the directly previous atom
        let parent_ring_bond_atom_id = null
        //console.log(main_trunk_atoms_ids.length)

        _.cloneDeep(main_trunk_atoms_ids).map((possible_child_bond_atom_atom_id, i) => {
            if (i===0) {
                // Atom can't be a child ring bond atom if it's the first atom.
                return possible_child_bond_atom_atom_id
            }
            const possible_child_ring_bond_atom = atoms.getAtomByAtomId(possible_child_bond_atom_atom_id)
            const possible_child_ring_bond_atom_index = main_trunk_atoms_ids.indexOf(possible_child_bond_atom_atom_id)
            const possible_child_ring_bond_atom_bonds = possible_child_ring_bond_atom.bonds(atoms)
            // Get bonds that come before the child atom
            const possible_ringbond_bonds_to_parent = possible_child_ring_bond_atom_bonds.filter((bond)=>{
                const bond_index = main_trunk_atoms_ids.indexOf(bond.atom.atomId)
                return bond_index < possible_child_ring_bond_atom_index -2
            })
            if (possible_ringbond_bonds_to_parent.length > 0) {
                parent_ring_bond_atom_id = possible_ringbond_bonds_to_parent[0].atom.atomId
                if (main_trunk_atoms_ids.indexOf(parent_ring_bond_atom_id) !== -1
                    && main_trunk_atoms_ids.indexOf(possible_child_bond_atom_atom_id) !== -1) {
                    ringbond_count += 1
                    main_trunk_atoms_ids.splice(main_trunk_atoms_ids.indexOf(possible_child_bond_atom_atom_id) + 1, 0, ringbond_count)
                    main_trunk_atoms_ids.splice(main_trunk_atoms_ids.indexOf(parent_ring_bond_atom_id) + 1, 0, ringbond_count)
                }
            }
            return possible_child_bond_atom_atom_id
        })

        // Add bond types
        main_trunk_atoms_ids = addBondTypes(atoms, main_trunk_atoms_ids)

        // Step 2
        // Look for substituent branches and add to atom ids.
        // After adding a substituent branch check for ring bonds.
        _.cloneDeep(main_trunk_atoms_ids).map((main_trunk_atom_id, i)=>{

            // Filter bond type, branch and ring bond makers
            if (main_trunk_atom_id === ')' || main_trunk_atom_id === '(' || typeof main_trunk_atom_id === 'number' || main_trunk_atom_id === '=' || main_trunk_atom_id === '#') {
                return main_trunk_atom_id
            }

            // Convert curent main trunk atom id to atom
            const current_main_trunk_atom = atoms.getAtomByAtomId(main_trunk_atom_id)

            // We have a substituent branch if the current atom
            // has more than one bond and is the first atom,
            // or if it has more than two bonds.
            if ((i==0 && current_main_trunk_atom.bonds(atoms).length > 1) ||
                (current_main_trunk_atom.bonds(atoms).length > 2)) {

                if (non_trunk_atoms.length===0) {
                    return main_trunk_atom_id
                }

                // We have substituent branches on the current atom
                // Get atoms that are the descendents of the current atom but are not
                // main trunk atom.
                // These will be the atoms that make up the subsituent branch.
              //  console.log('non_trunk_atoms')
              //  console.log(non_trunk_atoms)
            //   console.log('child_branches***')
              //  console.log(branches(non_trunk_atoms))
            //    console.log('-----')



            const child_branches = branches(non_trunk_atoms, current_main_trunk_atom).filter((branch)=>{
                  const first_atom_on_branch = atoms.getAtomByAtomId(branch[branch.length-1])
                    return first_atom_on_branch.isBondedTo(current_main_trunk_atom)
                })

                

                /*
                // DEBUG - look for bond to nitrogen
                const current_main_trunk_atom_bonds = current_main_trunk_atom.bonds(atoms)
                if (current_main_trunk_atom_bonds.length === 4) {
                    const n_bond = _.find(current_main_trunk_atom_bonds, (b)=>{
                        return b.atom.atomicSymbol === 'N' && b
                    })
                    if (undefined !== n_bond) {
                        console.log(current_main_trunk_atom_bonds)
                        console.log(current_main_trunk_atom_bonds.length)
                        console.log('child branches---')
                        const cb = branches(non_trunk_atoms, current_main_trunk_atom)
                        console.log(cb)
                        console.log('H()) n bond found')
                        //process.exit()
                    }
                }
                */

                child_branches.map((substituent_branch_atoms_ids)=>{
                    if (undefined !== substituent_branch_atoms_ids) {

                        // Remove substituent ids from non_trunk_atoms
                        // This is so when we enter the loop again we are not using 'non trunk atoms'
                        // that have already been added to the main trunk atom ids array.
                        non_trunk_atoms = non_trunk_atoms.filter((non_trunk_atom) => {
                            return substituent_branch_atoms_ids.indexOf(non_trunk_atom.atomId) === -1
                        })

                        // @todo
                        //const substituent_branch_with_substituents = addSubstituents(non_trunk_atoms, child_trunk, depth+1)
                        let substituent_branch_with_substituents_ids = substituent_branch_atoms_ids

                        // This is for when both the start and end of the branch is bonded to the main trunk.
                        // If the end of the substituent branch is bonded to an atom on the main trunk  and is not a terminal atom then we
                        // need to mark the bond using ring bond id. Note that the end of the branch is the first atom
                        // in the branch array.
                        const substituent_branch_last_atom = atoms.getAtomByAtomId(substituent_branch_with_substituents_ids[0])
                      //  console.log('substituent_branch_last_atom')
                       // console.log(substituent_branch_last_atom.atomicSymbol)
                       // console.log(substituent_branch_last_atom.isTerminalAtom(atoms))

                       substituent_branch_with_substituents_ids = substituent_branch_with_substituents_ids.reverse()
                        
                        // Ringbonds 
                        if (true) {
                        _.cloneDeep(substituent_branch_with_substituents_ids).map((substituent_atom_id)=>{

                            // Look for atom on the main trunk that is bonded to the last atom on the substituent branch
                            // but is not the direct parent or child
                            const atom_on_main_trunk = _.find(all_atoms_ids, (m_a_id) => {
                                if (m_a_id === '(' || m_a_id === ')' || typeof m_a_id === 'number' || m_a_id === '=' || m_a_id === '#') {
                                    return false
                                }
                                if (m_a_id === substituent_branch_last_atom.atomId) {
                                    return false
                                }
                                const main_trunk_atom = atoms.getAtomByAtomId(m_a_id)
                                const subsituent_atom = atoms.getAtomByAtomId(substituent_atom_id)
                               
                               
                                // DEBUG
                                //if (true) { // subsituent_atom.atomicSymbol === 'N'
                                 //   console.log('subsituent_atom')
                                    const subsituent_atom_bonds = [...subsituent_atom.bonds(atoms), ...subsituent_atom.ionicBonds(atoms)]
                                    //const subsituent_atom_ionic_bonds = subsituent_atom.ionicBonds(atoms)
                                    if (subsituent_atom.isTerminalAtom(atoms)) {
                                        return false
                                   //     console.log('Subst atom is terminal atom so not a ring bond')
                                    }    


                                    // DEBUG check for 'K' ionic bond
                                    /*
                                    const k_bond = _.find(subsituent_atom_bonds, (b)=>{
                                        return b.atom.atomicSymbol === 'K'
                                    })
                                    */


                                    // DEBUGGING
                                   // if (true) { // undefined !== k_bond
                                        // N subst atom should be a ringbond

                                        //console.log('ringbond subst atom index')
                                        //console.log(all_atoms_ids.indexOf(subsituent_atom.atomId))
                                        //console.log('subst atom bonds')
                                        //console.log(subsituent_atom_bonds)
                                         // Look for child atom on that is bonded to the subst atom.
                                         //console.log(all_atoms_ids)
                                         //console.log(main_trunk_atoms_ids)

                                         //console.log('current main trunk atom')   
                                         //console.log(current_main_trunk_atom)

                                         const end_of_substituent_branch_main_trunk_bond_id = _.find(all_atoms_ids, (m_a_id) => {
                                            if (m_a_id === '(' || m_a_id === ')' || typeof m_a_id === 'number' || m_a_id === '=' || m_a_id === '#') {
                                                return false
                                            }
                                            if (m_a_id === subsituent_atom.atomId) {
                                                return false
                                            }
                                            const main_trunk_atom = atoms.getAtomByAtomId(m_a_id)
                                            return subsituent_atom.isBondedTo(main_trunk_atom)
                                        })
                                        //console.log('end_of_substituent_branch_main_trunk_bond_id')
                                        //console.log(end_of_substituent_branch_main_trunk_bond_id)
                                        if (end_of_substituent_branch_main_trunk_bond_id !== null) {
                                            // Add ring bound count to substituent branch atom ids
                                            // and to main trunk atom ids directly after the atom id of the atom
                                            // bonded to the atom at the end of the substituent branch.
                                            ringbond_count += 1
                                           // console.log('ringbond subst atom')
                                           // console.log(subsituent_atom)
                                            const substituent_atom_index = substituent_branch_atoms_ids.indexOf(subsituent_atom.atomId)
                                            //console.log('atom after subs atom index')
                                            const atom_id_after_substituent_atom_id =  substituent_branch_atoms_ids[substituent_atom_index+1]
                                            if (typeof atom_id_after_substituent_atom_id !== 'number') { // ringbond already added.
                                                substituent_branch_atoms_ids.splice(substituent_atom_index + 1, 0, ringbond_count)
                                                const end_of_substituent_branch_main_trunk_bond_index = main_trunk_atoms_ids.indexOf(end_of_substituent_branch_main_trunk_bond_id)
                                                main_trunk_atoms_ids.splice(end_of_substituent_branch_main_trunk_bond_index +1 , 0, ringbond_count) // not correct
                                            }
                                        }
                                       // console.log('main_trunk_atoms_ids')
                                       // console.log(subsituent_atom)
                                      // console.log(main_trunk_atoms_ids)
                                      //  console.log('substituent_branch_atoms_ids')
                                      //  console.log(substituent_branch_atoms_ids)
                                        // O=C([N-]2[K+])C1=CC=CC=C12C=O
                                        // O=C([N-]2[K+])C1=CC=CC=C1C2=O
                                       // console.log('FormatAs() l393')
                                      // process.exit()
                                  //  }    

                               // }
                    

                                return subsituent_atom.isBondedTo(main_trunk_atom)
                            })

                        })
                        }


                        if (false) {
                        if (substituent_branch_last_atom.isTerminalAtom(atoms)===false) {
                            if (current_main_trunk_atom.atomicSymbol === 'S') {
                                progress.error()
                            }
                            // Look for atom on the main trunk that is bonded to the last atom on the substituent branch.
                            const end_of_substituent_branch_main_trunk_bond_id = _.find(all_atoms_ids, (m_a_id) => {
                                if (m_a_id === '(' || m_a_id === ')' || typeof m_a_id === 'number' || m_a_id === '=' || m_a_id === '#') {
                                    return false
                                }
                                if (m_a_id === substituent_branch_last_atom.atomId) {
                                    return false
                                }
                                const main_trunk_atom = atoms.getAtomByAtomId(m_a_id)
                                return substituent_branch_last_atom.isBondedTo(main_trunk_atom)
                            })
                            if (end_of_substituent_branch_main_trunk_bond_id !== null) {
                                // Add ring bound count to substituent branch atom ids
                                // and to main trunk atom ids directly after the atom id of the atom
                                // bonded to the atom at the end of the substituent branch.
                                ringbond_count += 1
                               substituent_branch_atoms_ids.push(ringbond_count) // correct
                                const end_of_substituent_branch_main_trunk_bond_index = main_trunk_atoms_ids.indexOf(end_of_substituent_branch_main_trunk_bond_id)
                                main_trunk_atoms_ids.splice(end_of_substituent_branch_main_trunk_bond_index + 1, 0, ringbond_count) // not correct
                            }
                        }
                        }

                        // Add bond types
                        
                        substituent_branch_with_substituents_ids.unshift(main_trunk_atom_id)
                        const substituent_branch_with_substituents_ids_with_bond_types = addBondTypes(atoms, substituent_branch_with_substituents_ids)
                        substituent_branch_with_substituents_ids.shift()
                        substituent_branch_with_substituents_ids_with_bond_types.shift()

                        // Add branch markers to substituent branch atom ids.
                        substituent_branch_with_substituents_ids_with_bond_types.push(')')
                        substituent_branch_with_substituents_ids_with_bond_types.unshift('(')

                        // Insert the substituent branch into the main trunk
                        //main_trunk_atoms_ids.splice(i + 1, 0, ...substituent_branch_with_substituents_ids_with_bond_types)
                        main_trunk_atoms_ids.splice(main_trunk_atoms_ids.indexOf(main_trunk_atom_id)+1, 0, ...substituent_branch_with_substituents_ids_with_bond_types)

                        // Ringbonds
                        // @todo
                        /*
                        const maybe_parent_ringbond_atom = atoms.getAtomByAtomId(main_trunk_atom_id)
                        const ringbond_ids = []
                        const child_ring_bond_atom = isParentRingBondAtom(maybe_parent_ringbond_atom, atoms, ringbond_ids, main_trunk_atoms_ids, i)
                        console.log('maybe_parent_ringbond_atom:' + maybe_parent_ringbond_atom.atomId)
                        if (child_ring_bond_atom !== false) {
                            ringbond_count+=1
                            console.log('child_ring_bond_atom:' + child_ring_bond_atom.atomId)
                            const parent_ring_bond_atom_index = main_trunk_atoms_ids.indexOf(main_trunk_atom_id)
                            const child_ring_bond_atom_index = main_trunk_atoms_ids.indexOf(child_ring_bond_atom.atomId)
                            main_trunk_atoms_ids.splice(parent_ring_bond_atom_index + 1, 0, ringbond_count)
                            main_trunk_atoms_ids.splice(child_ring_bond_atom_index + 2, 0, ringbond_count)
                            console.log(main_trunk_atoms_ids)
                        }
                         */

                    }

                    return substituent_branch_atoms_ids

                }) // child_branches.map()

                /*
                if (i==1 || i==2) {
                    console.log("i:" + i)
                    console.log(child_branches)
                    console.log(main_trunk_atoms_ids)
                    if (i==2) {
                        progress.error()
                    }
                }
*/
                /*
                if (current_main_trunk_atom.atomicSymbol === 'S') {
                    console.log(main_trunk_atoms_ids)
                    progress.error()
                }

                 */

                return main_trunk_atom_id
            }
        })

        return main_trunk_atoms_ids


    }

    /**
     * Convert molecule atoms into an array where each element is an array
     * of atom ids where each atom id represents an atom bonded to the next atom.
     *
     * @param atoms_no_hyrogens All atoms in the molecule
     * @returns {string[][]}
     */
    const branches = (atoms_no_hyrogens, parent_atom, debug)=>{

        Typecheck(
            {name:"atoms_no_hyrogens", value:atoms_no_hyrogens, type:"array"},
            {name:"atoms_no_hyrogens first atom", value:atoms_no_hyrogens[0], type:"array"},
        )

        if (undefined === atoms_no_hyrogens) {
            throw new Error('atoms_no_hyrogens parameter is undefined')
        }

        // Make sure hydrogen atoms have been removed.
        atoms_no_hyrogens = atoms_no_hyrogens.filter((atom)=> {
            return atom.atomicSymbol !== "H"
        })

        if (atoms_no_hyrogens.length === 1) {
            return [[atoms_no_hyrogens[0].atomId]]
        }

        // Hack
        if (atoms_no_hyrogens.length === 2 
            &&  atoms_no_hyrogens[0].isBondedTo(atoms_no_hyrogens[1], atoms_no_hyrogens) === true) {
                if(undefined !== parent_atom) {
                      if (atoms_no_hyrogens[0].isBondedTo(parent_atom)) {
                         return [[atoms_no_hyrogens[1].atomId, atoms_no_hyrogens[0].atomId ]]
                      }
                }
                return [[atoms_no_hyrogens[0].atomId, atoms_no_hyrogens[1].atomId ]]

        }

        let branches = [[]]
        let used_ids = []
        let i = 0

        // Get branches starting from each atom.
        // We will later filter branches that do not start from a
        // terminal atom or do not start from an atom that marks
        // a beginning of a ring.
        for(i in atoms_no_hyrogens) {

            used_ids = []
            let starting_atom = atoms_no_hyrogens[i]
            let atoms_copy = _.cloneDeep(atoms_no_hyrogens)

            // Remove starting atom from atoms
            _.remove(atoms_copy, (atom) => {

                    return atom.atomId === starting_atom.atomId
            })

            let atoms_count = 0
            let current_atom = starting_atom
            let atoms = _.cloneDeep(atoms_no_hyrogens)
            let current_atom_id = branches

            do {

                // Get current atom bonds that have not already been processed.
                const current_atom_bonds = current_atom.bonds(atoms).filter((bond) => {
                    return used_ids.indexOf(bond.atom.atomId) === -1
                })
                // Add current atom id to array of used ids.
                used_ids.push(current_atom.atomId)
                current_atom_id = current_atom.atomId
                // Add current atom id to current branch
                branches[branches.length - 1].push(current_atom_id)
                if (current_atom_bonds.length === 0) {
                    // Current atom has no more bonds to process so
                    // remove it from atoms and push the current branch.
                    _.remove(atoms, (atom) => {
                        return atom.atomId === current_atom.atomId
                    })
                    used_ids = []
                    current_atom = starting_atom
                    atoms_count++
                    branches.push([])
                } else {
                    current_atom = current_atom_bonds[0].atom
                }

            } while (atoms_count < atoms_copy.length)

        }


        branches = branches.filter((branch)=>{
            return branch.length > 0
        })

        // Sort branches by length
        const branches_sorted = branches.sort((branch_1, branch_2)=>{
            return branch_1.length > branch_2.length? -1: 1
        })


        const branches_sorted_and_filtered = branches_sorted.filter((branch)=>{
            // @todo hack - assumes first atom in trunk must be a terminal atom
            const first_atom = atoms_no_hyrogens.getAtomByAtomId(branch[0])
            //console.log('parent atom----')
            //console.log(parent_atom)
            if (undefined === parent_atom) {
                return first_atom.isTerminalAtom(atoms_no_hyrogens)
            } else {
                // If we have a parent atom then the first atom must be bonded to the parent atom.
                //console.log('first_atom')
                //console.log(first_atom)
                return first_atom.isSingleBondedTo(parent_atom) ||
                first_atom.isDoubleBondedTo(parent_atom) ||
                first_atom.isTripleBondedTo(parent_atom) ||
                first_atom.isIonicBondedTo(parent_atom) ||
                parent_atom.isIonicBondedTo(first_atom)
            }
        })



        if (branches_sorted_and_filtered.length === 0) {
            /*
            console.log('line526')
            console.log(branches_sorted)
            console.log(_.uniqWith(branches_sorted, (v1,v2)=>{
                return _.isEqual(v1,v2)
            }))
             */
            return _.uniqWith(branches_sorted, (v1,v2)=>{
                return _.isEqual(v1,v2)
            })
        }
        // eg benzene
        /*
        if (branches_sorted.length===0) {
            branches_sorted = branches.sort((branch_1, branch_2)=>{
                return Object.keys(branch_1).length > Object.keys(branch_2).length? -1: 1
            })
        }

         */

        // Convert branches from objects to arrays.
        /*
        const b = branches_sorted.map((branch)=>{
                return Object.keys(branch)
            }
        )
         */

        /*
        console.log('branches---')
        console.log(_.uniqWith(branches_sorted_and_filtered, (v1,v2)=>{
            return !_.isEqual(v1,v2)
        }))
        */


        if (debug) {
            console.log('FormatAs() branches_sorted_and_filtered')
            //console.log(branches_sorted_and_filtered)
            const u_b = _.uniqWith(branches_sorted_and_filtered, (v1,v2)=>{
                return _.isEqual(v1,v2)
            })
            console.log(u_b)
        }

        // Make sure each branch is unique and return
       return _.uniqWith(branches_sorted_and_filtered, (v1,v2)=>{
        return _.isEqual(v1,v2)
    })

    }


    return {

        // @todo Add JSON

        IUPACName: function(atoms, is_substituent) {

            return 'To be completed.'
            // Get the longest branch of atoms
            // 'Atoms' should only be set if we are processing a substituent branch.
            if (atoms === undefined) {
                atoms = molecule.atoms
            }
            const branches = this.branches(atoms)

            let branch_with_substituents = this.addSubstituents(atoms, branches[0], [],0)

            // Get suffix
            let suffix = ''
            if (molecule.isAlkane()) {
                suffix = 'ane'
            }

            // Get prefix
            const prefix_map = [
                'meth',
                'eth',
                'prop',
                'but',
                'pent',
                'hex',
                'hept',
                'oct',
                'non',
                'dec',
                'undec',
                'dodec'
            ]

            const prefix = prefix_map[Object.keys(branches[0]).length -1] + (is_substituent !== undefined? 'yl':'')

            // Determine if we read the branch from top down or down up
            let atom_id = ''
            let i = 1
            let first_substituent_point_top_down = 0
            for(atom_id in branch_with_substituents) {
                if (branch_with_substituents[atom_id].length > 0) {
                    first_substituent_point_top_down = i
                    break
                }
                i++
            }
            let first_substituent_point_down_up = 0
            for(atom_id in branch_with_substituents.reverse()) {
                if (branch_with_substituents[atom_id].length > 0) {
                    first_substituent_point_down_up = i
                    break
                }
                i++
            }
            // eg [ '4hv': [], '4hx': [ '4i3': [] ], '4hz': [], '4i1': [] ]
            branch_with_substituents = first_substituent_point_down_up > first_substituent_point_top_down? branch_with_substitents:branch_with_substituents.reverse()

            // Get array of substituent strings
            const substituents = Object.keys(branch_with_substituents).map((atom_id, i)=>{
                // eg [], [ '4i3': [] ], [], []
                let row = branch_with_substituents[atom_id]
                if (Object.keys(row).length > 0) {
                    const carbon_count = Object.keys(row).length
                    const prefix = prefix_map[carbon_count-1] + 'yl'
                    row = (i+1) + '-' + prefix
                } else {
                    row = ''
                }
                return row
            }).filter((row)=>{
                return row.length > 0
            }).sort((prefix1, prefix2)=>{
                return prefix1.substring(2) > prefix2.substring(2)
            })

            // Substituents example:
            // [ '2-methyl' ]

            // Combine prefixes
            // eg ['2-methyl', '3-methyl'] -> ['2,3-methyl']
            const substitutents_prefixes_merged = substituents.reduce((carry, prefix_with_number, index, arr)=>{
                if (index === 0) {
                    carry.push(prefix_with_number)
                } else {
                    const group = prefix_with_number.substring(2)
                    if (carry[index-1].substring(2) === group) {
                        carry[index-1] = carry[index-1].replace('-'+group,','+prefix_with_number)
                    }
                }
                return carry
            }, [])

            // Example substitutents_prefixes_merged
            // [ '2-methyl' ]

            // Add in group prefixes
            const group_prefixes = [
                '',
                'di',
                'tri',
                'tetra',
                'penta',
                'hexa',
                'hepta',
                'octa',
                'nona',
                'deca'
            ]
            // eg [ '2,3-methyl' ] - > [ '2,3-dimethyl ]
            const substitutents_prefixes_with_group_prefixed = substitutents_prefixes_merged.map((prefix)=>{
                // eg  '2,3-methyl'
                // Get string up to the '-'
                const parts = prefix.split('-')
                // Add group prefix according to length above
                const group_prefix = group_prefixes[parts[0].split(',').length-1]
                return parts[0] + "-" + group_prefix + parts[1]

            })

            // Example substitutents_prefixes_with_group_prefixed
            // [ '2-methyl' ]
            return nomenclature = substitutents_prefixes_with_group_prefixed.join('-') + prefix + suffix

        },

        /**
         * Converts molecule to SMILES
         *
         * @returns {string|*}
         * @constructor
         */
         SMILESOld : function () {



            if (typeof molecule === 'string') {
                return molecule // eg 'B:', etc
            }
            // Initiations and checks.
            let smiles = ''
            let atoms = null

         //   console.log('FormatAs() molecule')
         //   console.log(molecule)


//            console.log('FormatAs() 924')
 //           console.log(atoms)
 //           console.log(typeof atoms)
 //           console.log(atoms.length)

            if (typeof atoms === 'string') {
                return atoms // RA:, etc
            }

            if (atoms.length === 1 && atoms[0].atomicSymbol === "H") {
                // @todo repeated code
                const atom = atoms[0]
                if (atom.charge( atoms) !== 0 && atom.charge( atoms) !== '' || standard_atom_symbols.indexOf(atom.atomicSymbol)===-1) {
                    smiles = '['
                }
                smiles+="H"
                if (atom.charge( atoms) === 1 || atom.charge( atoms) === '+') {
                    smiles += '+'
                }
                if (atom.charge( atoms) === -1 || atom.charge(atoms) === '-') {
                    smiles += '-'
                }
                if (atom.charge( atoms) !== 0 && atom.charge( atoms) !== '' || standard_atom_symbols.indexOf(atom.atomicSymbol)===-1) {
                    smiles += ']'
                }
                return smiles
            }

            const atoms_no_hydrogens = atoms.filter((atom)=>{
                return atom.atomicSymbol !== 'H'
            })
            const net_charge = molecule.netCharge() // use to check overall charge
            const net_double_bond_count = molecule.netDoubleBondCount()

            // Only one non hydrogen so no need to do branches etc
            if (atoms_no_hydrogens.length === 1) {
                const atom = atoms_no_hydrogens[0]
                if (atom.charge( atoms) !== 0 && atom.charge( atoms) !== '' || standard_atom_symbols.indexOf(atom.atomicSymbol)==-1) {
                    smiles = '['
                }
                smiles+=atom.atomicSymbol
                if (atom.charge( atoms) === 1 || atom.charge( atoms) === '+') {
                    smiles += '+'
                }
                if (atom.charge( atoms) === -1 || atom.charge( atoms) === '-') {
                    smiles += '-'
                }

                if (atom.charge( atoms) !== 0 && atom.charge(atoms) !== ''|| standard_atom_symbols.indexOf(atom.atomicSymbol)===-1) {
                    smiles += ']'
                }
                return smiles
            }


            //console.log('branches')
            //console.log(branches(atoms))


            const main_trunk = branches(atoms)[0]
            let main_trunk_with_substituents = []

            /*
            console.log('main trunk')
            console.log(main_trunk.map((id)=>{
                if (typeof id === 'number' || ['=','#,','(',')'].indexOf(id) !==-1) {
                    return id
                }
                const atom = atoms.getAtomByAtomId(id)
                return atom.atomicSymbol + '.' + id
            }))
            */

            // Check if main trunk atom has no bonds
            if (atoms_no_hydrogens.length == 2 && main_trunk.length === 1 && atoms.getAtomByAtomId(main_trunk[0]).bonds(atoms).length === 0) {
                main_trunk_with_substituents.push(atoms_no_hydrogens[0].atomId)
                main_trunk_with_substituents.push(atoms_no_hydrogens[1].atomId)
            } else {

               main_trunk_with_substituents = addSubstituentAtomsIds(_.cloneDeep(atoms_no_hydrogens), main_trunk)
               
               /*
               console.log('main trunk with substituents')
               console.log(main_trunk_with_substituents.map((id)=>{
                  if (typeof id === 'number' || ['=','#,','(',')'].indexOf(id) !==-1) {
                      return id
                  }
                  const atom = atoms.getAtomByAtomId(id)
                  return atom.atomicSymbol + '.' + id
               }))
               */
               

            }


            // Checks
                if (main_trunk_with_substituents.filter((atom_id)=>{
                    return atom_id !== '('  &&atom_id !== ')' && atom_id !== '=' && atom_id !== '#' && typeof atom_id !=='number'
                }).length !== atoms_no_hydrogens.length){
                    throw new Error("Warning: Number of atoms in main trunk and subsituents does not match the number of atoms in the molecule.")
                }

            return convertAtomIdsToSmiles(atoms_no_hydrogens, main_trunk_with_substituents)

        },


        JSON : function() {
            //throw new Error('AFter deprotonation first oxygen has wrong number of electroin pairs')

            const json = {}
            json.id = molecule.id
            json.pKa = molecule.pKa
            json.conjugateBase = molecule.conjugateBase
            json.conjugateAcid = molecule.conjugateAcid
            json['molecularFormula'] = molecule.molecularFormula
            json['IUPACName'] = molecule.IUPACName
            json['charge'] = molecule.charge
            json['heavyAtomCount'] = molecule.heavyAtomCount
            json.tags = molecule.tags
            json.netDoubleBondCount = molecule.netDoubleBondCount
            json.isWeakBase = molecule.isWeakBase
            json.isWeakLewisBase = molecule.isWeakLewisBase
            json.isStrongLewisBase = molecule.isStrongLewisBase
            json.isStrongAcid = molecule.isStrongAcid
            json.atomCount = molecule.atoms.filter((atom)=>{
                return atom.atomicSymbol !== 'H'
            }).length,
            json.hydrogenCount = molecule.atoms.filter((atom)=>{
                return atom.atomicSymbol === 'H'
            }).length,
            json.bonds = molecule.atoms.filter((atom)=>{
                return atom.atomicSymbol !== 'H'
            }).map((atom=>{
                const b = []
                const bonds = atom.bonds(molecule.atoms)
                bonds.map((bond)=>{
                    b.push(bond.parent.atomicSymbol + bond.parent.index + bond.bondType + bond.atom.atomicSymbol + bond.atom.index)
                    return b
                })
                return b
            }))
            json.atoms = molecule.atoms.map((atom)=>{
                const a = {}
                a.atomId = atom.atomId,
                a.atomicSymbol = atom.atomicSymbol,
                a.properties = {}
                a.properties.atomicNumber = atom.atomicNumber,
                a.properties.valenceElectronsCount = atom.valenceElectronsCount,
                a.properties.neutralAtomNumberOfBonds = atom.neutralAtomNumberOfBonds,
                a.charge = atom.charge(molecule.atoms),
                a.properties.electronegativity = atom.electronegativity,
                a.properties.atomSize = atom.atomSize,
                a.properties.neutralAtomOutershellElectronCount = atom.neutralAtomOutershellElectronCount,
                a.index = atom.index,
                a.properties.electronsPerShell = atom.electronsPerShell,
                a.properties.electronPairs = atom.electronPairs,
                a.properties.outershellMaxNumberOfElectrons = atom.outershellMaxNumberOfElectrons, 
                a.properties.freeElectrons = atom.freeElectrons(),
                a.bondCount = atom.bondCount(),
                a.properties.freeSlots = atom.freeSlots(),
                a.properties.electronCount = atom.electronCount(),
                a.properties.electrons = atom.electrons(),
                a.bonds = atom.bonds(molecule.atoms),
                a.properties.isHalide = atom.isHalide(),
                a.properties.nonBondedElectrons = atom.nonBondedElectrons(),
                a.properties.isTerminalAtom = atom.isTerminalAtom(molecule.atoms),
                a.bondCountNoHydrogens = atom.bondCountNoHydrogens(molecule.atoms),
                a.hydrogens = atom.hydrogens(molecule.atoms),
                a.tripleBonds = atom.tripleBonds(molecule.atoms),
                a.carbonBonds = atom.carbonBonds(molecule.atoms),
                a.ionicBonds = atom.ionicBonds(molecule.atoms),
                a.doubleBonds = atom.doubleBonds(molecule.atoms),
                a.properties.isCarbocation = atom.isCarbocation(molecule.atoms),
                a.bondCountAsSingleBonds = atom.bondCountAsSingleBonds(molecule.atoms),
                a.singleBonds = atom.singleBonds(molecule.atoms),
                a.properties.carbons = atom.carbons(molecule.atoms)
                return a
            })

            return json


        },

          /**
         * Converts molecule to SMILES
         *
         * @returns {string|*}
         * @constructor
         */
        SMILES : function () {



                //const atoms = molecule.atoms.atomsNoHydrogens()
                const atoms = molecule.atoms
                const smiles = []
                const used_atom_ids = []
                const atom_bond_type = ''
                __SMILES(smiles, atoms[0], atom_bond_type, atoms, 1, used_atom_ids)
                const smiles_as_string = smiles.reduce((item, carry)=>{
                    return item + carry
                }, '')

                return smiles_as_string




        }

    }
}


module.exports = FormatAs



