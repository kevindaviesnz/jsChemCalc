const _ = require('lodash');
const MoleculeFactory = require('../factories/MoleculeFactory');

// container can be null.
// If container is not null then it must be passed by value and molecule must be passed in by reference.
class MoleculeManager {


  bondAtomToAtom(target_atom, allow_hydrogen_as_target_atom, atoms, logger) {
    const base_atom = this
  
    if (this.electronegativity - base_atom.electronegativity > 1.9) {
        // 'base atom' is less electronegative
        base_atom.makeIonicBond(this)
        return
    }
  
    if (base_atom.electronegativity - this.electronegativity > 1.9) {
        // 'this' is less electronegative
        this.makeIonicBond(base_atom)
        return
    }
  
    const new_atoms =  this.makeDativeBond(target_atom, allow_hydrogen_as_target_atom, atoms, logger)
  
    return new_atoms
  }

  /**
  * @param target_atom
  * @param molecule
  * @param logger
  * 
  * @return { boolean } True if break bond
  */
  // Move to molecule
  breakBond(target_atom, molecule, logger) {
    const source_atom = this;
      const atoms = molecule[0].atoms;

      const shared_source_atom_electron_pair = source_atom.sharedElectronPairs(target_atom)[0];

    if (undefined === shared_source_atom_electron_pair) {
      // breakBond Breaks a bond on a shared source atom electron pair.
      if (env.debug) {
        logger.log(env.debug_log, '[breakBond] No shared source atom electron pair');
      }
      throw new Error('Failed to break bond')
      return false;
    }

    const shared_target_atom_electron_pair = [...shared_source_atom_electron_pair].reverse();

    _.remove(source_atom.electronPairs, (ep) => _.isEqual(ep, shared_source_atom_electron_pair));
    _.remove(target_atom.electronPairs, (ep) => _.isEqual(ep, shared_target_atom_electron_pair));

    // Re-add electron to target atom
    target_atom.electronPairs.push([shared_target_atom_electron_pair[0]]);

    // Ionic bond or CC / C=C
    // If it's an ionic bond, we add the full electron pair to the target atom.
    // Otherwise, it's a covalent bond, so we re-add the electron that the source atom was sharing
    // to the source atom.
    // If the target atom is electronary or not.
    if (source_atom.electronegativity - target_atom.electronegativity > 1.9 || ('C' === source_atom.atomicSymbol || 'H' === source_atom.atomicSymbol)) {
      target_atom.electronPairs.push([shared_target_atom_electron_pair[1]]);
    } else {
      source_atom.electronPairs.push([shared_source_atom_electron_pair[0]]);
    // source_atom.electronPairs.push([shared_source_atom_electron_pair[1]]);
    }

    return atoms;
  };


  // Breaks a covalent atom by removing the shared electron pair from the source atom and splitting the shared electron
  // pair on the target atom into two separate electrons.
  makeCarbocation(target_atom, molecule, logger) {
      
    if ('C' !== this.atomicSymbol || this.charge(molecule[0].atoms, logger) !== 0) {
      throw new Error('[AtomFactory] Atom should be a carbon with a neutral charge.')
    }
    
    const carbon_atom = this
    
    // Get the shared electron pairs.
    const shared_carbon_atom_electron_pair = carbon_atom.sharedElectronPairs(target_atom)[0];
    const shared_target_atom_electron_pair = [...shared_carbon_atom_electron_pair].reverse();

    // Remove electron pair from carbon atom
    _.remove(carbon_atom.electronPairs, (ep) => _.isEqual(ep, shared_carbon_atom_electron_pair));

    // Add shared electron pairs to target atom as single electrons
    target_atom.electronPairs.push([shared_target_atom_electron_pair[0]])
    // @todo Why does the oxygen atom where C[O+] have 9 electrons?
    target_atom.electronPairs.push([shared_target_atom_electron_pair[1]])

    // Remove electron pair from target atom
    _.remove(target_atom.electronPairs, (ep) => _.isEqual(ep, shared_target_atom_electron_pair));

    return molecule[0].atoms


  }


  /**
  * @param atoms
  * 
  * @return { Array } Array of atoms
  */
  // Move to molecule
  carbons(atoms) {
    // Returns an array of atoms that are carbon atoms.
      return this.bonds(atoms)
        .filter(bond => bond.atom.atomicSymbol === 'C')
        .map(bond => bond.atom);
  };

  /**
  * @param logger
  * @param atomMolecule
  * @param targetMolecule
  * @param targetAtom
  * 
  * @return { boolean } True if the atom is more acidic thant the target atom
  */
  isMoreAcidicThan(logger, atomMolecule, targetMolecule, targetAtom) {
    // If the targetAtom is C or C
    if (targetAtom.atomicSymbol === 'C') {
      return true;
    }

    if (
      targetAtom.atomicSymbol === this.atomicSymbol &&
      targetAtom.charge(targetMolecule.atoms, logger) === this.charge(atomMolecule.atoms, logger)
    ) {
      return targetMolecule.pKa > atomMolecule.pKa;
    } else if (
      atomMolecule.atoms.length < targetMolecule.atoms.length ||
      this.charge(atomMolecule.atoms, logger) === 1 ||
      this.electronegativity > targetAtom.electronegativity
    ) {
      return true;
    } else {
      return false;
    }
  };

  removeBondFromCarbon(molecule) {
      Typecheck(
        {name: "molecule", value: molecule[0], type: "object"},
        {name: "logger", value: logger, type: "object"}
    )

    try {
        if (this.atomicSymbol !== 'C') {
            throw new Error('Atom should be a carbon atom.')
        }
    } catch(e) {
        console.log(e)
        process.exit(800, 'Atom should be a carbon atom')
    }

    const atoms = molecule[0].atoms
    const atom = this

    // Get bonds and sort by type, then O -> N -> C

    const bonds = _.sortBy(atom.bonds(atoms), ((bond)=>{
        return bond.bond_type
    })).reverse().sort((b1,b2)=>{

      if (b1.atom.atomicSymbol === 'O' && b2.atom.atomicSymbol === 'C') {
        return -1 // Oxygen gets priority over carbon
      }

      if (b1.atom.atomicSymbol === 'O' && b2.atom.atomicSymbol === 'N') {
        return -1 // Oxygen gets priority over nitrogen
      }

      if (b1.atom.atomicSymbol === 'N' && b2.atom.atomicSymbol === 'C') {
        return -1 // Nitrogen gets priority over carbon
      }

      return 0

    })

    // 'this' is the atom that will keep the electrons.
    // Break bond by "collapsing" electron pair onto "atom"
    // After breaking the bond the "this" should have an additional charge and
    //  "atom" should have one less charge.
    molecule[0].atoms = bonds[0].atom.breakBond(atom, molecule, logger)
    _.remove(atom.electronPairs, (ep)=>{
        return ep.length === 1
    })

  }



/**
* @param atoms
*
* @return { array } Array of carbon bonds
*/
carbonBonds (molecule, baseAtom) {
  const bonds = baseAtom.bonds(atoms, true);
  return bonds.filter((bond) => bond.atom.atomicSymbol === 'C');
};



/**
* @param atoms
*
* @return { Array } bonds for this atom as an array of
*/
doubleBonds (molecule, atom) {
  const bonds = atom.bonds(atoms);
  return bonds.filter(bond => bond.bondType === '=');
};



/**
* @param atoms
*
* @return { Array } bonds for this atom as an array of
*/
doubleBonds (atoms) {
  const atom = this;
  const bonds = atom.bonds(atoms);
  return bonds.filter(bond => bond.bondType === '=');
};

bondAtomToAtom (molecule, base_atom, target_atom, allow_hydrogen_as_target_atom, logger) {

  if (this.electronegativity - base_atom.electronegativity > 1.9) {
      // 'base atom' is less electronegative
      base_atom.makeIonicBond(this)
      return
  }

  if (base_atom.electronegativity - this.electronegativity > 1.9) {
      // 'this' is less electronegative
      this.makeIonicBond(base_atom)
      return
  }

  const new_atoms =  this.makeDativeBond(target_atom, allow_hydrogen_as_target_atom, atoms, logger)

  return new_atoms
}

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
makeCovalentBond (molecule, baseAtom, targetAtom, allowHydrogenAsTargetAtom, logger) {

  // Get free electrons from the base atom and target atom.
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
makeDativeBond (molecule, baseAtom, targetAtom, allowHydrogenAsTargetAtom, logger) {

  // Get free electrons from the base atom (the atom that will donate two electrons)
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
* @param atoms - includeHydrogens Whether to include hydrogen in the result.
* @param includeHydrogens
*
* @return { Array } An array of BondedAtom objects
*/
bonds (molecule, parentAtom, includeHydrogens) {

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
/**
* @param childAtom
* @param atoms
*
* @return { boolean } True if the atom is bonded to the child atom
*/
isBondedTo (molecule, atom, childAtom) {
  return (
    this.isSingleBondedTo(childAtom, atoms) ||
    this.isDoubleBondedTo(childAtom) ||
    this.isTripleBondedTo(childAtom) ||
    this.isIonicBondedTo(childAtom) ||
    childAtom.isIonicBondedTo(this)
  );
};


    /**
    * @param atoms
    * @param logger
    *
    * @return { Number } Atom charge < 0 if negative, 0 if neutral, > 0 if positive
    */
    charge(molecule, atom, logger) {
      // Returns 1 if this bond is alide or 0 if it is alide.
      if (atom.isHalide()) {
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
    isTerminalAtom (molecule, atom) {
      return atom.bondCountNoHydrogens(atoms) === 1 || atom.bonds(atoms).length === 0;
    }

    /**
    * @return { Number } Number of bonds that are not hydrogen bonds
    */
    bondCountNoHydrogens(molecule, atom) {
      return atom.bonds(atoms)
        .filter((bond) => bond.atom.atomicSymbol !== 'H')
        .length;
    }

    /**
    * @param atoms
    *
    * @return { Atom [] } Array of hydrogen atoms
    */
    hydrogens(containr, molecule, baseAtom, atoms) {
      
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
    *
    * @return { Array } Array of triple bonds bonded to atom
    */
    tripleBonds(container, molecule, baseAtom) {
      return baseAtom.bonds(molecule.atoms).filter((bond) => bond.bond_type === '#');
    };

    /**
    * @param target_atom
    * @param molecule
    * @param logger
    *
    * @return { boolean } True if break bond
    */
    breakBond (container, molecule, source_atom, target_atom, logger) {

      const atoms = molecule[0].atoms;

      const shared_source_atom_electron_pair = source_atom.sharedElectronPairs(target_atom)[0];

      if (undefined === shared_source_atom_electron_pair) {
        // breakBond Breaks a bond on a shared source atom electron pair.
        if (env.debug) {
          logger.log(env.debug_log, '[breakBond] No shared source atom electron pair');
        }
        throw new Error('Failed to break bond')
        return false;
      }

      const shared_target_atom_electron_pair = [...shared_source_atom_electron_pair].reverse();

      _.remove(source_atom.electronPairs, (ep) => _.isEqual(ep, shared_source_atom_electron_pair));
      _.remove(target_atom.electronPairs, (ep) => _.isEqual(ep, shared_target_atom_electron_pair));

      // Re-add electron to target atom
      target_atom.electronPairs.push([shared_target_atom_electron_pair[0]]);

      // Ionic bond or CC / C=C
      // If it's an ionic bond, we add the full electron pair to the target atom.
      // Otherwise, it's a covalent bond, so we re-add the electron that the source atom was sharing
      // to the source atom.
      // If the target atom is electronary or not.
      if (source_atom.electronegativity - target_atom.electronegativity > 1.9 || ('C' === source_atom.atomicSymbol || 'H' === source_atom.atomicSymbol)) {
        target_atom.electronPairs.push([shared_target_atom_electron_pair[1]]);
      } else {
        source_atom.electronPairs.push([shared_source_atom_electron_pair[0]]);
       // source_atom.electronPairs.push([shared_source_atom_electron_pair[1]]);
      }

      return atoms;
    };

    // Breaks a covalent atom by removing the shared electron pair from the source atom and splitting the shared electron
    // pair on the target atom into two separate electrons.
    makeCarbocation(container, molecule, target_atom, carbon_atom, logger) {

        if ('C' !== carbon_atom.atomicSymbol || carbon_atom.charge(molecule[0].atoms, logger) !== 0) {
          throw new Error('[MoleculeManager] Atom should be a carbon with a neutral charge.')
        }

        // Get the shared electron pairs.
        const shared_carbon_atom_electron_pair = carbon_atom.sharedElectronPairs(target_atom)[0];
        const shared_target_atom_electron_pair = [...shared_carbon_atom_electron_pair].reverse();

        // Remove electron pair from carbon atom
        _.remove(carbon_atom.electronPairs, (ep) => _.isEqual(ep, shared_carbon_atom_electron_pair));

        // Add shared electron pairs to target atom as single electrons
        target_atom.electronPairs.push([shared_target_atom_electron_pair[0]])
         // @todo Why does the oxygen atom where C[O+] have 9 electrons?
        target_atom.electronPairs.push([shared_target_atom_electron_pair[1]])

        // Remove electron pair from target atom
        _.remove(target_atom.electronPairs, (ep) => _.isEqual(ep, shared_target_atom_electron_pair));

        return molecule[0].atoms

    }

    /**
    * @param atoms
    *
    * @return { Array } An array of atoms that belong to this atom
    */
    ionicBonds (container, molecule, atom) {
      const ionic_bonds = [];
      const ionic_electrons = atom.electrons().filter((electron) => electron.split('.')[0] === 'ionic');

      // Add bond to ionic bonds.
      if (ionic_electrons.length > 0) {
        const atom_id = ionic_electrons[0].split('.')[2];
        const child_atom = _.find(molecule.atoms, (_atom) => _atom.atomId === atom_id);

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

      const ionic_bonds_to_parent = atom.bonds(molecule.atoms).filter((bond) => bond.bond_type === 'ionic');

      return [...ionic_bonds, ...ionic_bonds_to_parent];
    };

    /**
    * @param atoms
    * @param logger
    *
    * @return True if charge is detected false otherwise. Note that this atom must be a C atom
    */
    isCarbocation (container, molecule, atom, logger) {
      // @todo bondCountAsSingleBonds() does not count hydrogens
      const bond_count = atom.bondCountAsSingleBonds(molecule.atoms, true, logger) + atom.hydrogens(atoms).length
      const charge = atom.charge(molecule.atoms, logger)
      return atom.atomicSymbol === 'C' && bond_count === 3 && charge === 1
    }

    bondCountAsSingleBonds(container, molecule, atom, no_hydrogens, logger) {

      const tripleBondCount = atom.tripleBonds(atoms, no_hydrogens).length * 3;
      const doubleBondCount = atom.doubleBonds(atoms, no_hydrogens).length * 2;
      const singleBondCount = atom.singleBonds(atoms, no_hydrogens).length;

      const bond_count = tripleBondCount + doubleBondCount + singleBondCount;

      return bond_count;

    };

    singleBonds (container, molecule, atom) {
      return atom.bonds(molecule.atoms).filter((bond) => {
        return bond.bondType === '' // todo why isn't this bond.bond_type?
      });
    }

    atomShift(container, molecule, atom_to_be_moved, source_atom, carbocation, allow_hydrogens, logger) {

      atom_to_be_moved.atomicSymbol.should.be.a.String()
      source_atom.atomicSymbol.should.be.equal('C')
      carbocation.atomicSymbol.should.be.a.String()

      atom_to_be_moved.atomicSymbol.should.be.a.String()

      // Check atom to be shifted is bonded to the source atom
      atom_to_be_moved.isSingleBondedTo(source_atom).should.be.True()
      // Check source atom is bonded to the carbocation
      source_atom.isSingleBondedTo(carbocation).should.be.True()

      // Shift 'this' from source atom to target atom
      // If are we moving an hydrogen check it has an electron pair
      if (atom_to_be_moved.atomicSymbol === 'H') {
        atom_to_be_moved[Constants().electron_index].length.should.be.equal(1)
        atom_to_be_moved[Constants().electron_index][0].length.should.be.equal(2)
      }

      // Remove shared pair from source atom to turn it into a carbocation
      const source_atom_shared_electron_pairs = source_atom.sharedElectronPairs(atom_to_be_moved)
      source_atom.electronPairs = _.remove(source_atom.electronPairs , (p)=>{
        return !_.isEqual(p, source_atom_shared_electron_pairs[0])
      })
      // Turn the atom to be moved matching electron pair into single electrons
      atom_to_be_moved.electronPairs = _.remove( atom_to_be_moved.electronPairs, (p)=>{
        return !_.isEqual(p, source_atom_shared_electron_pairs[0].reverse())
      })
      atom_to_be_moved.electronPairs.push([source_atom_shared_electron_pairs[0][0]])
      atom_to_be_moved.electronPairs.push([source_atom_shared_electron_pairs[0][1]])

      atom_to_be_moved.isSingleBondedTo(source_atom).should.be.False()
      source_atom.isSingleBondedTo(atom_to_be_moved).should.be.False()

      atom_to_be_moved.sharedElectronPairs(source_atom).length.should.be.equal(0)
      source_atom.sharedElectronPairs(atom_to_be_moved).length.should.be.equal(0)

      if (atom_to_be_moved.atomicSymbol === 'H') {
        atom_to_be_moved[Constants().electron_index].length.should.be.equal(2)
      }

      molecule.atoms = atom_to_be_moved.bondAtomToAtom(carbocation, allow_hydrogens, atoms, logger)
      const MoleculeFactory = require('../factories/MoleculeFactory')
      const new_molecule = MoleculeFactory(
          molecule.atoms,
          molecule.conjugateBase,
          molecule.conjugateAcid,
          logger
      )
      return new_molecule

    }





    // ------------------------------------------
    fetchAtomThatCanAcceptAnElectronPair(atoms) {
        const atom_that_can_accept_an_electron_pair = _.find(atoms, (atom) => atom.freeSlots() > 0)
        return atom_that_can_accept_an_electron_pair
    }

    fetchAtomsBondedToASpecificAtom(molecule, atom, logger) {
        const atoms = atom.bonds(molecule.atoms, logger).map(bond => bond.atom)
        return atoms
    }

    fetchAtomsWithFreeElectronPairs(atoms) {
        const atoms_with_free_electron_pairs = atoms.filter(atom => atom.freeElectronPairs.length > 0)
        return atoms_with_free_electron_pairs
    }

    fetchAtomsByElectrophilicity(atoms) {
      return atoms.sort((atomA, atomB) => {
        // Check for positively charged atoms (cations).
        if (atomA.charge > 0) {
          if (atomB.charge > 0) {
            return 0; // Both are positively charged, keep the order.
          } else {
            return -1; // AtomA is positively charged, prioritize it.
          }
        } else if (atomB.charge > 0) {
          return 1; // AtomB is positively charged, prioritize it.
        }

        // Check for negatively charged atoms (anions).
        if (atomA.charge < 0) {
          if (atomB.charge < 0) {
            return 0; // Both are negatively charged, keep the order.
          } else {
            return -1; // AtomA is negatively charged, prioritize it.
          }
        } else if (atomB.charge < 0) {
          return 1; // AtomB is negatively charged, prioritize it.
        }

        // Both atoms are neutral or have no charge.
        if (atomA.isCarbocation && !atomB.isCarbocation) {
          return -1; // AtomA is a carbocation, prioritize it.
        } else if (!atomA.isCarbocation && atomB.isCarbocation) {
          return 1; // AtomB is a carbocation, prioritize it.
        }

        // Lastly, if neither atom is a carbocation or charged, keep the order.
        return 0;
      });
    }

    addFreeElectronPairFromAtomToBondedTargetAtom(molecule, target_atom) {

      const source_atom_bond = _.find(target_atom.bonds(molecule.atoms, false), (bond) => {
        return  bond.atom.nonBondedElectrons().length > 0
      })
      if (undefined === source_atom_bond) {
        return false
      }

      const source_atom = source_atom_bond.atom
      const source_free_electrons = source_atom.nonBondedElectrons()

      if (source_free_electrons.length < 2) {
        return false
      }
      
      if (target_atom.freeSlots() < 1) {
        return false
      }

      target_atom.electronPairs.push([source_free_electrons[1], source_free_electrons[0]])
      
      // Now remove the free electrons from the source atom and re-add them as electron pair
      source_atom.removeElectron(source_free_electrons[0])
      source_atom.removeElectron(source_free_electrons[1])
      source_atom.electronPairs.push([source_free_electrons[0], source_free_electrons[1]])

    }

    addDativeBondBetweenBondedAtoms(container, molecule, logger) {

        const target_atom = this.fetchAtomThatCanAcceptAnElectronPair(this.fetchAtomsByElectrophilicity(molecule.atoms))
       
        if (undefined === target_atom) {
          return false
        }
        
        if(false === this.addFreeElectronPairFromAtomToBondedTargetAtom(molecule, target_atom)) {
          return false
        }

        molecule = MoleculeFactory(
          molecule.atoms,
          false,
          false,
          logger
        )
        return null !== container? container: molecule
    }

}

module.exports = MoleculeManager