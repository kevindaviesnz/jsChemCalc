const Constants = require("../Constants");
const Typecheck = require('../Typecheck');
const findLeavingGroupAtom = require('../reflection/findLeavingGroupAtom');
const LewisBaseAtom = require('../reflection/LewisBaseAtom');
const _ = require('lodash');
const nucleophilicAttack = require('./NucleophilicAttack');
const leavingGroupRemoval = require('./LeavingGroupRemoval');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const AtomFactory = require('../factories/AtomFactory');
const { Format } = require("logform");
const RemoveAtom = require('../actions/RemoveAtom');
const ReplaceAtom = require('../actions/ReplaceAtom');
const MoleculeFactory = require("../factories/MoleculeFactory");
const AddAtom = require('../actions/AddAtom');
const FindStrongestBronstedLoweryBaseMolecule = require('../reflection/FindStrongestBronstedLoweryBaseMolecule');
const { C } = require("../factories/PeriodicTable");
const uniqid = require('uniqid');
const FormatAs = require('../factories/FormatAs');
const env = require('../env');

/**
 * Deprotonate the substrate in the container.
 * 
 * @param logger 
 * 
 * @return {null} 
*/
const Deprotonate = (container, logger) => {
    try {
      Typecheck(
        { name: "molecule", value: container.getSubstrate()[0], type: "object" },
        { name: "atoms", value: container.getSubstrate()[0].atoms, type: "array" },
        { name: "logger", value: logger, type: "object" }
      );

      const substrate = container.getSubstrate()[0]
      const starting_substrate = _.cloneDeep(substrate)

      if (substrate.conjugateAcid || substrate.conjugateBase) {
        if (env.debug) {
          logger.log(env.debug_log, '[Deprotonate] Substrate is a conjugate acid/base, so not proceeding with deprotonation.'.bgRed);
        }
        return false;
      }

      if (substrate.isWeakBase) {
        if (env.debug) {
          logger.log(env.debug_log, '[Deprotonate] Not deprotonating as substrate is a weak acid.'.bgRed);
        }
        return false;
      }
    
      if (container.reagents.length === 0) {
        if (env.debug) {
          logger.log(env.debug_log, '[Deprotonate] No reagents found'.bgYellow);
        }
        return false;
      }

      let base_atom = null;
      const reagent = FindStrongestBronstedLoweryBaseMolecule(container.reagents, logger);
      const starting_reagent = _.cloneDeep(reagent)

      if (reagent === null || reagent[0].isWeakBase) {
        if (env.debug) {
          logger.log(env.debug_log, '[Deprotonate] Not deprotonating as no suitable base reagent found.'.bgRed);
        }
        return false;
      }

      if ('B:' !== reagent[0] && 'CB:' !== reagent[0] && 'CB+:' !== reagent[0]) {
        base_atom = BronstedLoweryBaseAtom(reagent[0], logger)
        if (undefined === base_atom) {
          return false;
        }
        if (env.debug) {
          logger.log(env.debug_log, (`[Deprotonate] Got base atom (reagent) ${base_atom.atomicSymbol} ${base_atom.atomId} charge ${base_atom.charge(reagent.atoms, logger)}`).bgGreen);
        }
      }


      // @todo should this be done for all atoms that have a positive charge?
      // Look for nitrogen atom with a positive charge
      // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
      let target_atom = _.find(substrate.atoms, (atom) =>
        atom.atomicSymbol === "N" &&
        atom.charge(substrate.atoms, logger) === 1
      );

      if (undefined === target_atom) {
        target_atom = _.find(substrate.atoms, (atom) =>
          atom.atomicSymbol === "O" &&
          atom.carbonBonds(substrate.atoms).length === 1 &&
          atom.hydrogens(substrate.atoms).length === 2 &&
          atom.charge(substrate.atoms, logger) === 1
        );
        }
  
        /*
      if (target_atom !== undefined) {
        const t_atom_proton = target_atom.hydrogens(container.getSubstrate()[0].atoms)[0];
        const t_atom_target_atom = t_atom_proton.bonds(container.getSubstrate()[0].atoms, true)[0].atom;
        container.getSubstrate()[0].atoms = t_atom_proton.breakBond(
            t_atom_target_atom,
            [container.getSubstrate()[0], container.getSubstrate()[1]],
            logger
        );
        _.remove(container.getSubstrate()[0].atoms, (a) => a.atomId === t_atom_proton.atomId);
  
        let proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
        proton[Constants.electron_index] = [];
        // Set substrate @todo - units
        container.getSubstrate()[0][0] = MoleculeFactory(
          container.getSubstrate()[0].atoms,
          container.getSubstrate()[0].conjugateBase,
          container.getSubstrate()[0].conjugateAcid,
          logger
        ) 
        // Set reagent
        const m = MoleculeFactory(
          [proton],
          false,
          false,
          logger
        );
        return true;
      }
      */
  
      if (undefined === target_atom) {
        target_atom = BronstedLoweryAcidAtom(container.getSubstrate()[0], logger);
      }

      if (undefined === target_atom) {
        return false;
      }
  
      const target_atom_molecule_atoms = container.getSubstrate()[0].atoms;
      const target_atom_single_bonds = target_atom.bonds(target_atom_molecule_atoms, true);
      const bond = target_atom_single_bonds[0];
  
      if (bond === undefined) {
        throw new Error('[Deprotonate] Target atom has no bonds. Are you remembering to include hydrogen bonds?');
      }

      // Remove proton from acid atom
      let proton = target_atom.hydrogens(container.getSubstrate()[0].atoms)[0];
      proton.breakBond(target_atom, container.getSubstrate(), logger);
      _.remove(container.getSubstrate()[0].atoms, (a) => a.atomId === proton.atomId);
      //console.log('Deprotonate() Target atom charge ' + target_atom.charge(container.getSubstrate()[0].atoms))
      container.getSubstrate()[0] = MoleculeFactory(
          container.getSubstrate()[0].atoms,
          container.getSubstrate()[0].conjugateBase,
          container.getSubstrate()[0].conjugateAcid,
          logger
      )
      if (reagent === false) {
        return false;
      }
  
      /*
            // Adjust the number of units of reagent
      const number_of_units = container.getSubstrate()[1] - starting_reagent[1]
            if (number_of_units < 0) {
        // if number_of_units is less than 0 then not all of the reagent molecules are deprotonated
        // but all substrate molecules are protonated        
        container.removeReagent(starting_reagent, logger); // this removes all of the starting reagent from the container
        container.reagents.push([reagent, number_of_units])
        container.addReagent(conjugate_base[0], container.getSubstrate()[1], logger); // this calls a reaction
      } else {
        // All reagent molecules are deprotonated 
        // but not necessarily all substrate molecules are protonated
        if (number_of_units > 0) {
          container.addSubstrate(starting_substrate[0], number_of_units, logger)
        }
        container.removeReagent(starting_reagent, logger); // this removes all of the starting reagent from the container
        container.addReagent(conjugate_base[0], starting_reagent[1], logger); // this calls a reaction
      }
      */
      // eg if we have 10 units of substrate and 5 units of reagent
      // then we will end up with 5 units of protonated reagent and no un-protonated reagent
      // 5 units of deprotonated substrate
      // and 5 units of un-deprotonated substrate.
      const number_of_units = container.getSubstrate()[1] - starting_reagent[1]
      if (reagent[0] === 'B:') {
        container.removeReagent('B:', logger);
        if (number_of_units < 0) {
          // Not all of the reagent molecules were protonated
          // but not all of the substrate molecules were deprotonated
          container.reagents.push(['B:', number_of_units, logger])
          container.addReagent('CB:', 1, logger); // calls container.react()
        } else {
          // All of the reagent molecules were protonated
          // but not necessarily all of the substrate molecules were deprotonated
          container.addSubstrate(starting_substrate, number_of_units, logger)
          container.addReagent('CB:', 1, logger); // calls container.react()
        }
        if (env.debug) {
          logger.log(env.debug_log, '[Deprotonate] Added CA: to reagents');
        }
      } else if (reagent[0] === 'CB:') {
        container.removeReagent('CB:', logger);
        // @todo repeated code
        if (number_of_units < 0) {
          // Not all of the reagent molecules were protonated
          // but  all of the substrate molecules were deprotonated
          container.addReagent('CB:', number_of_units, logger)
          container.addReagent('A:', number_of_units, logger)
        } else {
          // All of the reagent molecules were protonated
          // but not necessarily all of the substrate molecules were deprotonated
          container.addSubstrate(starting_substrate, number_of_units, logger)
          container.addReagent('A:', number_of_units, logger)
        }

      } else if (true) { // @todo

        let cloned_reagent = _.cloneDeep(reagent);
        const base_atom_cloned = _.cloneDeep(base_atom);
        proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3), logger);
        proton[Constants.electron_index] = [];
        let base_atom_index = null;
  
        // Remove ionic bond from reagent
        const ionic_bonds = _.cloneDeep(base_atom).ionicBonds(reagent[0].atoms);
        if (ionic_bonds.length > 0) {
          const ionic_child_atom = _.cloneDeep(ionic_bonds[0].atom);
          base_atom_cloned.breakIonicBond(ionic_child_atom, cloned_reagent, logger);
          throw new Error('May need to pass in cloned_reagent[0] and set cloned_reagent accordingly')
          cloned_reagent = RemoveAtom(cloned_reagent, ionic_child_atom, logger);
          cloned_reagent = AddAtom(cloned_reagent, proton, logger);
          cloned_reagent.atoms = base_atom_cloned.bondAtomToAtom(proton, false, cloned_reagent.atoms, logger);
          const m = MoleculeFactory(
            [ionic_child_atom],
            logger
          );
          cloned_reagent = ReplaceAtom(cloned_reagent, base_atom_cloned, logger);
          container.addReagent(m, 1, logger);
        } else {
          cloned_reagent[0].atoms.push(proton);
          cloned_reagent[0].atoms = base_atom_cloned.bondAtomToAtom(proton, true, cloned_reagent[0].atoms, logger);
        }
        // Replace reagent with cloned reagent (do we need to do this?)
        cloned_reagent[0] = MoleculeFactory(
          cloned_reagent[0].atoms,
          cloned_reagent[0].conjugateBase,
          cloned_reagent[0].conjugateAcid,
          logger
        )
        // container.modifyReagent(reagent, cloned_reagent)
        // eg if we have 10 units of substrate and 8 units of reagent
        // then we will end up with 8 units of protonated reagents and no un-protonated reagent molecules.
        // 8 units of deprotonated substrate (equal to number of units of reagent)
        // and 2 units of un-deprotonated substrate (original number of units of substrate - units of reagent)
        // cloned_reagent is the reagent after protonation
        container.removeReagent(reagent, logger)
        if (number_of_units < 0) {
          // Not all of the reagent molecules have been protonated
          // but all of the substrate molecules have been deprotonated
          // eg if we have 7 units of substrate and 10 units of reagent
          // then we don't do anything with the number of substrate molecules
          // but set the number of un-protonated reagent molecules to 3 (number of units *-1)
          // and the number of protonated reagent molecules to number of substrate molecules
          //  const number_of_units = container.getSubstrate()[1] - starting_reagent[1]
          container.addReagent(starting_reagent[0], number_of_units * -1, logger)
          container.addReagent(cloned_reagent[0], container.getSubstrate()[1], logger) // cloned reagent will now be the reagent after it is protonated
          container.getSubstrate()[0] = MoleculeFactory(
              container.getSubstrate()[0].atoms,
              container.getSubstrate()[0].conjugateBase,
              container.getSubstrate()[0].conjugateAcid,
              logger
          )
        } else {
          // All of the reagent molecules were protonated
          // but not necessarily all of the substrate molecules
          // eg if we have 10 units of substrate and 8 units of reagent
          // then we will end up with 8 units of protonated reagents and no un-protonated reagent molecules.
          // 8 units of deprotonated substrate (equal to number of units of reagent)
          // and 2 units of un-deprotonated substrate (original number of units of substrate - units of reagent)
          // cloned_reagent is the reagent after protonation
          //       const number_of_units = container.getSubstrate()[1] - starting_reagent[1]

          container.addReagent(cloned_reagent[0], starting_reagent[1], logger) // cloned reagent will now be the reagent after it is protonated, all of the reagent is protonated
          const substrate_after_deprotonation = _.cloneDeep(container.getSubstrate()[0])
          container.getSubstrate()[0] = starting_substrate
          container.getSubstrate()[1] = number_of_units
          container.substrate.push([substrate_after_deprotonation, starting_reagent[1]])
        }

        //console.log('deprotonate')
        //console.log(FormatAs(container.getSubstrate()[0]).SMILES(logger))
      //  const json = FormatAs(container.getSubstrate()[0]).JSON(logger)
     //   throw new Error('debugging deprotonation')
          // @todo units
      } else {
  
      }
    } catch (e) {
      logger.log('error', (`[Deprotonate] ${e}`).bgRed);
      console.log(e.stack);
      process.exit();
    }
  };
  
  module.exports = Deprotonate;
  
