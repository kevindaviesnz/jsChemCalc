/*

@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877

A Lowery base is a molecule or atom that donates an electron pair.

Acid Strength

The less stable the conjugate base the stronger the acid.
The more stable the conjugate base the weaker the acid.
The more positive the more acidic.
The more negative the more basic.
The more charge the more unstable.


When atoms are in the same period (row in the periodic table) we look at electronegativity. Atoms
increase in negativity as you along the right. Atoms that are electronegative want electrons (are more acidic as the
conjugate base formed is more stable).

When atoms are in the same group (column in the periodic table) we look at size. As you go down the period table the size
increases. Bigger atoms can spread the electronegativity better and therefore form a more stable conjugate base (are more
acidic).

*/

/*

GET atoms that can donate an electron pair.
Then sort by positive charge, then electronegativity, then size, ...

returns NULL if atom not found

*/

const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const BronstedLoweryAcidAtom = require('./BronstedLoweryAcidAtom')

const _ = require('lodash')

const FindStrongestBronstedLoweryAcidMolecule = (molecules, logger) => {
  try {
    Typecheck(
      { name: "molecules", value: molecules, type: "array" },
      { name: "logger", value: logger, type: "object" }
    );

    // Filter amines (amines rarely act as acids)
    // @todo

    // Look for 'A:' or 'CA:'
    // This represents any molecule that can donate a proton.
    const generic_acid_molecule = _.find(molecules, (molecule) => {
      return 'A:' === molecule[0] || 'CA:' === molecule[0];
    });

    if (generic_acid_molecule !== undefined) {
      return generic_acid_molecule; 
    }

    // Find molecules that have an atom that can donate a proton.
    // Note: Nearly all amines are bases.
    const acid_molecules = molecules.filter((molecule) => {
      return (
        molecule[0] === 'CB:' ||
        molecule[0].conjugateBase === true ||
        BronstedLoweryAcidAtom(molecule, logger) !== null ||
        molecule[0].functionalGroups(logger).amine.length !== 0
      );
    });

    if (acid_molecules.length === 0) {
      logger.log(
        'debug',
        '[FindStrongestBrownstedLoweryAcidMolecule] Could not find any acid molecules'.bgYellow
      );
      return null;
    }

    // Sort molecules by pKa
    const molecules_sorted_by_pKa = acid_molecules.sort((m1, m2) => {
      return m2[0].pKa - m1[0].pKa;
    });

    return molecules_sorted_by_pKa.pop();

    // @todo
    // const molecules_sorted_by_acidity = acid_molecules.sort((m1, m2) => {
    //   return m1.moleculePKA - m2.moleculePKA;
    // });

    // const strongest_bronsted_lowery_acid = molecules_sorted_by_acidity[0];

    // return strongest_bronsted_lowery_acid;
  } catch (e) {
    logger.log('error', `FindStrongestBronstedLoweryAcidMolecule() ${e}`);
    console.log(e.stack);
    process.exit();
  }
};

module.exports = FindStrongestBronstedLoweryAcidMolecule;
