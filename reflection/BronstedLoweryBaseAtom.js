/*
@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877
*/

/*
A Lowery base is a molecule or atom that accepts a proton.
Params in: molecule
*/

const Typecheck = require('../Typecheck');
const Constants = require('../Constants');
const findLewisBaseAtom = require('./LewisBaseAtom');
const Resonance = require('../mechanisms/Resonance')
const _ = require('lodash');
const FindAlkeneCarbonAtoms = require('../actions/FindAlkeneCarbonAtoms');
const AtomFactory = require('../factories/AtomFactory');
const MoleculeFactory = require('../factories/MoleculeFactory');

/**
 * Get from molecule the atom that can donate an electon pair.
 * 
 * @param logger
 * 
 * @return { object } Bronsted lowery base atom or undefined.
 */
const BronstedLoweryBaseAtom = (baseMolecule, acidMolecule) => {

    // Get atoms that can donate a lone pair, ie can be protonated
    if (baseMolecule === "A:" || baseMolecule === "CA:") {
        return false
    }
    let baseAtoms = baseMolecule.atoms.filter((atom) => {
      if (1 === atom.charge(baseMolecule.atoms)) {
        return false;
      }
      // If current atom is chlorine and it has bond then it can't be protonated.
      if ('Cl' === atom.atomicSymbol && 1 === atom.bondCount()) {
        return false;
      }
      // If current atm is oxygen and it has a positive charge then it can't be protonated.
      if ('O' === atom.atomicSymbol && 1 === atom.charge(baseMolecule.atoms)) {
        return false;
      }

      /*
      Under typical conditions, water (H₂O) does not protonate a nitrogen atom directly, as water is a relatively weak acid.
       In Bronsted-Lowry acid-base terminology, water can act as a proton donor (acid) in reactions with stronger bases,
       such as ammonia (NH₃), to form hydronium ions (H₃O⁺).
      */
       if (null !== acidMolecule && 'O' === acidMolecule.canonicalSmiles && 'N' == atom.atomicSymbol && atom.charge(acidMolecule.atoms) > -1) {

         return false
      }

      return atom.atomicSymbol !== 'H' && (atom.atomicSymbol === 'N' || atom.freeElectrons().length > 1);

    });

    // No atoms found that can be protonated so return undefined.
    if (baseAtoms.length === 0) {

      return undefined;
    }

    // See if we have any negatively charged atoms.
    const base_atoms_with_negative_charge = baseAtoms.filter((atom)=>{
      return atom.charge(baseMolecule.atoms)
    })

    if (base_atoms_with_negative_charge.length > 0) {
      baseAtoms = base_atoms_with_negative_charge
    }
    // When comparing atoms that are very different in size, the size of the
    // atom is more important than electronegativity in determining
    // how well it bears its negative charge.
    // When atoms are very different in size, the strongest acid has its hydrogen
    // attached to the largest atom.
    // [F-] < [Cl-] < [Br-] < [I-] (largest atom)
    // HF < HCl < HBr < HI (strongest acid)
    const atomsBySize = baseAtoms.filter((a) => ['Cl', 'Br', 'I'].includes(a.atomicSymbol))
      .sort((a, b) => {
        if ('I' === a.atomicSymbol && 'Br' === b.atomicSymbol) {
          return 1;
        }
        if ('Br' === a.atomicSymbol && 'Cl' === b.atomicSymbol) {
          return 1;
        }
        if ('I' === a.atomicSymbol && 'Cl' === b.atomicSymbol) {
          return 1;
        }
      });

    if (atomsBySize.length > 0) {
      return atomsBySize.pop();
    }

    // When atoms are similar in size, the strongest acid has its hydrogen
    // attached to the most electronegative atom (electronegativity is how well
    // it holds onto its charge, with a more electronegative atom able to
    // hold its charge better.)
    // C < N < O < F (strongest acid)
    const atomsByElectronegativity = baseAtoms.filter((a) => ['F', 'O', 'N'].includes(a.atomicSymbol))
      .sort((a, b) => {
        if ('F' === a.atomicSymbol && 'O' === b.atomicSymbol) {
          return 1;
        }
        if ('O' === a.atomicSymbol && 'N' === b.atomicSymbol) {
          return 1;
        }
        if ('F' === a.atomicSymbol && 'N' === b.atomicSymbol) {
          return 1;
        }
      });

    if (atomsByElectronegativity.length > 0) {
      return atomsByElectronegativity[0];
    }

    const atomsByPositiveCharge = baseAtoms.filter((a)=>{
      return a.charge(baseMolecule.atoms) > 0
    })

    if (atomsByPositiveCharge.length > 1) {
      // Create new array indexed by number of resonance structures
      // Order by number of resonance structures
      const resonance_structures_map = {}
      baseAtoms.map((a)=>{
        const a_copy = _.cloneDeep(a)
        const proton = AtomFactory('H', -1)
        a_copy.bond(proton)
        const m_copy = MoleculeFactory(
          baseMolecule.atoms,
          false,
          false,
        )
        const resonance_structures = Resonance(container, m_copy, a_copy)
        // @todo What if we have atoms with the same number of resonance structures?
        resonance_structures_map[resonance_structures.length] = a_copy
      })
   
      // Order by number of resonance structures and return the first atom
      // Convert the indexed object into an array of key-value pairs 
      const keyValueArray = Object.entries(resonance_structures_map);

      // Sort the array by the keys (indices) in descending order 
      keyValueArray.sort((a, b) => b[0] - a[0]);

      return keyValueArray[0]

    }

    // Find the functional group that is the "weakest acid" and get from that the index of bronsted lowery base atom.
    // The protonated group that is the weakest acid will have the atom that
    // is most likely to be protonated.
    const functionalGroups = baseMolecule.functionalGroups();
    let bronstedLoweryBaseAtomIndex = undefined;

    // strongest acid -> weakest acid
    // protonated alcohol -> protonated carboxylic acid -> protonated water -> carboxylic acid -> protonated amine -> alcohol -> water -> amine
    if (functionalGroups.imine.length !== 0) {
      throw new Error('got here');
      const atoms = functionalGroups.imine;
      const nitrogenAtomIndex = _.findIndex(atoms, (atom) => 'N' === atom.atomicSymbol);
      bronstedLoweryBaseAtomIndex = atoms.getAtomById(nitrogenAtomIndex);
    } else if (functionalGroups.amine.length !== 0) {
      const atoms = functionalGroups.amine;
      const nitrogenAtomIndex = _.findIndex(atoms, (atom) => 'N' === atom.atomicSymbol);
      // bronstedLoweryBaseAtomIndex = atoms.getAtomById(nitrogenAtomIndex);
      bronstedLoweryBaseAtomIndex = atoms[nitrogenAtomIndex].atomId;
    } else if ('O' ===FormatAs(molecule).SMILES()) {
      // Water is the weakest acid and so will be the strongest base
      const oxygenAtomIndex = _.findIndex(atoms, (atom) => 'O' === atom.atomicSymbol);
      bronstedLoweryBaseAtomIndex = atoms.getAtomById(oxygenAtomIndex);
    } else if (functionalGroups.alcohol.length !== 0) {
      const atoms = functionalGroups.alcohol;
      const oxygenAtomIndex = _.findIndex(atoms, (atom) => 'O' === atom.atomicSymbol);
      bronstedLoweryBaseAtomIndex = atoms.getAtomById(oxygenAtomIndex);
    } else if (functionalGroups.carboxylicAcid.length !== 0) {
      const atoms = functionalGroups.carboxylicAcid;
      const oxygenAtomIndex = _.findIndex(atoms, (atom) => 'O' === atom.atomicSymbol && 1 === atom.doubleBonds(molecule));
      bronstedLoweryBaseAtomIndex = atoms.getAtomById(oxygenAtomIndex);
    } else {
      const alkeneCarbonAtoms = FindAlkeneCarbonAtoms(molecule);
      if (false !== alkeneCarbonAtoms) {
        bronstedLoweryBaseAtomIndex = _.findIndex(baseMolecule.atoms, (a) => a.atomId === alkeneCarbonAtoms.least_saturated_carbon.atomId);
      }
    }


    return baseMolecule.atoms[bronstedLoweryBaseAtomIndex];

};

module.exports = BronstedLoweryBaseAtom;
