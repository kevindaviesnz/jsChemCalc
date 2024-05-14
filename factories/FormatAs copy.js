
const { map, last } = require('lodash');
const _ = require('lodash');
const { child } = require('winston');
const Constants = require("../Constants")
const Typecheck = require("../Typecheck");
const { P } = require('./PeriodicTable');


const standard_atom_symbols = ['C','N','O', 'H', 'Br', 'Cl', 'I','At','F', 'P']

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
            /*
            console.log('trunk_ids[current_atom_index]')
            console.log(trunk_ids[current_atom_index])
            console.log('XXXXX')
             */
            return findPreviousAtom(trunk_ids, current_atom_index -1, atom, atoms)
        }

        const possible_previous_atom = atoms.getAtomByAtomId(trunk_ids[current_atom_index])
        if (false === atom.isSingleBondedTo(possible_previous_atom) &&
            false === atom.isDoubleBondedTo(possible_previous_atom) &&
            false === atom.isTripleBondedTo(possible_previous_atom)) {
            /*
            console.log('herrrrre')
            console.log('trunk_ids[current_atom_index]')
            console.log(trunk_ids[current_atom_index])
            console.log('possible previous atom')
            console.log(possible_previous_atom)
             */
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
    const convertAtomIdsToSmiles =  function(atoms, atoms_ids, logger) {

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
                const charge = atom.charge( molecule.atoms, logger)
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

                try {
                    if (typeof a_id !== 'string') {
                        throw new Error('Trunk ids should be an array of strings')
                    }
                } catch(e) {
                    console.log('trunk ids:')
                    console.log(trunk_ids)
                    console.log(a_id)
                    console.log(typeof a_id)
                    console.log(e)
                    process.exit()
                }

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
                    try {
                        if (previous_atom.isDoubleBondedTo(current_atom)) {
                            carry.push('=')
                        }
                        if (previous_atom.isTripleBondedTo(current_atom)) {
                            carry.push('#')
                        }
                    } catch(e) {
                        console.log('current atom')
                        console.log(current_atom)
                        console.log('previous atom')
                        console.log(previous_atom)
                        console.log("i:" + i)
                        console.log(trunk_ids)
                        console.log(trunk_ids.map((id)=>{
                            if (typeof id === 'number') {
                                return id
                            }
                            return atoms.getAtomByAtomId(id).atomicSymbol
                        }))
                        console.log(e)
                        process.exit()
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


                let child_branches = branches(non_trunk_atoms, current_main_trunk_atom).filter((branch)=>{
                    const first_atom_on_branch = atoms.getAtomByAtomId(branch[branch.length-1])
                    const last_atom_on_branch = atoms.getAtomByAtomId(branch[0])
                    if (first_atom_on_branch.isBondedTo(current_main_trunk_atom)) {
                        return true
                    }
                    // Check if "internal" ring bond
                    return first_atom_on_branch.isBondedTo(last_atom_on_branch) 
                    && last_atom_on_branch.isBondedTo(current_main_trunk_atom)
                    && branch.length > 2
                })
                
                
                /*
                .map((branch)=>{
                    const first_atom_on_branch = atoms.getAtomByAtomId(branch[branch.length-1])
                    const last_atom_on_branch = atoms.getAtomByAtomId(branch[0])
                    if(

                        first_atom_on_branch.isBondedTo(last_atom_on_branch) 
                        && last_atom_on_branch.isBondedTo(current_main_trunk_atom)
                        && branch.length > 2

                    ){
                        return branch.reverse()
                    }
                    return branch
                })
                */

                if (current_main_trunk_atom.atomicSymbol === 'P') {
                    console.log('child branches')
                    console.log(child_branches)
                  //  throw new Error('testing')
                }


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

                       const last_atom_on_branch = atoms.getAtomByAtomId(substituent_branch_atoms_ids[substituent_branch_atoms_ids.length-1])
                       const first_atom_on_branch = atoms.getAtomByAtomId(substituent_branch_atoms_ids[0])
                       if (first_atom_on_branch.isBondedTo(last_atom_on_branch)) {

                        // Internal ring bond
                                                                                                                   
                            // Add ringbond counts
                            ringbond_count += 1
                            
                            const first_atom_on_branch_index = substituent_branch_atoms_ids.indexOf(first_atom_on_branch.atomId)
                            const last_atom_on_branch_index = substituent_branch_atoms_ids.indexOf(last_atom_on_branch.atomId)
                            if (typeof atom_id_after_substituent_atom_id !== 'number') { // ringbond already added.
                                substituent_branch_atoms_ids.splice(first_atom_on_branch_index + 1, 0, ringbond_count)
                              //  substituent_branch_atoms_ids.splice(last_atom_on_branch_index , +2, ringbond_count) // not correct
                                substituent_branch_atoms_ids.push(ringbond_count)
                            }

                       } else {

                            // Ringbonds 
         
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
                                        const subsituent_atom_bonds = [...subsituent_atom.bonds(atoms), ...subsituent_atom.ionicBonds(atoms)]


                            
                                                            if (subsituent_atom.isTerminalAtom(atoms)) {
                                                                    return false
                                                             }    
                            
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
                            
                            
                                                            return subsituent_atom.isBondedTo(main_trunk_atom)
                                                        })
                            
                                                        })
                                                
                            

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


                    }

                    return substituent_branch_atoms_ids

                }) // child_branches.map()



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
                try {
                    return atom.atomId === starting_atom.atomId
                } catch(e) {
                    console.log(atom)
                    console.log(e)
                    process.exit()
                }
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
        SMILES : function (logger) {

            try {


                Typecheck(
                    {name: "logger", value: logger, type: "object"}
                )
    
                if (typeof molecule === 'string') {
                    return molecule // eg 'B:', etc
                }
    
    
                // Initiations and checks.
                let smiles = ''
                let atoms = null
    
             //   console.log('FormatAs() molecule')
             //   console.log(molecule)
    
                try {
                    atoms = molecule.atoms
                } catch(e) {
                    console.log('FormatAs.SMILES(logger) '+e)
                    console.log(e.stack)
                    process.exit()
                }
    
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
                    if (atom.charge( atoms, logger) !== 0 && atom.charge( atoms, logger) !== '' || standard_atom_symbols.indexOf(atom.atomicSymbol)===-1) {
                        smiles = '['
                    }
                    smiles+="H"
                    if (atom.charge( atoms, logger) === 1 || atom.charge( atoms, logger) === '+') {
                        smiles += '+'
                    }
                    if (atom.charge( atoms, logger) === -1 || atom.charge(atoms, logger) === '-') {
                        smiles += '-'
                    }
                    if (atom.charge( atoms, logger) !== 0 && atom.charge( atoms, logger) !== '' || standard_atom_symbols.indexOf(atom.atomicSymbol)===-1) {
                        smiles += ']'
                    }
                    return smiles
                }
    
                const atoms_no_hydrogens = atoms.filter((atom)=>{
                    return atom.atomicSymbol !== 'H'
                })
                const net_charge = molecule.netCharge(logger) // use to check overall charge
                const net_double_bond_count = molecule.netDoubleBondCount()
    
                // Only one non hydrogen so no need to do branches etc
                if (atoms_no_hydrogens.length === 1) {
                    const atom = atoms_no_hydrogens[0]
                    if (atom.charge( atoms, logger) !== 0 && atom.charge( atoms, logger) !== '' || standard_atom_symbols.indexOf(atom.atomicSymbol)==-1) {
                        smiles = '['
                    }
                    smiles+=atom.atomicSymbol
                    if (atom.charge( atoms, logger) === 1 || atom.charge( atoms, logger) === '+') {
                        smiles += '+'
                    }
                    if (atom.charge( atoms, logger) === -1 || atom.charge( atoms, logger) === '-') {
                        smiles += '-'
                    }
    
                    if (atom.charge( atoms, logger) !== 0 && atom.charge(atoms, logger) !== ''|| standard_atom_symbols.indexOf(atom.atomicSymbol)===-1) {
                        smiles += ']'
                    }
                    return smiles
                }
    
    
                //console.log('branches')
                //console.log(branches(atoms))
    
    
                const main_trunk = branches(atoms)[0]
                let main_trunk_with_substituents = []
    
            //    console.log(molecule)
            /*
                console.log(molecule.compressed)
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
                try {
                    if (main_trunk_with_substituents.filter((atom_id)=>{
                        return atom_id !== '('  &&atom_id !== ')' && atom_id !== '=' && atom_id !== '#' && typeof atom_id !=='number'
                    }).length !== atoms_no_hydrogens.length){
                        throw new Error("Warning: Number of atoms in main trunk and subsituents does not match the number of atoms in the molecule.")
                    }
                } catch(e) {
                    /*
                    console.log(atoms_no_hydrogens.length)
                    console.log(main_trunk_with_substituents.length)
                    console.log(main_trunk_with_substituents)
                    console.log(main_trunk_with_substituents.map((atom_id)=>{
                        if (typeof atom_id == 'number' || atom_id === '=' || atom_id === '(' || atom_id === ')' || atom_id === '#') {
                            return atom_id
                        }
                        const atom = atoms_no_hydrogens.getAtomByAtomId(atom_id)
                        return atom.atomicSymbol
                    }))
                    console.log(e)
    
                     */
                    //process.exit()
                }
    
                return convertAtomIdsToSmiles(atoms_no_hydrogens, main_trunk_with_substituents, logger)

            } catch(e) {
                logger.log('error', 'FormatAs() SMILES() ' + e)
                console.log(e.stack)
                process.exit()
            }

            

        }

    }
}


module.exports = FormatAs



