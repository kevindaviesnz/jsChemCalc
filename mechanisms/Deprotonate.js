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
const { C, S } = require("../factories/PeriodicTable");
const uniqid = require('uniqid');
const FormatAs = require('../factories/FormatAs');
const Stabilise = require('../actions/Stabilise')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')
const env = require('../env');

const colors = require('colors');

colors.enable()

/**
 * Here the substrate (acid molecule) is deprotonated by a reagent (base molecule)
 *
 * @param container - container containing the substrate and reagent.
 * @param logger
 *
 * Reviewed 16 Aug Kevin Davies
 *
 * @return {false|null}
 */
const Deprotonate = (container, substrate, reactant, logger) => {
  try {

    if (undefined === logger) {
      throw new Error(`[Deprotonate] Logger should not be undefined`)
    }

    logger.info('[Deprotonate] Before deprotonationg: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
    console.log('[Deprotonate] Before deprotonationg: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)

    if (_.isEqual(substrate, reactant)) {
      logger.info(`[Deprotonate] Deprotonation of ${substrate[0].canonicalSmiles} (acid molecule) failed as it is the same as the reactant.`)
      return false;
    }

    if (typeof substrate[0] !== 'string' && typeof reactant[0] !== 'string' && substrate[0].pKa > reactant[0].pKa) {
      logger.info(`[Deprotonate] Deprotonation of ${substrate[0].canonicalSmiles} (acid molecule) by ${reactant[0].canonicalSmiles} (base molecule) failed as ${substrate[0].canonicalSmiles} (pKa ${substrate[0].pKa}) has a higher pKa than ${reactant[0].canonicalSmiles} (pka ${reactant[0]}.pKa).`)
    }

    // Rules
    // Sulphuric acid (pKa 1.7, substrate) can donate a proton water (pKa 15, reactant) (tested)
    // Water cannot donate a proton to sulfate (pKa null)
    // Special case: water does not deprotonate hydronium
    if (reactant[0].canonicalSmiles === 'O' && substrate[0].canonicalSmiles === '[O+]') {
      logger.info(`[Deprotonate] Deprotonation of ${substrate[0].canonicalSmiles} (acid molecule) by ${reactant[0].canonicalSmiles} (base molecule) failed because water does not deprotonate hydronium.`)
      return false;
    }

    let reactant_molecule = _.cloneDeep(reactant[0])
    let substrate_molecule = _.cloneDeep(substrate[0])

    let atom_to_be_deprotonated = null
    let atom_to_be_protonated = null

    // If the reactant molecule is a generic base or a generic conjugate base then we don't bother
    // looking for the proton acceptor atom.
    if ('B:' !== reactant_molecule && 'BA:' !== reactant_molecule) {
      // Here the substrate (acid molecule) is deprotonated by a reagent (base molecule)
      atom_to_be_protonated = BronstedLoweryBaseAtom(reactant_molecule, substrate_molecule, logger); // This should not change the reactant
      if (undefined === atom_to_be_protonated) {
        logger.info(`[Deprotonate] Deprotonation failed as reactant ${reactant_molecule.canonicalSmiles} does not have an atom that can be protonated.`)
        return false
      }
    } else if('CB:' === reactant_molecule) {
      reactant_molecule = 'A:'
    } else if('B:' === reactant_molecule) {
      reactant_molecule = 'CA:'
    }

    // An oxygen atom cannot deprotonate a water molecule (verified).
     if ('O' === atom_to_be_protonated.atomicSymbol && substrate_molecule.canonicalSmiles === 'O') {
       logger.info(`[Deprotonate] Deprotonation of ${substrate[0].canonicalSmiles} (acid molecule) by ${reactant[0].canonicalSmiles} (base molecule) failed because an oxygen atom cannot deprotonate a water molecule.`)
           return false;
     }

        /*
    A nitrogen atom that is part of a molecule with a double bond to carbon (a carbon-carbon double bond or a carbonyl group) typically 
     cannot deprotonate a water molecule.
   */
     if ('N' === atom_to_be_protonated.atomicSymbol && substrate_molecule.canonicalSmiles === 'O') {
      const double_bond_carbon = _.find(atom_to_be_protonated.doubleBonds(reactant_molecule.atoms, false), (db)=>{
        return db.atom.atomicSymbol === 'C'
      })    
      if (undefined !== double_bond_carbon) {
        if (env.debug) {
          logger.log(env.debug_log, '[Deprotonate] An oxygen atom cannot deprotonate a water molecule.'.bgRed);
        }
        logger.info(`[Deprotonate] Deprotonation of ${substrate[0].canonicalSmiles} (acid molecule) by ${reactant[0].canonicalSmiles} (base molecule) failed because a nitrogen atom that is part of a molecule with a double bond to carbon (a carbon-carbon double bond or a carbonyl group) typically cannot deprotonate a water molecule.`)
        return false;
      }
    }


    if ('A:' !== substrate_molecule && 'CA:' !== substrate_molecule) {
      // Here the substrate (acid molecule) is deprotonated by a reagent (base molecule)
      atom_to_be_deprotonated = BronstedLoweryAcidAtom(substrate_molecule, reactant_molecule, logger); 
    } else if('CB:' === substrate_molecule) {
      substrate_molecule = 'A:'
    } else if('B:' === substrate_molecule) {
      substrate_molecule = 'CA:'
    }

    // Both substrate and reactant molecule are generic
    if ((substrate_molecule === 'CB:' || substrate_molecule === 'B:') && (reactant_molecule === 'CA:' || substrate_molecule === 'A:')) {
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

    // If we have gotten to here then we have a suitable substrate molecule (either a generic acid molecule or a molecule that can
    // donate a proton) and a suitable reactant (either generic base molecule or a molecule that can
    // accept a proton). This means we can go ahead with deprotonating the substrate. Note that at his point substrate molecule and
    // reactant molecule should not both be generic.

    // Remove a proton from the substrate molecule
    let proton = atom_to_be_deprotonated.hydrogens(substrate_molecule.atoms)[0];
    substrate_molecule.atoms = proton.breakBond(atom_to_be_deprotonated, [substrate_molecule,1], logger);
     _.remove(substrate_molecule.atoms, (a) => a.atomId === proton.atomId);

     substrate_molecule = Stabilise(MoleculeFactory(
      substrate_molecule.atoms,
      true,
      false,
      logger
    ), 0, logger)

    // Now we add a proton to the atom to be protonated
    proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
    proton[Constants.electron_index] = [];
    // Bond proton to the atom to be protonated
    reactant_molecule.atoms = atom_to_be_protonated.makeDativeBond(proton, true, reactant_molecule.atoms, logger)
    reactant_molecule.atoms.push(proton)

    // Before stablising we need to check for a leaving group.
    // This will usually be a water group and should result in a carbocation.
    const leaving_group_molecule = RemoveLeavingGroup([reactant_molecule, 1], logger)
    if (false !== leaving_group_molecule) {
       container.reactants.push([leaving_group_molecule,1])
    }

    reactant_molecule = Stabilise(MoleculeFactory(
      reactant_molecule.atoms,
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
      console.log('Oxygen deprotonated')
    }
    
    container.addReactant(reactant_molecule,1, logger)
    container.addReactant(substrate_molecule,1, logger)

    /*
{"level":"info","message":"[Deprotonate] CCCC(=O)C (base, pKa  null) accepts a proton from O[S](=O)(=O)O (acid, pKa -3) resulting in CCCC(=[O+])C (conjugate acid of CCCC(=O)C, pKa CCCC(=[O+])C) and OC(=[O+])(=O)O (conjugate base of O[S](=O)(=O)O, pKa  15)"}

    */

    const log_description = `[Deprotonate] Result ${reactant[0].canonicalSmiles} (base, pKa  ${reactant[0].pKa}) accepts a proton from ${substrate[0].canonicalSmiles} (acid, pKa ${substrate[0].pKa}) resulting in ${reactant_molecule.canonicalSmiles} (conjugate acid of ${reactant[0].canonicalSmiles}, pKa ${reactant_molecule.canonicalSmiles}) and ${substrate_molecule.canonicalSmiles} (conjugate base of ${substrate[0].canonicalSmiles}, pKa  ${substrate_molecule.pKa})`;

    logger.info(
        log_description
    )

    logger.info('[Deprotonate] Before deprotonationg: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgGreen)
    console.log('[Deprotonate] Before deprotonationg: Reactants in container ' + container.renderReactantsAsSmiles(container.reactants).toString().bgYellow)

    return

  } catch (e) {
    logger.log('error', `[Deprotonate] ${e}`.bgRed);
    console.log(e.stack);
    process.exit();
  }
};

module.exports = Deprotonate;
