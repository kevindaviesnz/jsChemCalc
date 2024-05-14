
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory');
const { C } = require("../factories/PeriodicTable");
const ShiftAkylGroup = require("./ShiftAkylGroup");
const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')
const MoleculeManager = require('../managers/MoleculeManager')

const FormatAs = require('../factories/FormatAs')

/**
 * Attempt to stablise molecule.
 * 
 * @param molecule 
 * @param logger 
 * 
 * @return {object} molecule or boolean
 */
const Stabilise = (molecule, attempts) => {
    

      if (attempts > 100) {
          return molecule
      }

      const molecule_cloned = _.cloneDeep(molecule)

      const moleculeManager = new MoleculeManager()
      const molecule_with_dative_bond_between_two_bonded_atoms = moleculeManager.addDativeBondBetweenBondedAtoms(null, molecule)
      if (false !==  molecule_with_dative_bond_between_two_bonded_atoms) {
        return Stabilise(molecule_with_dative_bond_between_two_bonded_atoms, attempts+1)
      }

      

      // Ozonolysis   @see  https://byjus.com/chemistry/ozonolysis-of-alkenes-alkynes-mechanism/ 
      // Oxygen atom forms double bond with carbon, breaking the CC bond and creating a carbocation.
      // Carbocations
      const carbocations = molecule.atoms.filter((atom)=> {
        return atom.atomicSymbol !== 'H'
      }).filter((atom)=>{
        return atom.isCarbocation(molecule.atoms)
      })

      if (carbocations.length > 0) {
        // We should always have only one carbocation
        const carbocation = carbocations[0]

        // Look for an oxygen atom bonded to the carbocation and if an oxygen atom is found
        // make a dative bond between the carbocation and the oxygen atom where the
        // oxygen atom donates the two electrons. This should result in a double bond between the
        // carbon and the oxygen atom.
        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
        const oxygen_bonds = carbocation.singleBonds(molecule.atoms).filter((bond)=>{
          return bond.atom.atomicSymbol === 'O'
        })
        if (oxygen_bonds.length === 1) {
          const oxygen_atom = oxygen_bonds[0].atom
          molecule.atoms = oxygen_atom.makeDativeBond(carbocation, false, molecule.atoms)
          molecule = MoleculeFactory(
              molecule.atoms,
              molecule.conjugateBase,
              molecule.conjugateAcid
          )
          return Stabilise(molecule, attempts+1)
        }

        // Look for a non-positively charged nitrogen atom bonded to the carbocation and if a nitrogen atom is found
        // make a dative bond between the carbocation and the nitrogen where the
        // nitrogen atom donates the two electrons. This should result in a double bond between
        // the carbon and the nitrogen atom.
        // @see step 4 of https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
        const nitrogen_bonds = carbocation.singleBonds(molecule.atoms).filter((bond)=>{
          return bond.atom.atomicSymbol === 'N' && bond.atom.charge(molecule.atoms) < 1
        })
        if (nitrogen_bonds.length === 1) {
          const nitrogen_atom = nitrogen_bonds[0].atom
          molecule.atoms = nitrogen_atom.makeDativeBond(carbocation, false, molecule.atoms)
          molecule = MoleculeFactory(
              molecule.atoms,
              molecule.conjugateBase,
              molecule.conjugateAcid
          )
          return Stabilise(molecule, attempts+1)
        }

        // @see E1
        // Look for a negatively charged carbon bonded to the carbocation
        const carbon_bonds = carbocation.singleBonds(molecule.atoms).filter((bond)=>{
          return bond.atom.atomicSymbol === 'C' && bond.atom.charge(molecule.atoms)
        })
        if (carbon_bonds.length > 0) {
          molecule.atoms = carbon_bonds[0].atom.makeDativeBond(carbocation, false, molecule.atoms)
          molecule = MoleculeFactory(
              molecule.atoms,
              molecule.conjugateBase,
              molecule.conjugateAcid
          )
          return Stabilise(molecule, attempts+1)
        }

        // AkylShift
        // Look for terminal carbon bonds
        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
        const alkylShift = ShiftAkylGroup(molecule); // returns a molecule
        if (false !== alkylShift) {
          molecule = alkylShift;
          return Stabilise(molecule, attempts+1)
        }

      }
  
      // Try looking for a carbon atom bonded to a non-terminal non-carbon
      const carbonAtomBondedToNonTerminalNonCarbon = _.find(molecule.atoms, (atom) => {
        if ('C' === atom.atomicSymbol && atom.hydrogens.length < 3 && atom.isCarbocation(molecule.atoms)) { // carbon atom needs at least two non-hydrogens so that we have a CX bond to break.
          return _.find(atom.singleBonds(molecule.atoms), (bond) => {
            return 'C' !== bond.atom.atomicSymbol && bond.atom.freeElectrons().length > 0 && false === bond.atom.isTerminalAtom(molecule.atoms);
          }) !== undefined;
        }
        return false;
      });
  
      if (undefined !== carbonAtomBondedToNonTerminalNonCarbon) {
        const nonTerminalNonCarbonBondedToCarbon = _.find(carbonAtomBondedToNonTerminalNonCarbon.singleBonds(molecule.atoms), (bond) => {
          return 'C' !== bond.atom.atomicSymbol && false === bond.atom.isTerminalAtom(molecule.atoms);
        }).atom;
        // Check that the CX bond is broken.
        nonTerminalNonCarbonBondedToCarbon.makeDativeBond(carbonAtomBondedToNonTerminalNonCarbon, false, molecule.atoms); // non-carbon shares both electrons makeIonicBond?
      } else {
        // Pinacol rearrangement carbocation shift
        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
        // Oxygen atom forms double bond with a carbocation.
        // Try looking for a carbon atom bonded to a terminal non-carbon
        const carbonAtomBondedToTerminalNonCarbon = _.find(molecule.atoms, (atom) => {
          if (atom.isCarbocation(molecule.atoms) && atom.hydrogens.length < 3) { // carbon atom needs at least two non-hydrogens so that we have a CX bond to break.
            return _.find(atom.singleBonds(molecule.atoms), (bond) => {
              return 'C' !== bond.atom.atomicSymbol && false !== bond.atom.isTerminalAtom(molecule.atoms);
            }) !== undefined;
          }
          return false
        });
  
        if (undefined !== carbonAtomBondedToTerminalNonCarbon) {
          const terminalNonCarbonBondedToCarbon = _.find(carbonAtomBondedToTerminalNonCarbon.singleBonds(molecule.atoms), (bond) => {
            return 'C' !== bond.atom.atomicSymbol && false !== bond.atom.isTerminalAtom(molecule.atoms);
          }).atom;
          // Check that the CX bond is broken.
          terminalNonCarbonBondedToCarbon.makeDativeBond(carbonAtomBondedToTerminalNonCarbon, false, molecule.atoms); // non-carbon shares both electrons makeIonicBond?
          return molecule;
        } else {

          // Ozonolysis   @see  https://byjus.com/chemistry/ozonolysis-of-alkenes-alkynes-mechanism/
          // [O+]O bond breaks, moving the electron pair to the oxygen atom that has a neutral charge
          const oxygenAtom = _.find(molecule.atoms, (atom) => {
            if ('O' === atom.atomicSymbol && atom.charge > 0) {
              return _.find(atom.bonds(), (bond) => {
                return bond.atom === 'O';
              }) !== undefined;
            }
            return false
          });
          if (undefined !== oxygenAtom) {
            const otherOxygenAtom = _.find(atom.bonds(), (bond) => {
              return bond.atom === 'O';
            }).atom;
            // This should result in the otherOxygenAtom having a negative charge.
            oxygenAtom.breakBond(otherOxygenAtom); // What happens if this creates two molecules?
          } 
        }
      }
  
      return molecule;
  

  };
  
  module.exports = Stabilise;
  