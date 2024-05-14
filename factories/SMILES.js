
const canonicalSMILES = function(debug, atoms, logger) => {

            const isLastAtom = function(atom, atoms, logger) {

                Typecheck(
                    {name: "atom", value: atom, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )
                const atom_ids = atoms.map((a)=>{
                    return a.atomId
                })

                return  atom_ids.indexOf(atom.atomId) === atoms.length -1

            }

                const isChildRingbondAtomOfCurrentAtom = function(atom, maybe_child_ringbond_atom, logger) {
                
                Typecheck(
                    {name: "atom", value: atom, type: "object"},
                    {name: "maybe_child_ringbond_atom", value: maybe_child_ringbond_atom, type: "object"},
                    {name: "logger", value: logger, type: "object"},
                )
                return 'parent' === atom.ringbondType()
                    && 'child' === maybe_child_ringbond_atom.ringbondType()
                    && atom.ringbondNumber() === maybe_child_ringbond_atom.ringbondNumber()
		}


                // Get bonds that are not parent bonds or child ringbond of the current atom.
            const childBonds = function(atom, atoms, used_atom_ids, logger) {
                Typecheck(
                    {name: "atom", value: atom, type: "object"},
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "used_atom_ids", value: used_atom_ids, type: "array"},
                    {name: "logger", value: logger, type: "object"},
                )

                const child_bonds = atom.bonds(atoms, false).filter((bond)=>{
                    // We need to do this as otherwise a ring will
                    // be erroneously counted as two branches.
                    if (isChildRingbondAtomOfCurrentAtom(atom, bond.atom, logger)) {
                        return false
                    }
                    return -1 === used_atom_ids.indexOf(bond.atom.atomId)
                })

                if (false && atom.atomicSymbol === 'Br') {
                    console.log('MoleculeFactory() Br child bonds')
                    atoms.map((a)=>{
                        console.log(a)
                        return a
                    })
                    console.log(atom.bonds(atoms, false))
                    console.log(child_bonds)
                }

                if (false && atom.atomicSymbol === 'K') {
                    console.log('MoleculeFactory() K child bonds')
                    console.log(child_bonds)
                }

                return child_bonds
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
        
        
                // Removed 26 Jan 13:32
                /*
                if ('child' === atom.ringbondType()) {
                    return true
                }
                */
        
        
                return false
            }

                const parentAtom = function(atom, atoms, used_atom_ids, logger) {
        
                    try {
                        Typecheck(
                            {name: "atom", value: atom, type: "object"},
                            {name: "atoms", value: atoms, type: "array"},
                            {name: "used_atom_ids", value: used_atom_ids, type: "array"},
                            {name: "logger", value: logger, type: "object"},
                        )

                      //  atoms = atoms.filter((atom)=>{
                      //      return typeof atom === "object"
                      //  })

                        const possible_parent_atoms = atoms.filter((a)=>{
                            return used_atom_ids.indexOf(a.atomId) !== -1
                        })

                        const t = possible_parent_atoms.filter((maybe_parent_atom)=>{
                            // Get tbe parent atom bonds and see if one of the bonds is
                            // a bond to the atom we are trying to find the parent for.
                            const bonds = maybe_parent_atom.bonds(atoms, false)
                            const matching_bond = _.find(bonds, (bond)=>{
                                return bond.atom.atomId === atom.atomId
                            })
                            return undefined !== matching_bond
                        })

                        return t.length > 0? t.pop(): null

            
                    } catch(e) {
                        logger.log('info', 'ProtoTypes.parentAtom() '+e)
                        console.log(e.stack)
                        process.exit()
                    }
        
            }

                const atomBondType = function(atom, atoms, used_atom_ids, logger) {
                
                Typecheck(
                    {name: "atom", value: atom, type: "object"},
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "used_atom_ids", value: used_atom_ids, type: "array"},
                    {name: "logger", value: logger, type: "object"}
                )
                
                //console.log('atom getting bond type for')
                //console.log(atom)
                if (0 === used_atom_ids.length) {
                    return ''
                }
                
                const parent_atom = parentAtom(
                    atom,
                    atoms,
                    used_atom_ids,
                    logger
                )
                if (undefined === parent_atom || null === parent_atom) {
                    return ''
                }
                const parent_atom_bond = _.find(parent_atom.bonds(atoms, false), (bond)=> {
                    return bond.atom.atomId === atom.atomId
                })
//                console.log(parent_atom_bond)
                return undefined === parent_atom_bond.bond_type || parent_atom_bond.bond_type === 'ionic'?'':parent_atom_bond.bond_type
            }

    
            /**
             * 
             * We first called rings_array must be [[starting_atom]]
             * 
             * @param {*} starting_atom 
             * @param {*} parent_atom 
             * @param {*} atoms 
             * @param {*} rings_array 
             * @param {*} ring_index 
             */
        
            const __findRingsv2 = (starting_atom, atoms, rings_array) => {


                Typecheck(
                    {name: "starting_atom", value: starting_atom, type: "array"},
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "rings_array", value: rings_array, type: "array"}
                )
                // See ai/Synthesise::generatePathways()
                do {

                    // Add next atom to end of each ring in the current ring set
                    let ring_index = 0

                    for (ring_index =0; ring_index < rings_array.length;ring_index++) {
                        const current_ring = rings_array[ring_index]
                        const current_ring_cloned = _.cloneDeep(rings_array[ring_index])
                        if (null !== current_ring) {
                            const last_atom = current_ring[current_ring.length-1]
                            if (null !== last_atom) {

                                let last_atom_bonds = last_atom.bonds(atoms)
                                const parent_atom = current_ring[current_ring.length-2]
                                if (undefined !== parent_atom ) {
                                    // Filter out the previous atom that was processed as this will be the parent atom and we only want child atoms
                                    last_atom_bonds = last_atom_bonds.filter((bond)=>{
                                        return !_.isEqual(bond.atom, parent_atom)
                                    })
                                }
                                if (last_atom_bonds.length > 0) {
                                    // If one of the bonds is the starting atom then add that atom and ignore other bonds.
                                    // Add first bonded atom to current ring    
                                    const starting_atom_bond = _.find(last_atom_bonds, (bond)=>{
                                        return _.isEqual(bond.atom, starting_atom)
                                    })
                                    if (undefined !== starting_atom_bond) {
                                        current_ring.push(starting_atom_bond.atom)
                                        current_ring.push(null)
                                    } else {
                                        // Check if atom is already in the current ring
                                        // If it is then we have a loop back and the current ring is not a ring
                                        const test = _.find(current_ring, (a)=>{
                                            return _.isEqual(a, last_atom_bonds[0].atom)
                                        })
                                        if (undefined !== test) {
                                            // Not a valid ring as we have a loop back
                                            rings_array[ring_index] = null
                                        } else {
                                            current_ring.push(last_atom_bonds[0].atom)
                                        }
                                        // Now add the rest of the bonded atoms, creating a new ring each time
                                        let bond_index = 1
                                        for (bond_index =1; bond_index < last_atom_bonds.length;bond_index++) {
                                            rings_array.push([...current_ring_cloned, last_atom_bonds[bond_index].atom])
                                        }
                                    }
                                } else {
                                    // Not a ring so remove from rings array
                                    rings_array[ring_index] = null
                                }
                            }
                        }

                    }

                    rings_array = rings_array.filter((r)=>{
                        return null !== r
                    })

                } while(
                    // Filter out null rings and rings ending in null
                    rings_array.filter((r)=>{
                        return null !== r[r.length-1]
                   }).length > 0
                )

                // Remove end nulls and return
                return rings_array.map((ring)=>{
                    if (null === ring[ring.length-1]) {
                        ring.pop()
                    }
                    return ring
                })


            }


                /**
            * Convert molecule atoms into an array where each element is an array
            * of atom ids where each atom id represents an atom bonded to the next atom.
            *
            * @param atoms_no_hyrogens All atoms in the molecule
            * @returns {string[][]}
            */
            const branches = (atoms_no_hyrogens, parent_atom)=>{

                Typecheck(
                    {name:"atoms_no_hyrogens", value:atoms_no_hyrogens, type:"array"},
                    {name:"atoms_no_hyrogens first atom", value:atoms_no_hyrogens[0], type:"array"},
                )

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
                //const ring_bond_number = 1

                const atoms_no_hydrogens_copy = undefined === parent_atom? 
                    _.cloneDeep(atoms_no_hydrogens)
                    : _.cloneDeep(atoms_no_hydrogens).splice(
                        
                    )
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

                        const current_atom_bonds = current_atom.bonds(atoms)
                        const current_atom_bonds_filtered = current_atom_bonds.filter((bond) => {
                            return used_ids.indexOf(bond.atom.atomId) === -1
                        })
                        // Add current atom id to array of used ids.
                        used_ids.push(current_atom.atomId)
                        current_atom_id = current_atom.atomId
                        // Add current atom id to current branch
                        branches[branches.length - 1].push(current_atom_id)
                        if (current_atom_bonds_filtered.length === 0) {
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
                            current_atom = current_atom_bonds_filtered[0].atom
                        }

                    } while (atoms_count < atoms_copy.length)

                }


                branches = branches.filter((branch)=>{
                    return branch.length > 1
                }).map((branch)=>{
                    // Check if the last atom on the branch is bonded to the first atom and if so, add first atom to the end of the branch to show a ring bond.
                    const first_atom = atoms_no_hydrogens.getAtomByAtomId(branch[0])
                    const last_atom = atoms_no_hydrogens.getAtomByAtomId(branch[branch.length-1])
                    if (last_atom.isBondedTo(first_atom)) { 
                         branch.push(branch[0])
                       //  branch.push('1')
                       // ring_bond_number++
                    }
                    return branch
                })

                // Remove any branches where the first atom id is the same as the last atom id and the branch has 3 or less atom ids
                _.remove(branches, (branch)=>{
                    return branch.length < 4 && branch[0] == branch[branch.length-1]
                })

                // Sort branches by length
                const branches_sorted = branches.sort((branch_1, branch_2)=>{
                    return branch_1.length > branch_2.length? -1: 1
                })


                return branches_sorted



            }

                const __findMatchingRingBranch = function(branches, smiles_atoms, atom, possible_child_ringbond_atom) {
                Typecheck(
                    {name:"branches", value:branches, type:"array"},
                    {name:"smiles_atoms", value:smiles_atoms, type:"array"},
                    {name:"atom", value:atom, type:"array"},
                    {name:"possible_child_ringbond_atom", value:possible_child_ringbond_atom, type:"array"}
                )

                const smiles_atoms_no_bonds = smiles_atoms.filter((a)=>{
                    return typeof a === "object"
                })
                const possible_child_ringbond_atom_index = _.findIndex(smiles_atoms_no_bonds, (a)=>{
                    return a.atomId === possible_child_ringbond_atom.atomId
                })
                const possible_parent_ringbond_atom_index = _.findIndex(smiles_atoms_no_bonds, (a)=>{
                    return a.atomId === atom.atomId
                })
                const branch = _.find(branches, (b)=>{
                    return possible_child_ringbond_atom_index !== possible_parent_ringbond_atom_index +1 
                        && b[0] === atom.atomId 
                        && b[b.length-1] === atom.atomId
                        && undefined !== b[1]
                        && undefined !== b[b.length-2]
                        && (b[1] === possible_child_ringbond_atom.atomId || b[b.length-2] === possible_child_ringbond_atom.atomId)
                })

                if (undefined !== branch) {
                  // Remove branch from branches
                  // Added 25 Jan 17:43
                  // Modified 26 Jan 16:04
                  // Remove branches that have the exact same atom ids and number
                  _.remove(branches, (b) =>{
                        if (_.isEqual(b, branch)) {
                            return true
                        }
                        b.sort()
                        const branch_copy = _.cloneDeep(branch)
                        branch_copy.sort()
                        return _.isEqual(b, branch_copy)
                  })
                }

                return branch
            }

            const __isRing = function(atoms, atom, branch, logger) {
                
                Typecheck(
                    {name: "atoms", value: atoms, type: "array"},
                    {name: "branch", value: branch, type: "array"},
                    {name: "atom", value: atom, type: "object"},
                    {name: "logger", value: logger, type: "object"}
                )

                if (branch[0] !== atom.atomId || branch[0] !== branch[branch.length-1]) {
                    return false
                }

                const atoms_filtered = atoms.filter((a)=>{
                    return typeof a === "object"
                })

                const _b = branches(atoms_filtered, atom)
                // Figure "8"s
                // Check for atoms that have three or more bonds where at least three of those bonds are atoms in the branch
                const test = _.find(branch, (atom_id)=>{
                    const a = atoms_filtered.getAtomByAtomId(atom_id)
                    const bond_ids = a.bonds(atoms_filtered).map((bond)=>{
                        return bond.atom.atomId
                    })
                    return bond_ids.length > 2 && _.intersection(bond_ids, branch).length >= 3
                })
                return undefined === test

            }

            const __scanForParentRingBondAtom = function(smiles_atoms, branches, possible_child_ringbond_atom, must_be_on_same_branch, logger) {

                Typecheck(
                    {name: "smiles_atoms", value: smiles_atoms, type: "array"},
                    {name: "branches", value: branches, type: "array"},
                    {name: "possible_child_ringbond_atom", value: possible_child_ringbond_atom, type: "array"},
                    {name: "must_be_on_same_branch", value: must_be_on_same_branch, type: "boolean"},
                    {name: "logger", value: logger, type: "object"}
                )

                if (undefined === possible_child_ringbond_atom) {
                    return undefined
                }

                // Look for atom in smiles that is bonded to the possible child ringbond atom but is more than step 
                // away from the the possible child ringbond atom.
                const smiles_atoms_and_brackets = smiles_atoms.filter((atom)=>{
                    return typeof atom === "object" || atom === ')' || atom === '('
                })
                let possible_parent_ringbond_atom = undefined
                const possible_child_ringbond_atom_index = _.findIndex(smiles_atoms_and_brackets, (atom)=>{
                    return typeof atom === 'object' && atom.atomId === possible_child_ringbond_atom.atomId
                })

                if (possible_child_ringbond_atom_index < 2) {
                    return undefined
                }

                // Scan for parent ring bond atom by looking for an atom that is at least two steps away from the possible child ringbond atom,
                // is bonded to the child ringbond atom, and is on the same branch.
                let i = 0

                do {
                    const a = smiles_atoms[i]
                    if (typeof a === "object") {
                        // Look for branches starting with item and ending in possible child ringbond atom
                        const branch = __findMatchingRingBranch(branches,smiles_atoms, a, possible_child_ringbond_atom)
                        if (undefined !== branch) {
                            possible_parent_ringbond_atom = a
                        }
                    }
                    i++                      
                } while(possible_parent_ringbond_atom === undefined && i < smiles_atoms.length)

                return possible_parent_ringbond_atom
            }

            const __checkForRing = function(starting_atom, descendent_atoms, logger) {
                Typecheck(
                    {name: "starting_atom", value: atoms_no_hydrogens, type: "array"},
                    {name: "descendent_atoms", value: descendent_atoms, type: "array"},
                    {name: "logger", value: logger, type: "object"}
                )
                
            }

            const __getNextAtom = function(atom_index, atoms) {

                atom_index++

                if (undefined === atoms[atom_index]) {
                    return null
                }

                // If last atom and is a ringbond then next atom will be the parent ringbond atom
                if (atom_index === atoms.length -1 && typeof atoms[atom_index] == "string") {
                    const ring_bond_number = atoms[atom_index]
                    const parent_ring_bond_index = _.findIndex(atoms, (item)=>{
                        return item === ring_bond_number
                    })
                    return atoms[parent_ring_bond_index-1]
                }

                if (typeof atoms[atom_index] !== "object") { // (, ), 1
                    // Forward to next item
                    return __getNextAtom(atom_index, atoms)
                }

                const next_atom = atoms[atom_index]

                return next_atom

            }

            const __getBondType = function(atom, atom_index, atoms) {
                
                Typecheck(
                    {name: "atom", value: atom, type: "object"},
                    {name: "atom_index", value: atom_index, type: "int"},
                    {name: "atoms", value: atoms, type: "array"}
                )
                
                const next_atom =  __getNextAtom(atom_index, atoms)

                if (null === next_atom) {
                    return ''
                }

                const just_atoms = atoms.filter((a)=>{
                    return typeof a === "object"
                })

                const bond = _.find(atom.bonds(just_atoms), (b)=>{
                    return b.atom.atomId === next_atom.atomId
                })

                return undefined === bond?'':bond.bond_type

            }

    
    const SMILES = function (atoms_no_hydrogens, ringbond_count, used_atom_ids, branch_number, logger) {

                Typecheck(
                    {name: "atoms_no_hydrogens", value: atoms_no_hydrogens, type: "array"},
                    {name: "ringbond_count", value: ringbond_count, type: "number"},
                    {name: "used_atom_ids", value: used_atom_ids, type: "array"},
                    {name: "branch_number", value: branch_number, type: "number"},
                    {name: "logger", value: logger, type: "object"}
                )

                const smiles = []
                let atoms_ordered = []


                let ring_bond_number = 1

                // Get first end of branch atom
                const first_end_of_branch_atom = _.find(atoms_no_hydrogens, (a)=>{
                    return a.isTerminalAtom(atoms_no_hydrogens)
                })

                if (undefined === first_end_of_branch_atom) {
                    atoms_ordered = atoms_no_hydrogens
                } else {
                    
                    let atoms_no_hydrogens_copy = _.cloneDeep(atoms_no_hydrogens)
                    
                    // Add first end of branch atom to ordered atoms
                    atoms_ordered.push(first_end_of_branch_atom)
                    
                    // Remove first end of branch atom from atoms
                    _.remove(atoms_no_hydrogens_copy, (a)=>{
                        return a.atomId === first_end_of_branch_atom.atomId
                    })

                    // Re-order atoms.
                    do {

                        const atoms_ordered_atom_ids = atoms_ordered.map((a)=>{
                            return a.atomId
                        })

                        // Get the last atom in the ordered atoms array that is not
                        // an end of branch atom AND has unresolved bonds
                        const parent_atom = _.find(_.cloneDeep(atoms_ordered).reverse(), (a)=>{
                            const bonds = a.bonds(atoms_no_hydrogens_copy) // This will give us only unresolved bonds as we are removing atoms from atoms_no_hydrogens_copy
                            return bonds.length > 0                            
                        })

                        if (undefined !== parent_atom) {
                            // Get atoms bonded to parent atom that are end of branch atoms
                            // Favour double bonds
                            let end_of_branch_double_bonds = undefined // this is misleading
                            end_of_branch_double_bonds =  _.filter(parent_atom.doubleBonds(atoms_no_hydrogens), (b)=>{
                                // 22 Feb 2023 Added -1 === atoms_ordered_atom_ids.indexOf(b.atom.atomId) &&
                                return -1 === atoms_ordered_atom_ids.indexOf(b.atom.atomId) && isEndOfBranchAtom(b.atom, atoms_no_hydrogens) // 25 Jan 16:44
                                //return b.atom.isTerminalAtom(atoms_no_hydrogens)
                            })
                            let end_of_branch_single_bonds = undefined 
                            // Added 24 Feb
                            end_of_branch_single_bonds =  _.filter(parent_atom.singleBonds(atoms_no_hydrogens), (b)=>{
                                return -1 === atoms_ordered_atom_ids.indexOf(b.atom.atomId) && isEndOfBranchAtom(b.atom, atoms_no_hydrogens)
                            })
                            let end_of_branch_bonds = [...end_of_branch_double_bonds, ...end_of_branch_single_bonds]
                            if (end_of_branch_bonds.length > 0) { //  undefined === end_of_branch_bond

                                // 24 Feb 2023
                                end_of_branch_bonds.map((b)=>{
                                    if (-1 === atoms_ordered_atom_ids.indexOf(b.atom.atomId)) {
                                        // Add to ordered atoms and remove from atoms_no_hydrogens_copy
                                        atoms_ordered.push(b.atom)
                                        _.remove(atoms_no_hydrogens_copy, (a)=>{
                                            return a.atomId === b.atom.atomId
                                        })
        
                                    }
                                    return b
                                })
                                /*
                                // 10 Feb 2023 - Does not work for m as results in C1C1
                                let atoms_no_hydrogens_minus_atoms_ordered = atoms_no_hydrogens.filter((a)=>{
                                    return atoms_ordered_atom_ids.indexOf(a.atomId) === -1
                                   // return true
                                })
                                //let atoms_no_hydrogens_minus_atoms_ordered = atoms_no_hydrogens
                                end_of_branch_bond =_.find(parent_atom.bonds(atoms_no_hydrogens_minus_atoms_ordered), (b)=>{
                                 return isEndOfBranchAtom(b.atom, atoms_no_hydrogens_minus_atoms_ordered) // 25 Jan 16:44
                             //    return b.atom.isTerminalAtom(atoms_no_hydrogens_copy)
                                })
                                */
                            }
                            // 24 Feb 2023
                            if (false) { // undefined !== end_of_branch_bond
                                atoms_ordered.push(end_of_branch_bond.atom)
                                // Remove end of branch atom from atoms_no_hydrogens_copy array
                                _.remove(atoms_no_hydrogens_copy, (a)=>{
                                    return a.atomId === end_of_branch_bond.atom.atomId
                                })
                            } else {
                                let parent_bonds = undefined
                                let bonded_atom = undefined
                                parent_bonds = parent_atom.doubleBonds(atoms_no_hydrogens_copy)
                                if (parent_bonds.length === 0) {
                                    parent_bonds = parent_atom.bonds(atoms_no_hydrogens_copy)
                                }
                                if (parent_bonds.length > 0) {
                                    bonded_atom = parent_bonds[0].atom
                                    if (undefined !==bonded_atom) {
                                        atoms_ordered.push(bonded_atom)
                                    }
                                     // Remove end of branch atom from atoms_no_hydrogens_copy array
                                    _.remove(atoms_no_hydrogens_copy, (a)=>{
                                        return a.atomId === bonded_atom.atomId
                                    })
                                }

                            }
                            // Remove parent atom from atoms_no_hydrogens_copy array
                            _.remove(atoms_no_hydrogens_copy, (a)=>{
                                return a.atomId === parent_atom.atomId
                            })
                        }

                    } while(atoms_no_hydrogens_copy.length > 0)

                }

                atoms_no_hydrogens = atoms_ordered

                const all_branches = branches(atoms_no_hydrogens)

                let atom_index = 0
                // Feb 11
                let i = 0
                let atom = undefined
                let used_rings = []
                let safety = 0

                // Add ringbonds
                do {

                    atom = atoms_no_hydrogens[atom_index]

                    if (typeof atom === "string") {
                        smiles.push(atom) // ringbond number
                    } else if (typeof atom === "object" && used_atom_ids.indexOf(atom.atomId) ==-1) {

                        // Note that the first atom can have more than one bond eg benzene ring
                        smiles.push(atom)

                        if (typeof atom === "object") {

                            const bonds = atom.bonds(atoms_no_hydrogens.filter((a)=>{
                                return typeof a !== "string"
                            }))
                            let ring = undefined
                            // Ringbonds
                            if (
                                (atom_index === 0 && bonds.length > 1)
                                || (atom_index > 0 && bonds.length > 2)
    
                            ) {
                                // Get rings but don't include rings where the second to last atom is the atom after the current atom in the atoms_no_hydrogens array
                                // Also don't include rings that have already been used
                                const rings = __findRingsv2(atom, atoms, [[atom]]).filter((r)=>{
                                    // Check that the ring has not already been used
                                    // 13 Feb 2023
                                    const r_copy = _.cloneDeep(r)
                                    r_copy.pop()
                                    const r_ids = r_copy.map((a)=>{
                                        return a.atomId
                                    })
                                    // Feb 13 2023
                                    const same_ring = _.find(used_rings, (used_ring)=>{
                                        if (r_copy.length !== used_ring.length) {
                                            return false
                                        }
                                        const used_ring_ids = used_ring.map((a)=>{
                                            return a.atomId
                                        })
                                        const intersection =  _.intersection(used_ring_ids, r_ids)
                                        return used_ring.length === r_copy.length && intersection.length === used_ring.length
                                    })
                                    // Feb 13 2023
                                    if (undefined !== same_ring) {
                                        return false
                                    }
                                    const next_atom = __getNextAtom(atom_index, atoms_no_hydrogens)
                                    const ring_atom = r[r.length-2]
                                    return ring_atom.atomId !== next_atom.atomId
                                })
                                // Look for first branch that starts with the current atom and ends with the current atom.
                                // This will always be the shortest matching ring.
                                if (rings.length > 0) {
                                    ring = rings[0]
                                    // We don't want to store the ring with the main ring atom added twice eg 1,2,3,4,1 --> 1,2,3,4. Otherwise finding matches won't work.
                                    const ring_copy = _.cloneDeep(ring)
                                    ring_copy.pop()
                                    used_rings.push(ring_copy)
                                }
    
                                if (undefined !== ring) {
                                    // Add ringbond number to smiles
                                    smiles.push(ring_bond_number+'')
                                    // Add ringbond number just after the atom matching the second to last atom id in the ring, to atoms_no_hydrogens
                                    const child_ring_atom = ring[ring.length-2]
                                    const child_ring_bond_index = _.findIndex(atoms_no_hydrogens, (a)=>{
                                        return typeof a === 'object' && a.atomId === child_ring_atom.atomId
                                    })
                                    //atoms_no_hydrogens.indexOf(ring[ring.length-2])
                                    atoms_no_hydrogens.splice(
                                        child_ring_bond_index + 1,
                                        0,
                                        ring_bond_number+''
                                    )
                                    ring_bond_number++
                                }
            
                            }
    
                        }

                    }

                    atom_index++
                    safety++

                } while(undefined !== atoms_no_hydrogens[atom_index] && safety < 50)

            //    console.log(safety)
            //    if (safety === 50) {
              //      x = 100
              //  }

            
                // Add branches
                // At this point ringbonds have been added.
                // Do not do after adding ring bond types.
                const smiles_atoms = _.cloneDeep(smiles)
                const used_bond_ids = []
                for (let atom_index = 0; atom_index < smiles_atoms.length; atom_index++) {
                    const atom = smiles_atoms[atom_index]
                    if (typeof atom !== "string") {
                        used_bond_ids.push(atom.atomId)
                        const bonds = atom.bonds(
                            smiles_atoms.filter((a)=>{
                                return typeof a === 'object'
                            })
                        ).filter((b)=>{
                            return used_bond_ids.indexOf(b.atom.atomId) === -1
                        })
                        if (bonds.length > 1
                        ){
                            // Branches
                            // Check for ring.
                            // 15 Feb 2023
                            //const rings = __findRingsv2(atom, atoms, [[atom]])
                            // Note: We can do this because we haven't added bond types yet.
                            const atom_index = atom.atomIndex(smiles)
                            const next_atom = __getNextAtom(atom_index, smiles)
                            const next_atom_index = next_atom.atomIndex(smiles)
                            const offset = typeof smiles[atom_index+1] === "string"?next_atom_index - atom_index - 1:0
                            // 15 Feb 2023
                            //if (bonds.length - (rings.length / 2) > 1) {
                            if (bonds.length - offset > 1) {
                                let start_of_branch_index = _.findIndex(smiles, (a)=>{
                                    return typeof a === "object" && a.atomId === atom.atomId
                                }) + offset

                                for (let k = 0; k < bonds.length -1; k++) {
                                    
                                    const bond = bonds[k]
                                    // Add ')'
                                    // 16 Feb - do this before adding ')'
                                    let end_of_branch_index = null
                                    // Terminal atom?
                                    // 20 Feb 2023
                                    // Changed from "if (k === 0 && bond.atom.isTerminalAtom(smiles.filter((a)=>{""
                                    if (bond.atom.isTerminalAtom(smiles.filter((a)=>{
                                        return typeof a === "object"
                                    }))) {
                                        end_of_branch_index = bond.atom.atomIndex(smiles) + 1
                                    } else {
                                        // Get branches where the first atom is atom and the second atom is the current bond
                                        const atom_bond_branches = all_branches.filter((branch)=>{
                                            return branch.length > 2 && branch[0] !== branch[branch.length-1] && branch[0] === atom.atomId && branch[1] === bond.atom.atomId
                                        })
                                        if (atom_bond_branches.length > 0) {
                                            const branch = atom_bond_branches[0]
                                            const end_of_branch_atom = atoms_no_hydrogens.getAtomByAtomId(branch[branch.length-1])
                                            end_of_branch_index = end_of_branch_atom.atomIndex(smiles) +1
                                            // Added 16 Feb
                                            if (typeof smiles[end_of_branch_index+1]==="string") {
                                                // @todo Should use '_getNextAtom()'
                                                end_of_branch_index = end_of_branch_index + 2
                                            }
                                        }
                                    }

                                    // Add '(' 
                                    if (null !== end_of_branch_index) {
                                        smiles.splice(
                                            end_of_branch_index,
                                            0,
                                            ')'
                                        )
                                        smiles.splice(
                                            start_of_branch_index + 1,
                                            0,
                                            '('
                                        )
                                        start_of_branch_index = end_of_branch_index +1
                                    }

                                    /*
                                    // 15 Feb 2023 Added "+ (offset > 0?offset+1:offset)"
                                    // 15 Feb 2023 - test for branch terminal atom
                                    let end_of_branch_index = null
                                    if (k === 0 && bond.atom.isTerminalAtom(smiles.filter((a)=>{
                                        return typeof a === "object"
                                    }))) {
                                        end_of_branch_index = bond.atom.atomIndex(smiles) + 1
                                    } else {
                                        end_of_branch_index = _.findIndex(smiles, (a)=>{
                                            // 16 Feb 2023
                                            const next_atom = __getNextAtom(bond.atom.atomIndex(smiles), smiles)
                                            const next_atom_index = next_atom.atomIndex(smiles)
                                            if (a.atomId === next_atom.atomId) {
                                                if ( typeof smiles[atom_index+1] === "string" && typeof smiles[next_atom_index+1] === "string" && smiles[atom_index+1] === smiles[next_atom_index+1]) {
                                                    // Here the "end of branch" atom is also the end of ring. 
                                                }
                                            } else {
                                                return false
                                            }
                                        }) + (offset > 0?offset+1:offset)
                                    }
                                    */

                                }

    
                            }
                        }
                    }
                }

                // Add bond types
                // This should be done after adding branches.
                const used_atom_bond_ids = []
                for (let atom_index = 0; atom_index < smiles_atoms.length; atom_index++) {
                    const atom = smiles_atoms[atom_index]
                    if (typeof atom === "object") {
                        if (used_atom_bond_ids.indexOf(atom.atomId===-1)) {
                            const bonds = atom.bonds(atoms_no_hydrogens.filter((a)=>{
                                return typeof a === 'object'
                            })).filter((b)=>{
                                return used_atom_bond_ids.indexOf(b.atom.atomId) == -1
                            })
                            for (let k=0; k < bonds.length; k++) {
                                const bond = bonds[k]
                                // Get index of the bonded atom
                                if (bond.bond_type !== '') {
                                    const bonded_atom_index = bond.atom.atomIndex(smiles)
                                    let offset = 0
                                    const smiles_atom_index = atom.atomIndex(smiles)
                                    // Check if the item after the bonded atom is a ring bond number
                                    // 11 Feb
                                    // benzene
                                    // if (typeof smiles[smiles_atom_index+1] === "string" && smiles[smiles_atom_index+1] !== '(' && smiles[smiles_atom_index+1] !== ')') {
                                    if (typeof smiles[smiles_atom_index+1] === "string" && smiles[smiles_atom_index+1] !== '(' && smiles[smiles_atom_index+1] !== ')') {
                                        // Only add offset if child ringbond
                                        const ring_bond_number = smiles[bonded_atom_index+1];
                                        const parent_ring_bond_number_index = _.findIndex(smiles, (item)=>{
                                            return item === ring_bond_number
                                        })
                                        // Feb 11
                                        // Benzene C1=CC=CC=C1
                                        // if (smiles[parent_ring_bond_number_index] !== smiles[bonded_atom_index+1]) {
                                        // m
                                        // if (parent_ring_bond_number_index !== bonded_atom_index) {
                                        if (parent_ring_bond_number_index < bonded_atom_index+1) {
                                            offset++
                                        }
                                    }
                                    smiles.splice(
                                        bonded_atom_index + offset,
                                        0,
                                        bond.bond_type
                                    )
                                }
                            }
                            used_atom_bond_ids.push(atom.atomId)
                        }
                    }
                }
                /*
                for (let atom_index = 0; atom_index < smiles_atoms.length; atom_index++) {
                    const atom = smiles_atoms[atom_index]
                    if (typeof atom !== "string") {
                        let bond_type =  __getBondType(atom, atom_index, smiles_atoms)
                        if ('' !== bond_type) {
                            const next_atom = __getNextAtom(atom_index, smiles_atoms)
                            const next_atom_index = _.findIndex(smiles, (a)=>{
                                return typeof a === "object" && a.atomId === next_atom.atomId
                            })
                            smiles.splice(
                                next_atom_index,
                                0,
                                bond_type
                            )
                        }
                    }
                }
                */


                if (false) {
                for (let atom_index = 0; atom_index < smiles.length; atom_index++) {
                    const atom = smiles[atom_index]
                    // Atom has not already been added
                    if (used_atom_ids.indexOf(atom.atomId) ==-1) {
                        // Note that the first atom can have more than one bond eg benzene ring
                        // addAtomToSmiles(smiles, atom, atoms_no_hydrogens, used_atom_ids, logger)
                        let s = atomBondType(
                            atom,
                            atoms_no_hydrogens,
                            used_atom_ids,
                            logger
                        )
                        if ('' !== s) {
                            smiles.push(s)
                        }

                        smiles.push(atom)

                       const end_of_branch = isEndOfBranchAtom(atom, atoms_no_hydrogens)

                       // Check for parent ringbond
                       // b = branches
                       const parent_ringbond_atom = __scanForParentRingBondAtom(smiles, b, atom, true, logger)
                       if (undefined !== parent_ringbond_atom) {                            
                            // If the parent ringbond atom is not undefined then there will be a '('
                            // immediately after it in the smiles array.
                            // We remove the '(' and replace it with the current ringbond number.
                            const parent_ringbond_atom_position_in_smiles = _.findIndex(smiles, (atom)=>{
                                return typeof atom === "object" && atom.atomId === parent_ringbond_atom.atomId
                            })
                            // Remove '('
                            if (branch_number > 0 && smiles[parent_ringbond_atom_position_in_smiles+1] === '(') {
                                smiles[parent_ringbond_atom_position_in_smiles+1] = ring_bond_number+''
                            } else {
                                smiles.splice(parent_ringbond_atom_position_in_smiles + 1, 0, ring_bond_number+'')
                            }
                            const bond = _.find(atom.bonds(atoms_no_hydrogens), (bond)=>{
                                return bond.atom.atomId === parent_ringbond_atom.atomId
                            })
                            if (bond.bond_type !=='') {
                                smiles.push(bond.bond_type)
                            }
                            smiles.push(ring_bond_number+'')
                            // Remove branches that have the parent ringbond atom and the child ringbond atom
                            // 25 Jan 17:44 Removed as now done in  __findMatchingRingBranch()
                            /*
                            _.remove(b, (branch)=>{
                                return  -1 !== branch.indexOf(parent_ringbond_atom.atomId) && -1 !== branch.indexOf(atom.atomId)
                            })
                            */
                            ring_bond_number++
                        }

                        // Get child bonds but if there is a ring branch ignore bond atom with id equal to the second to last item in the ring branch
                        let child_bonds = childBonds(atom, atoms_no_hydrogens, used_atom_ids, logger)

                        // Continue processing if we have more than one bond
                        if (child_bonds.length > 1) {
                            smiles.push('(')
                            branch_number++
                        } else {
                           
                            if (end_of_branch && branch_number > 0) {
                                smiles.push(')')
                                branch_number--
                            }
                        }

                        used_atom_ids.push(atom.atomId)
                

                    }
    
                }
                }   

                // Add charges and return smiles
                return smiles.map((atom)=>{
                    if (typeof atom === "object") {
                        const smiles_atoms = smiles.filter((a)=>{
                            return typeof a === "object"
                        })                        
                       // let s = atomBondType(atom, smiles_atoms, used_atom_ids, logger)
                       let s = ''
                        const charge = atom.charge(atoms_no_hydrogens, logger)
                        if (charge !==0 || standard_atom_symbols.indexOf(atom.atomicSymbol) === -1) {
                            s +='['
                        } 
                        s+=atom.atomicSymbol
                        if (debug) {
                            s = s + '{' + atom.atomId + '}'
                        }
                        if (charge === 1) {
                            s+='+'
                        }
                        if (charge === -1) {
                            s+='-'
                        }
                        if (charge !==0 || standard_atom_symbols.indexOf(atom.atomicSymbol) === -1) {
                            s+=']'
                        } 
                        atom = s
                    }
                    return atom

                })

    }


                const __findRings = (atoms, parent_atom)=>{

                Typecheck(
                    {name:"atoms", value:atoms, type:"array"},
                    {name:"parent_atom", value:parent_atom, type:"array"},
                )

                if (atoms.length < 3) {
                    return false
                }

                let rings = [[parent_atom]]
                let used_ids = []


                const parent_atom_index = _.findIndex(atoms, (a)=>{
                    return a.atomId === parent_atom.atomId
                })

                // Get rings that start and end with the parent atom
                let i = parent_atom_index + 1
                for(i in atoms) {

                    used_ids = []
                    let starting_atom = atoms[i]
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

                        const current_atom_bonds = current_atom.bonds(atoms)
                        const current_atom_bonds_filtered = current_atom_bonds.filter((bond) => {
                            return used_ids.indexOf(bond.atom.atomId) === -1
                        })
                        // Add current atom id to array of used ids.
                        used_ids.push(current_atom.atomId)
                        current_atom_id = current_atom.atomId
                        // Add current atom id to current branch
                        branches[branches.length - 1].push(current_atom_id)
                        if (current_atom_bonds_filtered.length === 0) {
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
                            current_atom = current_atom_bonds_filtered[0].atom
                        }

                    } while (atoms_count < atoms_copy.length)

                }


            

                // Sort branches by length
                const branches_sorted = branches.sort((branch_1, branch_2)=>{
                    return branch_1.length > branch_2.length? -1: 1
                })


                return branches_sorted



            }

                const __SMILES_w_recursion = function (smiles, atom, atom_bond_type, atoms_no_hydrogens, ringbond_count, used_atom_ids, branch_number, logger) {


                Typecheck(
                    {name: "smiles", value: smiles, type: "array"},
                    {name: "atom", value: atom, type: "object"},
                    {name: "atom_bond_type", value: atom_bond_type, type: "string"},
                    {name: "atoms_no_hydrogens", value: atoms_no_hydrogens, type: "array"},
                    {name: "ringbond_count", value: ringbond_count, type: "number"},
                    {name: "used_atom_ids", value: used_atom_ids, type: "array"},
                    {name: "branch_number", value: branch_number, type: "number"},
                    {name: "logger", value: logger, type: "object"}
                )

                if (used_atom_ids.indexOf(atom.atomId) !==-1) {
                    return
                }

                // Note that the first atom can have more than one bond eg benzene ring
                addAtomToSmiles(smiles, atom, atoms_no_hydrogens, used_atom_ids, logger)
                used_atom_ids.push(atom.atomId)

                // If atom has a ringbond count then we add the ringbond count
                // to smiles. Then we process the atom.
                smiles.push(atomRingBondNumber(atom))


                // Get the number of child bonds
                const child_bonds = childBonds(atom, atoms_no_hydrogens, used_atom_ids, logger)

                // If we have no child bonds and we are on the main trunk then we exit
                if (0 === child_bonds.length && 0 === branch_number) {
                    return
                }

                if (used_atom_ids.length === atoms_no_hydrogens.length) {
                   // return 
                }
        

                if (0 === child_bonds.length) {
                    // @see O=C(N2)C1=CC=CC=C1C2=O (nitrogen atom)
                    if (0 === branch_number) { // we're done getting the smiles
                        return 
                    }
                    smiles.push(debug?'$':')') // end branch
                    if (isEndOfBranchAtom(atom, atoms_no_hydrogens)) {
                        return 
                    } else {
                        branch_number--
                    }
                }
        
                // If the atom is the end of a branch or a child ringbond atom then
                // add '), and return. Note that __SMILES() is called recursively
                // so even if we return from __SMILES() does not mean that we have
                // processed all the atoms.

                if (0 === child_bonds.length && isEndOfBranchAtom(atom, atoms_no_hydrogens))  {
                    // Don't add ')' if atom is the very last atom
                    if (false === isLastAtom (atom, atoms_no_hydrogens, logger)) {
                        smiles.push(debug?'$':')')
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
                        } 
                        __SMILES(smiles, child_bonds[i].atom, child_bonds[0].bond_type, atoms_no_hydrogens, ringbond_count, used_atom_ids, branch_number++, logger)
                    }
                } {
                    // Here atom only has one bond and is not a parent ringbond atom
                    __SMILES(smiles, child_bonds[0].atom, child_bonds[0].bond_type, atoms_no_hydrogens, ringbond_count, used_atom_ids, branch_number, logger)
                }
        
            }


                Typecheck(
                {name: "debug", value: debug, type: "bool"},
                {name: "atoms", value: atoms, type: "array"},
                {name: "logger", value: logger, type: "object"},
            )

            const standard_atom_symbols = ['C','N','O', 'H', 'Br', 'Cl', 'I','At','F']
            const debug_level = 'debug'
            const molecule = this
            
            if (atoms.length === 1 && atoms[0].atomicSymbol === 'H') {
                return 1=== atoms[0].charge(atoms, logger)?'[H+]':'H'
            }

            const used_atom_ids = []
            const atoms_no_hydrogens = atoms.atomsNoHydrogens()
            const branch_number = 0
            
            
            const smiles = __SMILES(atoms_no_hydrogens, 1, used_atom_ids, branch_number, logger)
          
            const smiles_as_string = smiles.reduce((item, carry)=>{
                return item + carry
            }, '')

            return smiles_as_string


    
}







