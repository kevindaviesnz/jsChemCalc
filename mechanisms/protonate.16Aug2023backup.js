const MoleculeFactory = require('../factories/MoleculeFactory');
const AtomFactory = require('../factories/AtomFactory');
const FindBronstedLoweryAcidAtom = require('../reflection/FindBronstedLoweryAcidAtom.old.');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
//const FindLewisBaseAtom = require('../reflection/LewisBaseAtom');
const Constants = require('../Constants');
const Typecheck = require('../Typecheck');
const _ = require('lodash');
const FindCarbocation = require('../actions/FindCarbocation');
const FindStrongestBronstedLoweryAcidMolecule = require('../reflection/FindStrongestBronstedLoweryAcidMolecule');
const ContainerView = require('../view/Container');
const AtomsFactory = require('../factories/AtomsFactory');
const LeavingGroupRemoval = require('./LeavingGroupRemoval');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const uniqid = require('uniqid');
const { C, N, S } = require('../factories/PeriodicTable');
const FormatAs = require('../factories/FormatAs');

/**
 * Protonate the substrate in the container.
 * 
 * @param logger 
 * 
 * @return {null} 
*/
// @todo this needs substantial revision using Protonate.js as a template.
const Protonate = (container, logger) => {
  try {

    const substrate = container.getSubstrate()[0] // [0] is the molecule, [1] is the number of units
    const starting_substrate = _.cloneDeep(container.getSubstrate())
    // If the substrate is a weak base then we cannot protonate it.
    if (
      substrate.conjugateBase ||
      true === substrate.conjugateAcid ||
      true === substrate.isWeakBase ||
      true === substrate.isStrongAcid
    ) {
      logger.log('debug', '[Protonate] Substrate is a conjugate base/acid, so not proceeding with protonation.'.bgRed);
      return false;
    }

    // Checks if there is a bronsted lowery base atom in the substrate and return the atom.
    const atom_to_be_protonated = BronstedLoweryBaseAtom(container.getSubstrate()[0], logger);

    // We couldn't find an atom that can be protonated.
    if (undefined === atom_to_be_protonated) {
      return false;
    }

    // Find in the container the most acidic reagent.
    let reagent = FindStrongestBronstedLoweryAcidMolecule(container.reagents, logger);

    if (null === reagent) {
      // Note for [O-][S](=O)(=O)O + water this is actually correct. The oxygen atom does not get protonated.
      logger.log('debug', '[Protonate] Could not find a suitable acid reagent'.bgYellow);
      return false;
    }

    // Save the starting reagent (strongest acid molecule)
    const starting_reagent = _.cloneDeep(reagent);
    const starting_reagent_is_strong_acid = starting_reagent[0].isStrongAcid;
    let proton = false;

    if (typeof reagent[0] !== 'string' && (FormatAs(reagent[0]).SMILES(logger) === '[H+]' || FormatAs(reagent[0]).SMILES(logger) === '[O+]')) {
      // ?????
      proton = reagent[0].atoms.find((atom) => atom.atomicSymbol === 'H');
      reagent = [
          MoleculeFactory(AtomsFactory('O', logger), false, false, logger),
          reagent[1]
      ]
    } else if (typeof reagent[0] !== 'string') {
      // Find the reagent atom that will get the proton from and remove a proton.
      // An oxygen atom will not deprotonate a water molecule
      // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
      if (atom_to_be_protonated.atomicSymbol === 'O' && reagent[0].canonicalSmiles === 'O') {
        return false
      }
      const reagent_atom_to_be_deprotonated = BronstedLoweryAcidAtom(reagent[0], logger);
      if (undefined === reagent_atom_to_be_deprotonated || atom_to_be_protonated.isMoreAcidicThan(logger, container.getSubstrate()[0], reagent[0], reagent_atom_to_be_deprotonated)) {
        return false;
      }
      const reagent_proton = reagent_atom_to_be_deprotonated.hydrogens(reagent[0].atoms)[0];
      const reagent_atom_to_be_deprotonated_target_atom = reagent_proton.bonds(reagent[0].atoms, true)[0].atom;
      reagent[0].atoms = reagent_proton.breakBond(reagent_atom_to_be_deprotonated_target_atom, reagent, logger);
      _.remove(reagent[0].atoms, (a) => a.atomId === reagent_proton.atomId);
      if (false === reagent) {
        return false;
      }
      proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
    } else if (typeof reagent[0] === 'string' && ('A:' === reagent[0] || 'CB:' === reagent[0])) {
      proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
    }

    if (proton === false) {
      return false;
    }

    // Bond proton from above to the substrate atom that we are protonating.
    proton[Constants().electron_index] = [];
    container.getSubstrate()[0].atoms = atom_to_be_protonated.bondAtomToAtom(proton, true, container.getSubstrate()[0].atoms, logger);
    if (_.findIndex(container.getSubstrate()[0].atoms, (atom) => atom.atomId === proton.atomId) === -1) {
      container.getSubstrate()[0].atoms.push(proton);
    }

    // Replace the reagent in the container with it's conjugate base.
    let conjugate_base = null;

    if (reagent[0] === 'A:') {
      conjugate_base = ['CB:', reagent[1]];
    } else if (reagent[0] === 'A+:') {
      conjugate_base = ['CB-:', reagent[1]];
    } else if (reagent[0] === 'A-:') {
      conjugate_base = ['CB+:', reagent[1]];
    } else {
      conjugate_base = [MoleculeFactory(reagent[0].atoms, true, false, logger), reagent[1]]
    }
    container.getSubstrate()[0].conjugateAcid = false;
    container.getSubstrate()[0].conjugateBase = false;

    if (true === starting_reagent_is_strong_acid) {
      conjugate_base[0].isWeakBase = (logger) => true;
    }

    if (typeof conjugate_base[0] !== "string") {
      conjugate_base[0] = MoleculeFactory(
          conjugate_base[0].atoms,
          conjugate_base[0].conjugateBase,
          conjugate_base[0].conjugateAcid,
          logger
      )

      container.getSubstrate()[0] = MoleculeFactory(
          container.getSubstrate()[0].atoms,
          container.getSubstrate()[0].conjugateBase,
          container.getSubstrate()[0].conjugateAcid,
          logger
      )

      container.removeReagent(starting_reagent, logger); // this removes all of the starting reagent from the container
      // This must be done after we remove the starting reagent.
      reagent[0] = MoleculeFactory(
          reagent[0].atoms,
          reagent[0].conjugateBase,
          reagent[0].conjugateAcid,
          logger
      )
      const number_of_units = container.getSubstrate()[1] - starting_reagent[1]

      if (number_of_units < 0) {
        // if number_of_units is less than 0 then not all of the reagent molecules are deprotonated
        // but all substrate molecules are protonated
        // eg if we have 7 units of substrate and 10 units of reagent
        // then we don't do anything with the number of substrate molecules
        // but set the number of un-deprotonated reagent molecules to 3 (number of units *-1)
        // and the number of deprotonated reagent molecules to number of substrate molecules
        //  const number_of_units = container.getSubstrate()[1] - starting_reagent[1]
        container.addReagent(starting_reagent[0], number_of_units *-1, logger)
        container.addReagent(reagent[0], container.getSubstrate()[1], logger) // container.getSubstrate()[1] is the number of units

      } else {

        // container.modifyReagent(reagent, cloned_reagent)
        // eg if we have 10 units of substrate and 8 units of reagent
        // then we will end up with 8 units of deprotonated reagents and no un-deprotonated reagent molecules.
        // 8 units of protonated substrate (equal to number of units of reagent)
        // and 2 units of un-protonated substrate (original number of units of substrate - units of reagent)
        // cloned_reagent is the reagent after deprotonation
        // All reagent molecules are deprotonated
        // but not necessarily all substrate molecules are protonated
        container.addReagent(conjugate_base[0], starting_reagent[1], logger); // this calls a reaction
        const substrate_after_protonation = _.cloneDeep(container.getSubstrate()[0])
        container.getSubstrate()[0] = starting_substrate[0]
        container.getSubstrate()[1] = number_of_units
        container.substrate.push([substrate_after_protonation, starting_reagent[1]])
      }

      
      
      //throw new Error('need to update reagent first ie MoleculeFactory(reagent, ...)')
     // container.modifyReagent(reagent, conjugate_base, logger)
    } else {
      // For 'A:' or 'CB:' substrate "consumes" the reagent unless there is more reagent than substrate
      container.removeReagent(starting_reagent, logger);
      const number_of_units = container.getSubstrate()[1] - starting_reagent[1]
      if (number_of_units < 0) {
        container.addReagent(starting_reagent[0], number_of_units*-1, logger)
      } else {
        const substrate_after_reaction = _.cloneDeep(container.getSubstrate()[0])
        container.getSubstrate()[0] = starting_substrate
        container.getSubstrate()[1] = number_of_units
        container.substrate.push([substrate_after_reaction, starting_reagent[1]])
      }
    }
    container.getSubstrate()[0] = MoleculeFactory(
        container.getSubstrate()[0].atoms,
        container.getSubstrate()[0].conjugateBase,
        container.getSubstrate()[0].conjugateAcid,
        logger
    )

  } catch (e) {
    logger.log('error', '[Protonate] ' + e.red);
    console.log(e.stack);
    process.exit();
  }
};

module.exports = Protonate;
