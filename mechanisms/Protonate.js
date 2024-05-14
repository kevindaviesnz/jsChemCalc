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
const Stabilise = require('../actions/Stabilise')
const env = require('../env');
const ConjugateBase = require("../reflection/ConjugateBase");
const DoProtonation = require('../AI/Protonate')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')

const colors = require('colors');

colors.enable()

/**
 * Here the substrate (base molecule) is protonated by a reactant (acid molecule)
 * For now the deprotonated atom will either be a nitrogen or an oxygen @todo.
 *
 * @param container - container containing the substrate and reagent.
 * @param logger
 *
 * Reviewed 16 Aug Kevin Davies
 *
 * @return {false|null}
 */
const Protonate = (container, substrate, reactant, logger) => {
  try {

    const call_id = '__' + uniqid().substr(uniqid().length - 3, 3);
    logger.info(`[Protonate] ${call_id} Protonating ${substrate[0].canonicalSmiles} using $reactant[0].canonicalSmiles}.`)
    console.log(`[Protonate] ${call_id} Protonating ${substrate[0].canonicalSmiles} using $reactant[0].canonicalSmiles}.`)
    logger.info('[Protonate] ' + call_id + ' Before protonating: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
    console.log('[Protonate] ' + call_id + ' Before protonating: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
    let reactant_molecule = _.cloneDeep(reactant[0])
    let substrate_molecule = _.cloneDeep(substrate[0])

    let atom_to_be_deprotonated = null
    let atom_to_be_protonated = null

    if (typeof substrate_molecule !== 'string') {
        atom_to_be_protonated = BronstedLoweryBaseAtom(substrate_molecule, reactant_molecule, logger)
        logger.info(`[Protonate] Got ${atom_to_be_protonated.atomicSymbol}`)
    }

    if (typeof reactant_molecule !== 'string') {
        atom_to_be_deprotonated = BronstedLoweryAcidAtom(reactant_molecule, substrate_molecule, logger)
        logger.info(`[Protonate] Got ${atom_to_be_deprotonated.atomicSymbol}`)
    }

    if('CA:' === reactant_molecule) {
      reactant_molecule = 'B:'
    } else if('A:' === reactant_molecule) {
      reactant_molecule = 'CB:'
    }

    if('CB:' === substrate_molecule) {
      substrate_molecule = 'A:'
    } else if('B:' === substrate_molecule) {
      substrate_molecule = 'CA:'
    }

    // Both substrate and reactant molecule are generic
    if (typeof substrate_molecule === 'string' && typeof reactant_molecule === 'string') {
      reactant[1] = reactant[1] - 1
      if (0 === reactant[1]) {
        container.removeReactant(reactant, logger)
      }
      substrate[1] = substrate[1] - 1
      if (0 === substrate[1]) {
        container.removeReactant(substrate, logger)
      }
      container.addReactant(substrate_molecule, 1, logger)
      container.addReactant(reactant_molecule, 1, logger)
      return 
    }

    // If we have gotten to here then we have a suitable substrate molecule (either a generic base molecule or a molecule that can
    // accept a proton from the reactant) and a suitable reactant (either generic acid molecule or a molecule that can
    // donate a proton). This means we can go ahead with protonating the substrate. Note that at his point substrate molecule and
    // reactant molecule should not both be generic.

    // Rule: Neutral oxygen atom cannot protonate another neutral oxygen atom
    // unless the proton donor molecule is a strong acid.
    if (false === reactant_molecule.isStrongAcid
          && atom_to_be_protonated.atomicSymbol === 'O' && atom_to_be_protonated.charge(substrate_molecule.atoms, logger) === 0
          && atom_to_be_deprotonated.atomicSymbol === 'O' && atom_to_be_deprotonated.charge(reactant_molecule.atoms, logger) === 0) {
        logger.info(`[Protonate] Protonation of ${substrate[0].canonicalSmiles} (base molecule) by ${reactant[0].canonicalSmiles} (acid molecule) failed as a neutral oxygen atom cannot protonate another neutral oxygen atom.`)
        return false
    }

    // Remove a proton from the reactant molecule
    if (typeof reactant_molecule !== 'string') {
      let proton = atom_to_be_deprotonated.hydrogens(reactant_molecule.atoms)[0];
      proton.breakBond(atom_to_be_deprotonated, [reactant_molecule,1], logger);
       _.remove(reactant_molecule.atoms, (a) => a.atomId === proton.atomId);
  
       reactant_molecule = Stabilise(MoleculeFactory(
        reactant_molecule.atoms,
        true,
        false,
        logger
      ), 0, logger)
    }

    // Now we add a proton to the atom to be protonated
    proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
    proton[Constants.electron_index] = [];
    // Bond proton to the atom to be protonated
    atom_to_be_protonated.makeDativeBond(proton, true, substrate_molecule.atoms, logger)
    substrate_molecule.atoms.push(proton)

    // Before stablising we need to check for a leaving group.
    // This will usually be a water group and should result in a carbocation.
    const leaving_group_molecule = RemoveLeavingGroup([substrate_molecule, 1], logger)
    if (false !== leaving_group_molecule) {
       container.reactants.push([leaving_group_molecule,1])
    }
    substrate_molecule = Stabilise(MoleculeFactory(
      substrate_molecule.atoms,
      false,
      true,
      logger
    ), 0, logger)

    // Lastly, we remove 1 unit of reactant, add 1 unit of reactant molecule
    // and remove 1 unit of substrate, and add 1 unit of substrate molecule.
    reactant[1] = reactant[1] - 1
    if (0 === reactant[1]) {
       container.removeReactant(reactant, logger)
    }
    substrate[1] = substrate[1] - 1
    if (0 === substrate[1]) {
       container.removeReactant(substrate, logger)
    }
    if (reactant_molecule.canonicalSmiles === '[O-]' || substrate_molecule.canonicalSmiles === '[O-]') {
      console.log('oxygen deprotonated')
      logger.warn('Protonate: Oxygen deprotonated ' + reactant[0].canonicalSmiles + ' {H+} <---- : ' + substrate[0].canonicalSmiles + ' -> ' + reactant_molecule.canonicalSmiles + ', ' + substrate_molecule.canonicalSmiles)
      logger.warn('pKa of reactant: ' + reactant[0].canonicalSmiles + ' ' + reactant[0].pKa)
      logger.warn('pKa of substrate: ' + substrate[0].canonicalSmiles + ' ' + substrate[0].pKa)
    }

    container.addReactant(reactant_molecule,1, logger)
    container.addReactant(substrate_molecule,1, logger)

    // CC(=O)C + H+ -> CCCC(=[O+])C
    const log_description = `[Protonate] ${reactant[0].canonicalSmiles} (acid, pKa ${reactant[0].pKa}) donates a proton to ${substrate[0].canonicalSmiles} (base, pKa ${substrate[0].pKa}) resulting in ${reactant_molecule.canonicalSmiles} (conjugate base of ${reactant[0].canonicalSmiles}, pKa  ${reactant_molecule.canonicalSmiles}) and ${substrate_molecule.canonicalSmiles} (conjugate acid of ${substrate[0].canonicalSmiles}, pKa ${substrate_molecule.pKa})`;
    logger.reaction(
        log_description
    )
    logger.info(
        log_description
    )

    logger.info('[Protonate] ' + call_id + ' After protonatong: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgYellow)
    console.log('[Protonate] ' + call_id + ' After protonatong: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgYellow)
    return

  } catch (e) {
    logger.log('error', `[Protonate] ${e}`.bgRed);
    console.log(e.stack);
    process.exit(1, `[Protonate] Fatal error.`);
  }
};

module.exports = Protonate;
