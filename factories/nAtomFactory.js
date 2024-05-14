
const _ = require('lodash');
const uniqid = require('uniqid');
const PeriodicTable = require('./PeriodicTable')
//const Prototypes = require("../Prototypes")
//Prototypes()
const Typecheck = require("../Typecheck")
const Constants = require("../Constants")
const MoleculeFactory = require('../factories/MoleculeFactory')
const env = require('../env');

/**
* @return { Ringbond } The ringbond number
*/
const ringbondNumber = function() {
  return this.ringbond
}

/**
* @return { string } The type of ring bond
*/
const ringbondType = function() {
  return this.ringbondType;
}


/**
* @return { Array } Array of electron pairs in this atom that are not bonded
*/
const nonBondedElectrons = function() {
  return this.electronPairs
    .filter((electron_pair) => {
      // Atom electron pair is undefined.
      if (electron_pair === undefined) {
        console.log('Atom');
        console.log(this.electronPairs);
        throw new Error('Electron pair is undefined');
      }
      return electron_pair.length === 1;
    })
    .map((electron_pair) => electron_pair[0]);
}


/**
* @return { boolean } True if the atom symbol is one of the halides
*/
const isHalide = function() {
  const halides = ['Br', 'Cl', 'F', 'I'];
  return halides.includes(this.atomicSymbol);
}



/**
* @param childAtom
* 
* @return { boolean } True if the electrons of the childAtom are
*/
const isIonicBondedTo = function(childAtom) {
  const parentAtom = this;

  const childAtomElectrons = childAtom.freeElectrons().filter((electronPair) => {
    // Check if the electronPair is a single electron pair.
    if (electronPair.length > 1) {
      return false;
    }
    return electronPair[0] === `ionic.${parentAtom.atomicSymbol}.${parentAtom.atomId}`;
  });

  // Returns true if there are any child atoms in the list of electrons.
  if (childAtomElectrons.length > 0) {
    return true;
  }

  // Try reverse
  const parentAtomElectrons = parentAtom.freeElectrons().filter((electronPair) => {
    // Check if the electronPair is a single electron pair.
    if (electronPair.length > 1) {
      return false;
    }
    return electronPair[0] === `ionic.${childAtom.atomicSymbol}.${childAtom.atomId}`;
  });

  return parentAtomElectrons.length > 0;
};







/**
* @return { Array } electrons
*/
const electrons = function() {
  // Get electrons belonging to the atom into an array
  const electrons = this.electronPairs.reduce((carry, electronPair) => {
    // An electron pair can have one or two electrons plus optionally a bond charge.
    carry.push(electronPair[0]);
    // Adds the electron pair to carry.
    if (electronPair[1] !== undefined) {
      carry.push(electronPair[1]);
    }
    return carry;
  }, []);
  
  return electrons;
};

/**
* @param siblingAtom
* 
* @return { boolean } True if the atom has a triple bond with the sibling atom
*/
const isTripleBondedTo = function(siblingAtom) {
  const baseAtom = this;

  // Checks if base atom and sibling atom are the same.
  if (_.isEqual(baseAtom, siblingAtom)) {
    throw new Error('Base atom and sibling atom are the same');
  }

  const matchingPairs = baseAtom.sharedElectronPairs(siblingAtom);
  
  return matchingPairs.length === 3;
};


/**
* @param siblingAtom
* 
* @return { boolean } True if the atom has a double bond with the sibling atom
*/
const isDoubleBondedTo = function(siblingAtom) {
  const baseAtom = this;

  // Checks if base atom and sibling atom are the same.
  if (_.isEqual(baseAtom, siblingAtom)) {
    throw new Error('Base atom and sibling atom are the same');
  }

  const matchingPairs = baseAtom.sharedElectronPairs(siblingAtom);
  
  return matchingPairs.length === 2;
};


/**
* @param siblingAtom
* 
* @return { array } An array of electrons shared by the sibling atom and atom
*/
const sharedElectronPairs = function(siblingAtom) {
  const baseAtom = this;
  
  // Checks if base atom and sibling atom are the same.
  if (_.isEqual(baseAtom, siblingAtom)) {
    throw new Error('Base atom and sibling atom are the same');
  }
  
  // Filter 'pairs' containing only one element
  let baseAtomElectronPairs = _.cloneDeep(baseAtom.electronPairs).filter(baseAtomElectronPair => baseAtomElectronPair.length > 1);
  
  // If an electron has 4 elements, remove the last element
  // We reverse each electron pair, otherwise, we won't get a match with the base atom ('this')
  // even if there is a bond
  const siblingAtomElectronPairs = _.cloneDeep(siblingAtom.electronPairs)
    .map(siblingAtomElectronPair => _.cloneDeep(siblingAtomElectronPair).reverse())
    .filter(siblingAtomElectronPair => siblingAtomElectronPair.length > 1);
  
  const matchingPairs = baseAtomElectronPairs.reduce((carry, baseAtomElectronPair) => {
    const baseAtomElectronPairParts1 = baseAtomElectronPair[0].split(".");
    const baseAtomElectronPairParts2 = baseAtomElectronPair[1].split(".");
    // Add base atom electron pair to carry.
    if (_.findIndex(siblingAtomElectronPairs, siblingAtomElectronPair => {
      const siblingAtomElectronPairParts1 = siblingAtomElectronPair[0].split(".");
      const siblingAtomElectronPairParts2 = siblingAtomElectronPair[1].split(".");
      return siblingAtomElectronPairParts1[1] === baseAtomElectronPairParts1[1] && siblingAtomElectronPairParts2[1] === baseAtomElectronPairParts2[1];
    }) !== -1) {
      carry.push(baseAtomElectronPair);
    }
    return carry;
  }, []);
  
  return matchingPairs;
};


/**
* @param siblingAtom
* 
* @return { boolean } True if atom has a single bond to the sibling atom
*/
const isSingleBondedTo = function(siblingAtom) {
  const baseAtom = this;

  // Checks if base atom and sibling atom are the same.
  if (_.isEqual(baseAtom, siblingAtom)) {
    throw new Error('Base atom and sibling atom are the same');
  }

  const matchingPairs = baseAtom.sharedElectronPairs(siblingAtom);

  return matchingPairs.length === 1;
};





 
/**
* @param targetAtom
*/
const makeIonicBond = function(targetAtom) {
  // Check if the target atom has at least one free electron.
  if (targetAtom.freeElectrons().length === 0) {
    throw new Error('Target atom has no free electrons so unable to form an ionic bond.')
  }
  // Move an electron from 'this' to the target atom.
  const freeElectron = this.freeElectrons().pop(); // Note - return electron pairs
  _.remove(this.electronPairs, electronPair => _.isEqual(freeElectron, electronPair));
  // Add electron to target atom but mark that it is from the base atom and there is an ionic bond between base and target atoms
  targetAtom.electronPairs.push([`ionic.${this.atomicSymbol}.${this.atomId}`]);
};




/**
* @return { Number } The number of electrons the atom has
*/
const electronCount = function() {
  return this.electronPairs.reduce((carry, electronPair) => carry + electronPair.length, 0);
};

/**
* @return { number } The number of free slots the atom has ie the number of new dative bond the atom can accept
*/
const freeSlots = function() {
  const electronCount = this.electronCount();
  const outerShellMaxNumberOfElectrons = this.outershellMaxNumberOfElectrons; // 8 for C, N, etc
  const freeSlotsCount = (outerShellMaxNumberOfElectrons - electronCount) / 2;
  return freeSlotsCount;
};


/**
* @return { Number } number of electron pairs atom has where there are two electrons
*/
const bondCount = function() {
  /*
    An atom has an array of electron "pairs." Each electron pair has either one or two electrons.
    If there are two electrons, it indicates a bond. If there is only one electron, the electron "pair" has not formed a bond.
    To form a bond, we take the electron from an electron pair with one electron and add it to the electron pair from the other atom,
    where that atom's electron pair also has one electron. We then do the same in reverse so that the atoms share two electrons,
    one from each atom.
  */
  return this.electronPairs.filter(electronPair => electronPair.length === 2 || electronPair.length === 3).length;
};


/**
* @return { Array } Array of electron "pairs" where there is only one electron
*/
const freeElectrons = function() {
  let freeElectrons = this.electronPairs.filter(electronPair => electronPair.length === 1);
  
  if (this.atomicSymbol === 'Hg' && freeElectrons.length === 0) {
    const atomId = this.atomId;
    const e1 = `Hg.${atomId}.111`;
    const e2 = `Hg.${atomId}.222`;
    this.electronPairs.push([e1]);
    this.electronPairs.push([e2]);
    freeElectrons.push([e1]);
    freeElectrons.push([e2]);
  } else if (this.atomicSymbol === 'Cl') {
    if (this.bondCount === 1) {
      freeElectrons = [];
    } else {
      freeElectrons = [[freeElectrons[0][0]], [freeElectrons[1][0]]];
    }
  }
  
  return freeElectrons;
};

  

// ATOM MODEL
// atomic symbol, proton count, max valence count*, max number of bonds, velectron1, velectron2, velectron3
// electrons are unique strings, v=valence
// * Maximum number of electrons in valence shell.
const AtomFactory = (atomicSymbol, inititalCharge, index, ringbond, ringbond_type, molecule_id, logger) => {
    try {
        if (index===undefined || index === null) {
            index = 0
        }   
        if (atomicSymbol === undefined || atomicSymbol === null) {
            throw new Error("Atomic symbol is undefined or null")
        }    
        if (inititalCharge === undefined || inititalCharge === null) {
            throw new Error("Initial charge is undefined or null")
        }  
        // If charge is -1 then we need to add an extra electron
        // If charge is +1 then we need to remove an  electron
        const maxElectronsPerShell = [2, 8, 18, 32, 50, 72, 98]
    // * Maximum number of electrons in valence shell (how many bonds it has when neutrally charged).
         let atom = null
         let atomId = null
         //const atomId = uniqid().substr(uniqid().length-3,3)
         if ('H' !== atomicSymbol) {
            atomId = molecule_id + '' + index  
         } else {
            atomId = molecule_id + 'H' + uniqid().substr(uniqid().length-3,3)
         }
         const neutralAtomOutershellElectronCount = 8 // @todo
         if (atomicSymbol === "R" || atomicSymbol === "X"  ) {
            atom = {
                atomicSymbol:atomicSymbol,
                atomic_number:-1,
                valenceElectronsCount:-1,
                neutralAtomNumberOfBonds:-1,
                charge:charge,
                atomId:atomId,
                electronegativity:null,
                neutralAtomOutershellElectronCount:neutralAtomOutershellElectronCount,
                index:index,
                electronsPerShell:null,
                electronPairs:null,
                outershellMaxNumberOfElectrons:null,
                makeCovalentBond:makeCovalentBond,
                freeElectrons:freeElectrons,
                bondCount:bondCount,
                freeSlots: freeSlots,
                electronCount: electronCount,
                bondAtomToAtom: bondAtomToAtom,
                makeIonicBond: makeIonicBond,
                makeDativeBond: makeDativeBond,
                isSingleBondedTo:isSingleBondedTo,
                sharedElectronPairs: sharedElectronPairs,
                isDoubleBondedTo: isDoubleBondedTo,
                isTripleBondedTo: isTripleBondedTo,
                bonds: bonds,
                isBondedTo: isBondedTo,
                isHalide: isHalide,
                nonBondedElectrons: nonBondedElectrons,
                ringbondType: ringbondType,
                ringbond: ringbond,
                ringbondNumber: ringbondNumber,
                isTerminalAtom: isTerminalAtom,
                bondCountNoHydrogens: bondCountNoHydrogens,
                hydrogens: hydrogens,
                tripleBonds:tripleBonds,
                carbonBonds: carbonBonds,
                breakBond: breakBond,
                ionicBonds:ionicBonds,
                doubleBonds: doubleBonds,
                isCarbocation: isCarbocation,
                bondCountAsSingleBonds: bondCountAsSingleBonds,
                singleBonds: singleBonds,
                carbons: carbons,
                isMoreAcidicThan:isMoreAcidicThan,
                removeBondFromCarbon: removeBondFromCarbon,
                atomShift: atomShift,
                isCarbonylCarbon: isCarbonylCarbon,
                makeCarbocation: makeCarbocation
            }
       } else {    
            if (PeriodicTable[atomicSymbol] === undefined) {
                throw new Error("Could not find atom " + atomicSymbol + " in periodic table.")
            }
            // @see https://sciencenotes.org/list-of-electronegativity-values-of-the-elements/
            const electronegativity_map  = {
                "H":2.1, "O":3.5,"N":3,"C":2.55,"Li":1,"Be":1.5,"Na":0.9,"Mg":1.2,"K": 0.8,"Ca":1,"B":2,"Be":1.5,"F":4,"Al":3.5,"Si":1.8,"P":2.1,"S":2.5,"Cl":3.16,"Br":2.8,"I":2.5}            
            const electronegativity = electronegativity_map[atomicSymbol]   
            const atom_size_map = {"C":1,"N":1,"O":1,"F":1,"P":2,"S":2,"Cl":2,"Br":3,"I":4,'H':0,'B':1}
    	    const atomSize = atom_size_map[atomicSymbol]
            const electronsPerShell = PeriodicTable[atomicSymbol].electrons_per_shell.split("-")
            let valenceElectronsCount = _.clone(electronsPerShell).pop() * 1
            const outershellMaxNumberOfElectrons = maxElectronsPerShell[electronsPerShell.length-1]
            let neutralAtomNumberOfBonds = null
            switch (atomicSymbol) {
                case 'C':
                    neutralAtomNumberOfBonds = 4
                    break
                case 'H':
                    neutralAtomNumberOfBonds = 1
                    break
                case 'N':
                    neutralAtomNumberOfBonds = 3
                break
                case 'O':
                    neutralAtomNumberOfBonds = 2
                    break
                case 'Al':
                    neutralAtomNumberOfBonds = 3
                    break
                case 'Hg':
                    neutralAtomNumberOfBonds = 3
                    break
                case 'Ac':
                    neutralAtomNumberOfBonds = 2
                    break
                case 'Cl':
                    neutralAtomNumberOfBonds = 1
                    break
                case 'B':
                    neutralAtomNumberOfBonds = 3
                    break
                case 'K':
                    neutralAtomNumberOfBonds = 0 // 1
                    maxElectronsPerShell = 1
                    break
                case 'P':
                      neutralAtomNumberOfBonds = 3 // 1
                      valenceElectronsCount = 5
                break
                case 'S':
                        // @todo check number of bonds for neutral sulphur atom
                        neutralAtomNumberOfBonds = 2 
                        valenceElectronsCount = 6
                break
    
                  default:
                    valenceElectronsCount = 8
            }
            const atomicNumber = PeriodicTable[atomicSymbol].atomic_number * 1
                let i=0  
          const electronPairs = []
            for(i=0;i<valenceElectronsCount;i++) {
                electronPairs.push([atomicSymbol+'.'+atomId+'.'+i])
            }
            atom = {
                atomicSymbol:atomicSymbol,
                atomic_number:atomicNumber,
                valenceElectronsCount:valenceElectronsCount,
                neutralAtomNumberOfBonds:neutralAtomNumberOfBonds,
                charge:charge,
                atomId:atomId,
                electronegativity:electronegativity,
                atom_size:atomSize,
                neutralAtomOutershellElectronCount:neutralAtomOutershellElectronCount,
                index:index,
                electronsPerShell:electronsPerShell,
                electronPairs:electronPairs,
                outershellMaxNumberOfElectrons:outershellMaxNumberOfElectrons, 
                makeCovalentBond:makeCovalentBond,
                freeElectrons:freeElectrons,
                bondCount:bondCount,
                freeSlots: freeSlots,
                electronCount: electronCount,
                bondAtomToAtom: bondAtomToAtom,
                makeIonicBond: makeIonicBond,
                makeDativeBond: makeDativeBond,
                isSingleBondedTo: isSingleBondedTo,
                sharedElectronPairs: sharedElectronPairs,
                isDoubleBondedTo: isDoubleBondedTo,
                isTripleBondedTo: isTripleBondedTo,
                electrons: electrons,
                bonds: bonds,
                isBondedTo: isBondedTo,
                isIonicBondedTo: isIonicBondedTo,
                isHalide: isHalide,
                nonBondedElectrons: nonBondedElectrons,
                ringbondType: ringbondType,
                ringbond: ringbond,
                ringbondNumber: ringbondNumber,
                isTerminalAtom: isTerminalAtom,
                bondCountNoHydrogens: bondCountNoHydrogens,
                hydrogens: hydrogens,
                tripleBonds:tripleBonds,
                carbonBonds: carbonBonds,
                breakBond: breakBond,
                ionicBonds: ionicBonds,
                doubleBonds: doubleBonds,
                isCarbocation: isCarbocation,
                bondCountAsSingleBonds: bondCountAsSingleBonds,
                singleBonds: singleBonds,
                carbons: carbons,
                isMoreAcidicThan: isMoreAcidicThan,
                removeBondFromCarbon: removeBondFromCarbon,
                atomShift: atomShift,
                isCarbonylCarbon: isCarbonylCarbon,
                makeCarbocation: makeCarbocation,
                removeElectron: removeElectron
            }
        }
        return atom
    } catch(e) {
        console.log('[AtomFactory] ' + e)
        logger.log('error', 'AtomFactory() '+e)
        console.log(e.stack)
        process.exit(100, '[AtomFactory] Terminal error.')
    }


    
}


module.exports = AtomFactory
