
const _ = require('lodash');

// container and molecule can be null.
// If container is null then molecule must be passed by value and cannot be null.
// If container is not null then it must be passed by value and both molecule and atom must be passed in by reference.
class AtomManager {

    /**
    * @param targetAtom
    */
    makeIonicBond(targetAtom) {
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
     * @param targetAtom
     * @param allowHydrogenAsTargetAtom
     * @param atoms
     * @param logger
     *
     * A covalent bond is where two atoms share a pair of electrons
     * with the atoms donating one electron each.
     *
     * @return { Array } Array of atoms after covalent bond formed
     */
    // molecule, sibling_atom, logger
    makeCovalentBond(targetAtom, allowHydrogenAsTargetAtom, atoms, logger) {

        // Get free electrons from the base atom and target atom.
        const baseAtom = this
        const baseAtomClone = _.cloneDeep(baseAtom);
        const targetAtomClone = _.cloneDeep(targetAtom);
        const baseAtomFreeElectron = baseAtomClone.freeElectrons()[0][0];
        const targetAtomFreeElectron = targetAtomClone.freeElectrons()[0][0];
    
        // Create the electron pair to add to the target atom.
        const targetAtomElectronPairToAdd = [
        targetAtomFreeElectron,
        baseAtomFreeElectron
        ];
    
        // Create the electron pair to add to the base atom.
        const baseAtomElectronPairToAdd = [
        baseAtomFreeElectron,
        targetAtomFreeElectron,
        ];
    
        // Add electron pair to target atom
        targetAtom.electronPairs.push(targetAtomElectronPairToAdd)
    
        // Add electron pair to base atom
        baseAtom.electronPairs.push(baseAtomElectronPairToAdd)
    
        // Remove free electrons used above from base atom and target atom
        _.remove(baseAtom.electronPairs, electronPair => electronPair.length === 1 && electronPair[0] === baseAtomElectronPairToAdd[0])
        _.remove(targetAtom.electronPairs, electronPair => electronPair.length === 1 && electronPair[0] === targetAtomElectronPairToAdd[0])
    
        return atoms
    
    };

    /**
     * @param targetAtom
     * @param allowHydrogenAsTargetAtom
     * @param atoms
     * @param logger
     *
     * A coordinate bond (also called a dative covalent bond) is a covalent bond (a shared pair of electrons) in which
        * both electrons come from the same atom.
    *
    * @return { Array } Array of atoms after dative bond formed
    */
    makeDativeBond(targetAtom, allowHydrogenAsTargetAtom, atoms, logger) {

        // Get free electrons from the base atom (the atom that will donate two electrons)
        const baseAtom = this
        const baseAtomClone = _.cloneDeep(baseAtom);
    
            if (undefined === baseAtomClone.freeElectrons()[0] || undefined === baseAtomClone.freeElectrons()[0][0]) {
            const MoleculeFactory = require('../factories/MoleculeFactory')
            const m = MoleculeFactory(
                atoms,
                false,
                false,
                logger
            )
            throw new Error('Base atom has no free electrons')
            }
    
        if (undefined === baseAtomClone.freeElectrons()[1] || undefined === baseAtomClone.freeElectrons()[1][0]) {
            const MoleculeFactory = require('../factories/MoleculeFactory')
            const m = MoleculeFactory(
            atoms,
            false,
            false,
            logger
            )
            throw new Error('Base atom has one free electrons')
        }
    
            const firstFreeElectron = baseAtomClone.freeElectrons()[0][0];
            const secondFreeElectron = baseAtomClone.freeElectrons()[1][0];
    
    
            // Only proceed if the target atom can accept an electron pair (has as least one free slot)
            if (targetAtom.freeSlots() ===0) {
            throw new Error('Target atom has no free slots')
            }
    
            // Form an electron pair using the first and second free electrons from
            // the base atom.
            const baseAtomFreeElectronPair = [
            firstFreeElectron,
            secondFreeElectron
            ];
    
        // Create the electron pair to add to the target atom.
        // Here the first electron pair contains the target atom symbol, target atom id,
        // and 'db' + a unique id.
        // The second electron pair contains the base atom symbol, base atom id,
        // and 'db' + the unique id above.
        const uniqId = uniqid().substr(uniqid().length - 3, 3);
        const electronPairToAdd = [
        `${targetAtom.atomicSymbol}.${targetAtom.atomId}.${baseAtom.atomId}.db${uniqId}`,
        `${baseAtom.atomicSymbol}.${baseAtom.atomId}.${targetAtom.atomId}.db${uniqId}`
        ];
    
        // Add electron pair to target atom
        // Note that here the target atom must have at least two less electrons in it's valence shell.
        // eg If the atom can have 8 electrons in its valence shell then the atom must have no more
        // than 6 electrons in its valence shell.
        targetAtom.electronPairs.push(electronPairToAdd);
    
        // Remove free electrons used above from base atom and add base atom electron pair.
        _.remove(baseAtom.electronPairs, electronPair => electronPair[0] === baseAtomFreeElectronPair[0] || electronPair[0] === baseAtomFreeElectronPair[1]);
        baseAtom.electronPairs.push(_.cloneDeep(electronPairToAdd).reverse());
    
        /*
        const newAtoms = atoms.map(atom => {
        // Set atom to baseAtom if it is not already in the base atom.
        if (atom.atomId === baseAtom.atomId) {
            atom = baseAtom;
        }
        // Set the atom to the target atom if it is not already in the target atom.
        if (atom.atomId === targetAtom.atomId) {
            atom = targetAtom;
        }
        return atom;
        });
    
        return newAtoms;
    
        */
        return atoms
    };
  
/**
    * @param siblingAtom
    * 
    * @return { boolean } True if atom has a single bond to the sibling atom
    */
    isSingleBondedTo(siblingAtom) {
        const baseAtom = this;
    
        // Checks if base atom and sibling atom are the same.
        if (_.isEqual(baseAtom, siblingAtom)) {
        throw new Error('Base atom and sibling atom are the same');
        }
    
        const matchingPairs = baseAtom.sharedElectronPairs(siblingAtom);
    
        return matchingPairs.length === 1;
    };
  
    /**
    * @param siblingAtom
    * 
    * @return { array } An array of electrons shared by the sibling atom and atom
    */
    sharedElectronPairs(siblingAtom) {
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
    * @return { boolean } True if the atom has a double bond with the sibling atom
    */
    isDoubleBondedTo(siblingAtom) {
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
    * @return { boolean } True if the atom has a triple bond with the sibling atom
    */
    isTripleBondedTo(siblingAtom) {
        const baseAtom = this;
    
        // Checks if base atom and sibling atom are the same.
        if (_.isEqual(baseAtom, siblingAtom)) {
        throw new Error('Base atom and sibling atom are the same');
        }
    
        const matchingPairs = baseAtom.sharedElectronPairs(siblingAtom);
        
        return matchingPairs.length === 3;
    };
  

    /**
    * @param childAtom
    * @param atoms
    * 
    * @return { boolean } True if the atom is bonded to the child atom
    */
    isBondedTo(childAtom, atoms) {
        return (
        this.isSingleBondedTo(childAtom, atoms) ||
        this.isDoubleBondedTo(childAtom) ||
        this.isTripleBondedTo(childAtom) ||
        this.isIonicBondedTo(childAtom) ||
        childAtom.isIonicBondedTo(this)
        );
    };
  
    /**
    * @param childAtom
    * 
    * @return { boolean } True if the electrons of the childAtom are
    */
    isIonicBondedTo(childAtom) {
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

    removeElectron(container, molecule, atom, electron) {
        _.remove(atom.electronPairs, (electron_pair)=>{
            return 1 === electron_pair.length && electron === electron_pair[0]
        })
        return null !== container?container:(null !== molecule? molecule: atom)
    }

    addElectronPair(container, molecule, atom, electron_pair) {
        atom.electronPairs.push(electron_pair)
        return null !== container?container:(null !== molecule? molecule: atom)
    }

    removeElectronPair(container, molecule, atom, electronPair) {
        _.remove(atom.electronPairs, (ep)=>{
            return _.isEqual(ep, electronPair)
        })
        return null !== container?container:(null !== molecule? molecule: atom)        
    }

}

module.exports = AtomManager
