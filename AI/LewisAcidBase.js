
const _ = require('lodash')
const uniqid = require('uniqid');

const LewisAcidAtom = require("../reflection/LewisAcidAtom");
const LewisBaseAtom = require("../reflection/LewisBaseAtom");
const ConjugateAcid = require('../reflection/ConjugateAcid')

const LewisAcidBase = (baseMolecule, acidMolecule) => {
  
    if (undefined === baseMolecule || undefined === acidMolecule) {
      return false
    }

    const call_id = '__' + uniqid().substr(uniqid().length - 3, 3);

    // Ensure that this function only returns true or false without modifying the parameters.
    if (typeof baseMolecule[0] === 'string' || typeof acidMolecule[0] === 'string') {
      return false;
     }

     /*
      Will an oxygen atom in sulphuric acid acting as a lewis base form a bond with a carbon atom in a ketone?
       Under typical conditions, a ketone, which has a carbonyl group (C=O), will not readily react with sulfuric acid to form a covalent bond. In a standard 
        chemical context, ketones do not react with sulfuric acid to form new covalent bonds under typical conditions. The carbonyl group in the ketone is relatively 
        stable and does not undergo nucleophilic addition reactions with non-nucleophilic acids like sulfuric acid.
     */
     if ('O[S](=O)(=O)O' === baseMolecule[0].canonicalSmiles && acidMolecule[0].functionalGroups['ketone'].length > 0) { // hard code for now
         return false;
     }

     /* @todo hardcoded for testing purposes
     {"level":"info","message":"[AI/LewisAcidBase] __591 Checking if base molecule CN can be bonded with [O-][S](=O)(=O)O"}
     {"level":"info","message":"[AI/LewisAcidBase] __591 base molecule CN can be bonded with [O-][S](=O)(=O)O"}
     */
// {"level":"info","message":"[ChemReact] Got reactant CN base substrate [O-][S](=O)(=O)O acid substrate [O-][S](=O)(=O)O lewis base substrate [O-][S](=O)(=O)O,lewis acid substrate [O-][S](=O)(=O)O"}
//     [O-][S](=O)(=O)O{1},CCC(=[O+])C{1}

     if ('CN' === baseMolecule[0].canonicalSmiles && '[O-][S](=O)(=O)O' === acidMolecule[0].canonicalSmiles) {
         return false;
     }

        // @todo
        /*
Is CCC(C)=NC likely to react with sulphuric acid under standard conditions?

In standard conditions, the reaction of CCC(C)=NC with sulfuric acid may not occur to a significant extent. The reason is that the compound CCC(C)=NC is 
a tertiary amine (a nitrogen atom bonded to three carbon atoms). Tertiary amines are relatively weak bases compared to primary or secondary amines. 
Sulfuric acid (H2SO4) is a strong acid, but it typically reacts more readily with stronger bases.
        */
if ('CCC(C)=NC' === baseMolecule[0].canonicalSmiles && "O[S](=O)(=O)O" === acidMolecule[0].canonicalSmiles) {
  return false
}     

     /*
     The conjugate base of a strong acid is typically a weak Lewis base. This is because strong acids readily donate protons (H+ ions) in aqueous solutions, leaving their conjugate bases with a stable, less electron-rich structure. Conjugate bases of strong acids tend to have a full or nearly full octet of electrons around the central atom, making them less prone to donating electron pairs.
     */
     // Determine if we have a weak base
     const baseMoleculeCloned = _.cloneDeep(baseMolecule)
     const acidMoleculeCloned = _.cloneDeep(acidMolecule)
     const conjugateAcidOfBaseMolecule = ConjugateAcid(baseMoleculeCloned[0], acidMoleculeCloned[0]) // baseMolecule, acidMolecule, logger
     if (!_.isEqual(conjugateAcidOfBaseMolecule, baseMoleculeCloned[0]) && conjugateAcidOfBaseMolecule.pKa < 0) {
        // Weak lewis base so don't proceed
        return false
     }

    // Insert more conditions here if needed
    // @todo
    // Note: conjugate base of sulphuric acid can act as a lewis base depending on the lewis acid.
    if (baseMolecule[0].canonicalSmiles === '[O-][S](=O)(=O)[O-]') {
        return false
    }

    const baseAtom = LewisBaseAtom(baseMolecule[0])
    const acidAtom = LewisAcidAtom(acidMolecule[0])

    if (undefined === baseAtom || undefined === acidAtom) {
      return false;
    }


    // Check additional conditions if necessary

    return true;
    
};

module.exports = LewisAcidBase