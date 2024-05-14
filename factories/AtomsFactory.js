/*

AtomsFactory

Converts a SMILES string into an array of atom array objects where each atom
has been added electrons to show bonds.

 */

/*
Does not work for [B-]([O+](CC)CC)(Cl)(Cl)Cl
 */


const range = require("range");
const _ = require('lodash');
const uniqid = require('uniqid');

//const Prototypes = require("../Prototypes")
//Prototypes()

const Typecheck = require('../Typecheck')
const Constants = require('../Constants');
const { ConnectionClosedEvent } = require('mongodb');


const AtomsFactory = (canonicalSMILES) => {

        const AtomFactory = require('./AtomFactory')

        if ('' === canonicalSMILES) {
            throw new Error('Canonical smiles is empty')
        }

        const molecule_id = uniqid().substr(uniqid().length-3,3)


        const previousAtomIndex = (atoms_with_tokens, i) =>{
            
            if (i===0) {
                return 0
            }

            if (undefined === atoms_with_tokens[i].type) {
                return i
            } else {
                return previousAtomIndex(atoms_with_tokens, i-1)
            }

        }

        const makeBonds = (i, atoms, recursion, previous_atom) => {

            Typecheck(
                {name: "index", value: i, type: "number"},
                {name: "atoms", value: atoms, type: "array"},
                {name: "recursion", value: recursion, type: "number"},
            )

            const branches = [[]]
            let current_branch_index = 0
            const branch_indexes = [0]
            const ringbonds = {}
            for(i in atoms) {
                let item = atoms[i]
                if (undefined ===item.type) {
                    if (i > 0) {
                       // console.log('current branch index:' + current_branch_index)
                        const previous_atom = branches[current_branch_index][branches[current_branch_index].length - 1]
                        // bond item to previous atom
                        if (undefined === previous_atom) {
                            throw new Error("Could not find previous atom")
                        }
                        if(undefined !== atoms[i-1].type && atoms[i-1].type === "Bond" && (atoms[i-1].value === ".")){
                            item.makeDisassociativeBond(previous_atom)
                            item.isSingleBondedTo(previous_atom).should.be.false()
                        } else if(item.electronegativity - previous_atom.electronegativity > 1.8){
                            previous_atom.makeIonicBond(item)
                        } else if(previous_atom.electronegativity - item.electronegativity > 1.7){
                            item.makeIonicBond(previous_atom)
                        } else {
                            item.makeCovalentBond(previous_atom, true, atoms)
                            try {
                                if (item.isSingleBondedTo(previous_atom) === false) {
                                    throw new Error('Item should have a single bond with previous atom')
                                }
                            } catch(e) {
                                console.log('Item')
                                console.log(item)
                                console.log('Previous atom')
                                console.log(previous_atom)
                                process.exit()
                            }
                            // Double and triple bonds:
                            if (undefined !== atoms[i - 1].type && atoms[i - 1].type === "Bond" && (atoms[i - 1].value === "=" || atoms[i - 1].value === "#")) {
                                item.makeCovalentBond(previous_atom, true, atoms)
                                try {
                                    if (item.isDoubleBondedTo(previous_atom) === false) {
                                        throw new Error('Item should have a double bond with previous atom')
                                    }
                                } catch(e) {
                                    console.log('Item')
                                    console.log(item)
                                    console.log('Previous atom')
                                    console.log(previous_atom)
                                    process.exit()
                                }
                            }
                            if (undefined !== atoms[i - 1].type && atoms[i - 1].type === "Bond" && atoms[i - 1].value === "#") {
                                item.makeCovalentBond(previous_atom, true, atoms)
                                item.isTripleBondedTo(previous_atom).should.be.true()
                                try {
                                    if (item.isTripleBondedTo(previous_atom) === false) {
                                        throw new Error('Item should have a triple bond with previous atom')
                                    }
                                } catch(e) {
                                    console.log('Item')
                                    console.log(item)
                                    console.log('Previous atom')
                                    console.log(previous_atom)
                                    process.exit()
                                }
                            }
                        }
                        //console.log("Bonded " + item[0] + " to " + previous_atom[0] + "(current branch index " + current_branch_index + ")")
                    }
                    branches[current_branch_index].push(item)
                } else if(undefined !== item.type && item.type === "Bond") {

                } else if(undefined !== item.type && item.type === "Branch" && item.value === "begin") {
                    const previous_atom = branches[current_branch_index][branches[current_branch_index].length-1]
                    current_branch_index++
                    branch_indexes.push(current_branch_index)
                    //console.log("New branch. Changed current branch index to " + current_branch_index)
                    //console.log(branch_indexes)
                    branches[current_branch_index] = [previous_atom] // should not be empty
                } else if (undefined !== item.type && item.type === 'Ringbond') {
                    const previous_atom = branches[current_branch_index][branches[current_branch_index].length-1]
                    if (undefined ===ringbonds[item.value]) {
                        ringbonds[item.value] = previous_atom
                        //console.log("New Ringbond")
                        //console.log(ringbonds)
                    } else {
                        // BOND ringbonds[item.value] to previous atom
                        const child_ringbond_atom_index =  previousAtomIndex(atoms, i)
                        const child_ringbond_atom = atoms[child_ringbond_atom_index]
                        const parent_ringbond_atom = ringbonds[item.value]
                        if (false === child_ringbond_atom.isSingleBondedTo(parent_ringbond_atom)) {
                            child_ringbond_atom.makeCovalentBond(parent_ringbond_atom, true, atoms) // i-1
                        }
                        child_ringbond_atom.isSingleBondedTo(parent_ringbond_atom).should.be.true() // i - 1
                    // console.log("(Ringbond end) Bonding " + atoms[i-1][0] + " to " + ringbonds[item.value][0])
                    }
                } else if(undefined !== item.type && item.type === "Branch" && item.value === "end") {
                //    console.log("[AtomsFactory] Current branch index (end of branch):" + current_branch_index)
                    current_branch_index = branch_indexes[current_branch_index-1]
                    if (undefined === current_branch_index) {
                       // throw new Error('current branch index is undefined.')
                    }
                  //  console.log("[AtomsFactory] End of branch. Changed current branch index to " + current_branch_index)
                    //console.log(branch_indexes)

                }

            }

            /*
            console.log("makeBonds()")
            atoms.map((atom)=>{
                console.log(atom)
            })

            */

        // progress.error()
            return atoms


        }


      //  Typecheck(
      //      {name:"canonicalSMILES", value:canonicalSMILES, type:"string"}
       // )

        // https://www.npmjs.com/package/smiles
        const smiles = require('smiles')

        // parse a SMILES string, returns an array of SMILES tokens [{type: '...', value: '...'}, ...]
        let smiles_tokens = smiles.parse(canonicalSMILES)


        let atoms_with_tokens = _.cloneDeep(smiles_tokens).map(
            (row, i, arr) => {
                if (row.type === "AliphaticOrganic" || row.type === "ElementSymbol") {
                    // We add the charge later
                    const next_row = smiles_tokens[i+1]
                    return AtomFactory(row.value, 0, i+1, 0, '', molecule_id)
                }
                return row
            }
        )
       // smiles_tokens = undefined


        let atoms_with_ringbonds = _.cloneDeep(atoms_with_tokens)
        for (i in atoms_with_ringbonds) {
            const row = atoms_with_ringbonds[i]
            if (undefined !== row.type && 'Ringbond' === row.type) {
                const parent_ringbond_atom = _.find(atoms_with_ringbonds, (a, k)=>{
                    if (undefined !==a.type) {
                        return false
                    }
                    // Check for parent ring bond
                    return row.value === a.ringbondNumber()
                })
                const ringbond_type = undefined === parent_ringbond_atom? 'parent':'child'
                const previous_atom_index = previousAtomIndex(atoms_with_ringbonds, i-1)
                atoms_with_ringbonds[previous_atom_index][Constants().atom_ringbond_index] = row.value
                atoms_with_ringbonds[previous_atom_index][Constants().atom_ringbond_type_index] = ringbond_type
            }
        }
    //    atoms_with_tokens = undefined


        // Check that there are no bonds
        atoms_with_ringbonds.map((atom)=>{
            //console.log('atom')
            //console.log(atom)
            if (atom.length !==undefined) {
                if (atom.bondCount() !==0) {
                    throw new Error("Atom should have no bonds")
                }
            }
        })


        // Filter out brackets
        let atoms_with_tokens_no_brackets = _.cloneDeep(atoms_with_ringbonds).filter(
            (row) => {
                if (undefined !== row.type && (row.type === "BracketAtom")) {
                    return false
                }
                return true
            }
        )
        //atoms_with_ringbonds = undefined


        let atoms_with_bonds = makeBonds(0, atoms_with_tokens_no_brackets, 0)
     //   atoms_with_tokens_no_brackets = undefined

        // Remove 'bond' rows using filter
        const atoms= (atoms_with_bonds).filter(
            (row) => {
                return row.type !== 'HydrogenCount' && row.type !== 'Bond' && row.type !== 'Ringbond' && row.type !== 'Branch'
            }
        )
        atoms_with_bonds = undefined

        let atoms_with_hydrogen_counts = atoms

        // Add hydrogens
        // Pass in to 'bonds()' to avoid errors with elements that are charges
        let atoms_with_hydrogen_counts_no_charges = _.cloneDeep(atoms_with_hydrogen_counts).filter((row)=>{
            return undefined === row.type
        })

        const atoms_with_hydrogens = atoms_with_hydrogen_counts.reduce((carry, atom, index, arr)=> {


            if (undefined !== atom.type && (atom.type === "HydrogenCount" || atom.type === "Charge")) {
                return carry
            }

            if (atom.atomicSymbol === "H") {
                return carry
            }

            let charge_atom_should_be = 0

            // Get charge that the atom should be
            
            if(undefined !== arr[index+1] && undefined !== arr[index+1].type && undefined !== arr[index+1].type && (arr[index+1].type === 'Charge')){
                charge_atom_should_be = arr[index+1].value
            }



            let number_of_hydrogens_to_add = 0

            atom[Constants().atom_charge_index] = charge_atom_should_be
            

            // Carbon
            /*
            Note the both [C+] and [C-] have the same number of hydrogens. The difference is that
            [C-] has an additional electron that it can share with another atom. In the case of [C+]
            the carbon atom is missing an electron pair and therefore can only form three bonds.
            */
            if (atom.atomicSymbol=== "C") {
                
                const free_electron_pairs = atom.electronPairs.filter((electron_pair) => {
                    return electron_pair.length === 1
                })
                if (charge_atom_should_be > 0) {
                    // To have a positive charge a carbon atom loses an electron pair.
                    // This is because carbon cannot form additional bonds.
                    number_of_hydrogens_to_add = free_electron_pairs.length - 1
                    // Remove first free electron
                    // Find index of a lone electron
                    const lone_pair_index = _.findIndex(atom.electronPairs, (ep)=>{
                        return ep.length === 1
                    })
                    if (-1 !== lone_pair_index) {
                        // Remove electron at index
                        atom.electronPairs.splice(lone_pair_index, 1);
                    }
                    
                    //progress.error()
                }
                if (charge_atom_should_be < 0) {
                    // Here we add an electron making sure that the carbon
                    // doesn't already have four bonds.
                    if (atom.bondCount() === 4) {
                        throw new Error('Carbon atom cannot have a negative charge as it has four non-hydrogen bonds. Making the carbon negative would mean removing one of the bonds.')
                    }
                    const electron = atom.atomicSymbol + '.' + atom.atomId + '.' + '999'
                    atom.electronPairs.push([electron])
                    number_of_hydrogens_to_add = free_electron_pairs.length/2
                    //console.log(atom)
                    //console.log(number_of_hydrogens_to_add)
                    //throw new Error('testing')

                }
            } else if(atom.electronsPerShell.length > 2) {

                // @todo
                if ('Hg'===atom.atomicSymbol) {
                    number_of_hydrogens_to_add = 0
                } else {
                    number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds - atom.bonds(atoms_with_hydrogen_counts_no_charges).length + charge_atom_should_be
                }
    
            } else {

    
                // For both [O+] and [O-] before adding hydrogens each has 3 free electron pairs (valence = 6)
                // [O-] => 1 hydrogens, [O+] => 3 hydrogens
                // [N-] => 2 hydrogens, [N+] => 4 hydrogens
                // Atom should have more electrons to give it a negative charge
                if (charge_atom_should_be < 0) {
                    const electron = atom.atomicSymbol + '.' + atom.atomId +'.' +'999'
                    atom.electronPairs.push([electron])
                    number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds - 1 - atom.bonds(atoms_with_hydrogen_counts_no_charges).length
                }

                // Atom should have less electrons to give it a positive charge
                if (charge_atom_should_be > 0) {


                    // console.log("Number of hydrogens to add:" + number_of_hydrogens_to_add)
                    number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds + (1 - atom.bondCount())

                    // ?????
                    const electron_pairs = atom.electronPairs.filter((electron_pair)=>{
                    // return electron_pair.length === 1
                        return true
                    })

                    if (atom.bondCount() === 0) {
                        electron_pairs.pop()
                    }
                    atom.electronPairs = electron_pairs
                }


            }

        // console.log(atom.bonds(arr))
            const ionic_electrons = atom.electrons().filter((electron)=>{
                return electron.split('.')[0] === 'ionic'
            })



            if (atom.atomicSymbol !== 'CXXX') {
                if (charge_atom_should_be === 0) {
                    //  number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds - atom.bondCount() - ionic_electrons.length
                    if ('Hg'===atom.atomicSymbol) {
                        number_of_hydrogens_to_add = 0
                    } else {  // Constants().atom_neutral_number_of_bonds_index = 3
                        number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds - atom.bondCount() - ionic_electrons.length
                    }
                }
/*
                if (charge_atom_should_be === -1 && atom.atomicSymbol !== 'C') {
                // console.log(atom)
                // console.log(ionic_electrons.length)
                // console.log(atom.neutralAtomNumberOfBonds)
                // console.log(atom.bondCount(true))
                //   throw new Error('Tests')
                    if (0 === atom.bondCount()) {
                        number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds - 1
                    } else {
                        number_of_hydrogens_to_add = atom.neutralAtomNumberOfBonds - atom.bondCount() - ionic_electrons.length
                    }
                }
                */
    

                if (false && atom.atomicSymbol === 'O') {
                    console.log(canonicalSMILES)
                    console.log('expected charge:'+charge_atom_should_be)
                    console.log(number_of_hydrogens_to_add)
                    console.log(ionic_electrons)
                    throw new Error('testing1')
                }
            }
   
            let i = 0
            for(i=0;i<number_of_hydrogens_to_add;i++) {
                if (atom.electrons().length > 0) {
                    let hydrogen = AtomFactory('H', 0, i, 0, '', molecule_id)
                    hydrogen.makeCovalentBond(atom, true, atoms_with_hydrogen_counts)
                    carry.push(hydrogen)
                }
            }


            //console.log('Number of oxygens to add' + number_of_hydrogens_to_add)
            //console.log(atom.charge(arr))
            //process.error()

            carry.push(atom)

            /*
            if (atom.atomicSymbol === 'P'){
                console.log('AtomsFactory!@@')
                console.log(number_of_hydrogens_to_add)
                console.log(atom)
                process.exit()
            }
            */

            return carry

        },[])
        atoms_with_hydrogen_counts = undefined

        

       if (0 === atoms_with_hydrogens.length) {
            console.log('Smiles: '+ canonicalSMILES)
            throw new Error('No atoms after adding hydrogens')
       }
        

        // Partial charges
        atoms_with_hydrogens.map((atom)=>{

            if (atom.atomicSymbol==="H") {
                return atom
            }

            if (atom.atomicSymbol==="C" && atom[Constants().atom_charge_index]===0) {
                // Find oxygen atom with double bond to carbon atom.
                // Oxygen atom will have a part
                const oxygen_atom = atom.bonds(atoms_with_hydrogens).filter((bond)=>{
                    return bond.atom[Constants().atom_charge_index] === 0 && bond.atom.atomicSymbol === "O" && bond.bond_type === "="
                })[0]
                if (undefined !== oxygen_atom) {
                    atom[Constants().atom_charge_index] ="&+"
                    atoms_with_hydrogens[oxygen_atom.atom_index][Constants().atom_charge_index] = "&-"
                }
            }

            return atom
        })


      //  atoms_with_hydrogens.checkHydrogens('AtomsFactory')
      const actual_number_of_hydrogens2 = atoms_with_hydrogens.actualNumberOfHydrogens('AtomsFactory2')
      const calculated_number_of_hydrogens2 = atoms_with_hydrogens.calculatedNumberOfHydrogens('AtomsFactory2')
      if (actual_number_of_hydrogens2 !== calculated_number_of_hydrogens2) {
          console.log('AtomsFactory2 incorrect hydrogens actual: ' + actual_number_of_hydrogens2 + ' expected: ' + calculated_number_of_hydrogens2)
          process.exit()
      }

      atoms = atoms_with_hydrogens
      
/**
* @param atoms
* 
* @return { Array } An array of single bonds
*/
const singleBonds = function(atoms) {
    return this.bonds(atoms).filter((bond) => {
      return bond.bondType === '' // todo why isn't this bond.bond_type?
    });
};
  
/**
* @param atoms - 
* @param no_hydrogens
* @param logger
* 
* @return { number } Number of bonds
*/
const bondCountAsSingleBonds = function(atoms, no_hydrogens, logger) {
    const atom = this;
  
    const tripleBondCount = atom.tripleBonds(atoms, no_hydrogens).length * 3;
    const doubleBondCount = atom.doubleBonds(atoms, no_hydrogens).length * 2;
    const singleBondCount = atom.singleBonds(atoms, no_hydrogens).length;
  
    const bond_count = tripleBondCount + doubleBondCount + singleBondCount;
  
    return bond_count;
};

/**
* @param atoms
* @param logger
* 
* @return True if charge is detected false otherwise. Note that this atom must be a C atom
*/
const isCarbocation = function(atoms, logger) {
    const atom = this
    // @todo bondCountAsSingleBonds() does not count hydrogens
    const bond_count = atom.bondCountAsSingleBonds(atoms, true, logger) + atom.hydrogens(atoms).length
    const charge = atom.charge(atoms, logger)
    return atom.atomicSymbol === 'C' && bond_count === 3 && charge === 1
}
  
/**
* @param atoms
* 
* @return { Array } An array of atoms that belong to this atom
*/
const ionicBonds = function(atoms) {
    const ionic_bonds = [];
    const ionic_electrons = this.electrons().filter((electron) => electron.split('.')[0] === 'ionic');
  
    // Add bond to ionic bonds.
    if (ionic_electrons.length > 0) {
      const atom_id = ionic_electrons[0].split('.')[2];
      const child_atom = _.find(atoms, (_atom) => _atom.atomId === atom_id);
  
      // Add bond to ionic bonds.
      if (child_atom !== null) {
        ionic_bonds.push({
          'parent': this,
          'atom': child_atom,
          'atom_index': -1,
          'bond_type': 'ionic',
        });
      }
    }
  
    const ionic_bonds_to_parent = this.bonds(atoms).filter((bond) => bond.bond_type === 'ionic');
  
    return [...ionic_bonds, ...ionic_bonds_to_parent];
};

/**
* @param atoms
* 
* @return { Array } bonds for this atom as an array of
*/
const doubleBonds = function(atoms) {
    const atom = this;
    const bonds = atom.bonds(atoms);
    return bonds.filter(bond => bond.bondType === '=');
};
  
/**
* @param atoms
* 
* @return { array } Array of carbon bonds
*/
const carbonBonds = function(atoms) {
    const baseAtom = this;
    const bonds = baseAtom.bonds(atoms, true);
    return bonds.filter((bond) => bond.atom.atomicSymbol === 'C');
};
  
/**
* @param atoms
* 
* @return { Array } Array of triple bonds bonded to atom
*/
const tripleBonds = function(atoms) {
    const baseAtom = this;
    return baseAtom.bonds(atoms).filter((bond) => bond.bond_type === '#');
};

const isCarbonylCarbon = function(atoms, logger) {
    const possible_carbonyl = this
    // Not a carbon so return false.
    if ('C' !== possible_carbonyl.atomicSymbol) {
       return false
    }
    // Now check if the atom is bonded to a terminal oxygen and if it is return true.
    return undefined !== _.find(this.bonds(atoms, logger), (bond)=>{
       return 'O' === bond.atom.atomicSymbol && bond.atom.isTerminalAtom(atoms)
    })
}

/**
* @param atoms
* 
* @return { Atom [] } Array of hydrogen atoms
*/
const hydrogens = function(atoms) {
    const baseAtom = this;
    // Look for electron pairs where the second item starts with 'H'
    const hydrogen_atoms = baseAtom.electronPairs.filter((ep)=>{
      return undefined !== ep[1] && ep[1].charAt(0) === 'H'
    }).map((ep)=>{
      // Array(2) [O.vg63.1, H.vg6Hvgg.0]
      const hydrogen_parts = ep[1].split('.')
      const atom_id = hydrogen_parts[1]
      return _.find(atoms, (atom)=>{
        return atom.atomId === atom_id
      })
    })
  
    return hydrogen_atoms
  
};

/**
* @param atoms
* @param logger
* 
* @return { Number } Atom charge < 0 if negative, 0 if neutral, > 0 if positive
*/
const charge = function(atoms, logger) {
    // Returns 1 if this bond is alide or 0 if it is alide.
    if (this.isHalide()) {
      const hasIonicBond = _.find(this.electrons(), (electron) => electron.split('.')[0] === 'ionic');
      return hasIonicBond ? -1 : 0;
    }
  
    const atomicSymbol = this.atomicSymbol;
    let charge = 0;
    
    const number_of_bonds = this.bondCount(atoms);
  
    // The atomic symbol is the atomic symbol.
    switch (atomicSymbol) {
      case 'Hg':
        // The number of bonds in the number of bonds.
        switch (number_of_bonds) {
          case 0:
            charge = -2;
            break;
          case 1:
            charge = -1;
            break;
          case 2:
            charge = 0;
            break;
          case 3:
            charge = 1;
            break;
        }
        break;
      case 'N':
        // The number of bonds in the number of bonds.
        switch (number_of_bonds) {
          case 1:
            charge = -2;
            break;
          case 2:
            charge = -1;
            break;
          case 3:
            charge = 0;
            break;
          case 4:
            charge = 1;
            break;
        }
        break;
      case 'P':
        // The number of bonds in the number of bonds.
        switch (number_of_bonds) {
          case 1:
            charge = -2;
            break;
          case 2:
            charge = -1;
            break;
          case 3:
            charge = 0;
            break;
          case 4:
            charge = 1;
            break;
        }
        break;
      case 'O':
        switch (number_of_bonds) {
          case 1:
            charge = -1;
            break;
          case 2:
            charge = 0;
            break;
          case 3:
            charge = 1;
            break;
        }
        break;
      case 'K':
        charge = this.electrons().length === 0 ? 1 : 0;
        break;
      default:
        charge = this.valenceElectronsCount - this.nonBondedElectrons().length - number_of_bonds;
    }
  
    return charge;
  }
  

/**
* @param atoms
* 
* @return { boolean } True if the atom if the atom is a terminal atom
*/
const isTerminalAtom = function(atoms) {
    return this.bondCountNoHydrogens(atoms) === 1 || this.bonds(atoms).length === 0;
}

/**
* @param atoms - includeHydrogens Whether to include hydrogen in the result.
* @param includeHydrogens
* 
* @return { Array } An array of BondedAtom objects
*/
const bonds = function(atoms, includeHydrogens) {
    const parentAtom = this;
  
    return atoms.reduce((bonds, atom, atomIndex) => {
      // Returns the bonds in the atom.
      if ((!includeHydrogens || includeHydrogens === false) && atom.atomicSymbol === "H") {
        return bonds;
      }
  
      if (_.isEqual(parentAtom.atomId, atom.atomId)) {
        return bonds;
      }
  
      // Returns the bonds that are bonds that are not bonds.
      if (!parentAtom.isBondedTo(atom)) {
        return bonds;
      }
  
      // Adds a bond to the list of bonds to the bond list.
      if (parentAtom.isIonicBondedTo(atom)) {
        bonds.push({
          parent: parentAtom,
          atom: atom,
          atomIndex: atomIndex,
          bondType: "ionic",
        });
      // Adds a bond to the bond list.
      } else if (!atom.isIonicBondedTo(parentAtom)) {
        const electronPairs = parentAtom.sharedElectronPairs(atom);
  
        // This method is used to check if number of shared electron pairs is greater than 0
        if (electronPairs.length < 1) {
          console.log("Number of shared electron pairs should be greater than 0");
          console.log("Parent atom");
          console.log(parentAtom);
          console.log("Target atom");
          console.log(atom);
        }
  
        // Adds a new bond to the list of bonds.
        if (parentAtom.isSingleBondedTo(atom)) {
          // Checks if atom is a single bond.
          if (!atom.isSingleBondedTo(parentAtom)) {
            console.log("parent atom");
            console.log(parentAtom);
            console.log("atom");
            console.log(atom);
            throw new Error("Mismatching bonds (single)");
          }
  
          bonds.push({
            parent: parentAtom,
            atom: atom,
            atomIndex: atomIndex,
            bondType: "",
            electronPairs: electronPairs,
          });
        // Adds a bond to the bonds array.
        } else if (parentAtom.isDoubleBondedTo(atom)) {
          // Checks if the atom is double bonding.
          if (!atom.isDoubleBondedTo(parentAtom)) {
            console.log("parent atom");
            console.log(parentAtom);
            console.log("atom");
            console.log(atom);
            throw new Error("Mismatching bonds (double)");
          }
  
          bonds.push({
            parent: parentAtom,
            atom: atom,
            atomIndex: atomIndex,
            bondType: "=",
            electronPairs: electronPairs,
          });
        // Adds a bond to the bonds list.
        } else if (parentAtom.isTripleBondedTo(atom)) {
          // Checks if atom is a triple bonds.
          if (!atom.isTripleBondedTo(parentAtom)) {
            console.log("parent atom");
            console.log(parentAtom);
            console.log("atom");
            console.log(atom);
            throw new Error("Mismatching bonds (triple)");
          }
  
          bonds.push({
            parent: parentAtom,
            atom: atom,
            atomIndex: atomIndex,
            bondType: "#",
            electronPairs: electronPairs,
          });
        }
      }
  
      return bonds;
    }, []);
};
  
    return {
        'atoms': atoms,
        'singleBonds': singleBonds(atoms),
        'bondCountAsSingleBonds': bondCountAsSingleBonds(atoms),
        'is_carbocation': isCarbocation(atoms),
        'ionicBonds': ionicBonds(atoms),
        'doubleBonds': doubleBonds(atoms),
        'tripleBonds': tripleBonds(atoms),
        'hydrogens': hydrogens(atoms),
        'is_terminal_atom': isTerminalAtom(atoms),
        'bonds': bonds(atoms),
        'carbonBonds': carbonBonds(atoms),
        'is_carbonyl_carbon': isCarbonylCarbon(atoms),
        'charge':charge(atoms)
    }


}

module.exports = AtomsFactory









