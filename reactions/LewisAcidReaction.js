const Set = require('../Set');
const Constants = require("../Constants");
const { loggers } = require('winston');
const { P } = require('../factories/PeriodicTable');
const _ = require('lodash');
const Typecheck = require('../Typecheck');
const FindStrongestBronstedLoweryBaseMolecule = require('../reflection/FindStrongestBronstedLoweryBaseMolecule');
const FindStrongestBronstedLoweryAcidMolecule = require('../reflection/FindStrongestBronstedLoweryAcidMolecule');
const LewisAcidBaseReaction = require('./LewisAcidBase');
const LewisAcidAtom = require('../reflection/LewisAcidAtom');
const LewisBaseAtom = require('../reflection/LewisBaseAtom');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const BronstedLoweryAcidBaseReaction = require('./BronstedLoweryAcidBaseReaction');
const colors = require('colors');
const MoleculeFactory = require('../factories/MoleculeFactory');
const AtomsFactory = require('../factories/AtomsFactory');
const Deprotonate = require('../actions/Deprotonate');
const MDeprotonate = require('../mechanisms/Deprotonate');
const ExtractOHLeavingGroups = require('../actions/ExtractOHLeavingGroups');
const FindStrongestLewisAcidMolecule = require('../reflection/FindStrongestLewisAcidMolecule');

colors.enable();

/**
 * Perform Lewis Acid Base reaction using reagent as the base.
 * 
 * @param container 
 * @param logger 
 * 
 * @return {null} 
 */
const LewisAcidReaction = (container, logger) => {
  try {
    Typecheck(
      { name: "container", value: container, type: "object" },
      { name: "container.getSubstrate()[0]", value: container.getSubstrate()[0], type: "object" },
      { name: "logger", value: logger, type: "object" }
    );

    // Get reagents that are not generic.
    const nonGenericReagents = container.reagents.filter((r) => {
      return typeof r !== 'string';
    });

    if (nonGenericReagents.length === 0) {
      // All reagents are generic.
      return false;
    }

    const reagent = FindStrongestLewisBaseMolecule(nonGenericReagents, logger);

    if (undefined === reagent) {
      // Can't use reagent as a Lewis Base
      return false;
    }

    const lewisBaseAtom = LewisBaseAtom(reagent);
    const lewisAcidAtom = LewisAcidAtom(container.getSubstrate()[0]);

    LewisAcidBaseReaction(container, container.getSubstrate()[0], reagent, lewisBaseAtom, lewisAcidAtom, logger);
  } catch (e) {
    console.log(e.stack);
    process.exit();
  }
};

module.exports = LewisAcidReaction;












