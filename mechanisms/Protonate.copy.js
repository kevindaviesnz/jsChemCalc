const Constants = require("../Constants");
const Typecheck = require('../Typecheck');
const FindLeavingGroupAtom = require('../reflection/findLeavingGroupAtom');
const LewisBaseAtom = require('../reflection/LewisBaseAtom');
const _ = require('lodash');
const NucleophilicAttack = require('./NucleophilicAttack');
const LeavingGroupRemoval = require('./LeavingGroupRemoval');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const AtomFactory = require('../factories/AtomFactory');
const { Format } = require("logform");
const RemoveAtom = require('../actions/RemoveAtom');
const ReplaceAtom = require('../actions/ReplaceAtom');
const MoleculeFactory = require("../factories/MoleculeFactory");
const AddAtom = require('../actions/AddAtom');
const FindStrongestBronstedLoweryAcidMolecule = require('../reflection/FindStrongestBronstedLoweryAcidMolecule');
const { C } = require("../factories/PeriodicTable");
const uniqid = require('uniqid');
const FormatAs = require('../factories/FormatAs');
const env = require('../env');

/**
 * Here the substrate (base molecule) is protonated by a reagent (acid molecule)
 * For now the deprotonated atom will either be a nitrogen or an oxygen @todo.
 *
 * @param container - container containing the substrate and reagents.
 * @param logger
 *
 * Reviewed 16 Aug Kevin Davies
 *
 * @return {false|null}
 */
const Protonate = (container, logger) => {container.getSubstrate()[0]
  try {

    // Save the starting substrate for when
    // the number of units of substrate is
    // greater than the number of units of reagent.
    // In that case we will end up with a mix of protonated
    // substrate and un-protonated substrate.
    const starting_substrate = _.cloneDeep(container.getSubstrate()[0]);

    // Here the substrate is a conjugate acid (base that has accepted a proton) so
    // we don't proceed. A conjugate acid cannot be protonated (verified). A
    // conjugate base can however be deprotonated (verified).
    if (container.getSubstrate()[0].conjugateAcid) {
      if (env.debug) {
        logger.log(env.debug_log, '[Protonate] Substrate is a conjugate acid, so not proceeding with protonation.'.bgRed);
      }
      return false;
    }

    // A molecule that is a strong acid cannot be protonated.
    if (container.getSubstrate()[0].isStrongAcid) {
      if (env.debug) {
        logger.log(env.debug_log, '[Protonate] Not protonating as substrate is a strong acid.'.bgRed);
      }
      return false;
    }

    // For now we are assuming that if the substrate is a weak base it will not
    // be protonated. This will have to reviewed in the future.
    // @todo
    if (container.getSubstrate()[0].isWeakBase) {
      if (env.debug) {
        logger.log(env.debug_log, '[Protonate] Not protonating as substrate is a weak base.'.bgRed);
      }
      return false;
    }

    // No reagents so obviously the substrate cannot be protonated (substrate cannot
    // protonate itself!)
    if (container.reagents.length === 0) {
      if (env.debug) {
        logger.log(env.debug_log, '[Protonate] No reagents found'.bgYellow);
      }
      return false;
    }

    // Initialise the acid atom. This will be set to the atom in the reagent that
    // will be deprotonated.
    let acid_atom = null;

    // Find the reagent that will donate the proton.
    // Note that the reagent will be an array where the first element
    // is the reagent molecule and the second element is the
    // number of units.
    const reagent = FindStrongestBronstedLoweryAcidMolecule(container.reagents, logger);

    // Save the starting reagent.
    // If there is more units of reagent than substrate then container will end up
    // with a mix of the original reagent and the deprotonated reagent.
    const starting_reagent = _.cloneDeep(reagent);

    // For now we are assuming that if the reagent is a weak acid it will not
    // be deprotonated. This will have to reviewed in the future.
    // @todo
    if (reagent === null || reagent[0].isWeakAcid) {
      if (env.debug) {
        logger.log(env.debug_log, '[Protonate] Not protonating as no suitable base reagent found.'.bgRed);
      }
      return false;
    }

    // If the reagent is a generic acid or a generic conjugate acid then we don't bother
    // looking for the reagent atom that will be deprotonated.
    // Note that a conjugate acid can be deprotonated (verified).
    if ('A:' !== reagent[0] && 'CA:' !== reagent[0]) {
      acid_atom = BronstedLoweryAcidAtom(reagent[0], logger);
      if (undefined === acid_atom) {
        if (env.debug) {
          logger.log(env.debug_log, '[Protonate] Could not find a reagent atom that can be deprotonated.')
        }
        return false;
      }
      if (env.debug) {
        logger.log(env.debug_log, (`[Protonate] Got acid atom (reagent) ${acid_atom.atomicSymbol} ${acid_atom.atomId} charge ${acid_atom.charge(reagent.atoms, logger)}`).bgGreen);
      }
    }

    // Find the substrate atom that will be protonated.
    const target_atom = BronstedLoweryBaseAtom(container.getSubstrate()[0], logger)
    /*
    // Here we couldn't find a substrate nitrogen atom with a positive
    // charge so we now look for a terminal oxygen atom.

      const target_atom = _.find(container.getSubstrate()[0].atoms, (atom) =>
          atom.atomicSymbol === "O" &&
          atom.isTerminalAtom(container.getSubstrate()[0].atoms)
      );
*/
    // We've tried looking for a nitrogen atom with a positive charge and tried looking for an oxygen atom
    // but failed. So we return false.
    if (undefined === target_atom) {
      if (env.debug) {
        logger.log(env.debug_log, (`[Protonate] Could not find substrate atom that can be protonated`))
      }
      return false
    }

    // If we have gotten to here then we have a suitable reagent (either a generic acid molecule or a molecule that can
    // donate a proton to the substrate) and a suitable substrate (a molecule that can
    // accept a proton). This means we can go ahead with protonating the
    // substrate.

    
    // If the reagent is a generic acid or a generic acid base then we set it to a conjugate base.
    if ('CA"' === reagent[0]) {
        reagent[0] = "B:"
    } else if ('A:' === reagent[0]) {
        reagent[0] = "CB:"
    } else {

      // If reagent acid atom is a neutral oxygen and the
      // substrate base atom is a neutral oxygen then
      // the substrate oxygen base atom is not protonated
      // unless the reagent is a strong acid.
      if (false === reagent[0].isStrongAcid
          && target_atom.atomicSymbol === 'O' && target_atom.charge(container.getSubstrate()[0].atoms, logger) === 0
          && acid_atom.atomicSymbol === 'O' && acid_atom.charge(reagent[0].atoms, logger) === 0) {
        if (env.debug) {
          logger.log(env.debug_log, (`[Protonate] Neutral oxygen atom cannot protonate another neutral oxygen atom.`))
        }
        return false
      }
      // Here the reagent is not a generic acid so we remove a proton from the reagent acid atom
      let proton = acid_atom.hydrogens(reagent[0].atoms)[0];
      proton.breakBond(acid_atom, reagent, logger);
      _.remove(reagent[0].atoms, (a) => a.atomId === proton.atomId);

      // If the reagent was a strong acid, then after deprotonation it will
      // be a weak base.
      if (reagent[0].isStrongAcid) {
        reagent[0].isWeakBase = true
      }

      // Likewise, if a reagent was a weak base, then  after protonation it will be a strong acid.
      if (reagent[0].isWeakAcid) {
        reagent[0].isStrongBase = true
      }

      reagent[0] = MoleculeFactory(
        reagent[0].atoms,
        true,
        false,
        logger
      )
    }
    
    // Now we add a proton to the substrate target atom
    const proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
    proton[Constants.electron_index] = [];
    // Bond proton to the substrate target atom.
    // Here the substrate target atom donates a pair of electrons to
    // form a bond with the proton.
    target_atom.makeDativeBond(proton, true, container.getSubstrate()[0].atoms, logger)
    // After the substrate (base molecule) is protonated it becomes a conjugate acid.

    // If the substrate was a strong base, then after protonation it will
    // be a weak acid.
    if (container.getSubstrate()[0].isStrongBase) {
      container.getSubstrate()[0].isWeakAcid = true
    }

    // Likewise, if the substrate was a weak base, then after protonation it will be a strong acid.
    if (container.getSubstrate()[0].isWeakBase) {
      container.getSubstrate()[0].isStongAcid = true
    }

    container.getSubstrate()[0] = MoleculeFactory(
      container.getSubstrate()[0].atoms,
      false,
      true,
      logger
    )

    // Lastly, we adjust the number of units of substrate and the number of units of reagent.
    if (container.getSubstrate()[1] === reagent[1]) {
      return
    }
    // We do this so we can re-add the now deprotonated reagent after
    // we add the original reagent.
    container.removeReagent(reagent, logger)

    // Lastly we adjust the number of units of substrate and number of units of reagent.
    const number_of_units = container.getSubstrate()[1] - starting_reagent[1]
    if (number_of_units < 0) {
      // In this case not all of the reagent molecules have been deprotonated
      // but all of the substrate molecules have been protonated.
      // eg if we have 7 units of substrate and 10 units of reagent
      // then we don't do anything with the number of substrate molecules
      // but set the number of un-deprotonated reagent molecules to 3 (number of units *-1)
      // and the number of deprotonated reagent molecules to number of substrate molecules
      container.addReagent(starting_reagent[0], number_of_units * -1, logger)
      container.addReagent(reagent[0], container.getSubstrate()[1], logger) // cloned reagent will now be the reagent after it is protonated
    } else {
      // In this case all of the reagent molecules were deprotonated
      // but not all of the substrate molecules have been protonated.
      // eg if we have 10 units of substrate and 8 units of reagent
      // then we will end up with 8 units of deprotonated reagents and no un-deprotonated reagent molecules.
      // 8 units of protonated substrate (equal to number of units of reagent)
      // and 2 units of un-protonated substrate (original number of units of substrate - units of reagent)
      container.addReagent(reagent[0], starting_reagent[1], logger)
      const substrate_after_protonation = _.cloneDeep(container.getSubstrate()[0])
      // Set the number of units of un-protonated substrate.
      container.getSubstrate()[0] = starting_substrate
      container.getSubstrate()[1] = number_of_units
      // Add the protonated substrate
      container.substrate.push([substrate_after_protonation, starting_reagent[1]])
    }


  } catch (e) {
    logger.log('error', `[Deprotonate] ${e}`.bgRed);
    console.log(e.stack);
    process.exit();
  }
};

module.exports = Protonate;
