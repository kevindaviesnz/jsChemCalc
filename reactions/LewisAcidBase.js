
// Refactored using chatGPT
const Typecheck = require('../Typecheck');
const Constants = require('../Constants');
const _ = require('lodash');
const AtomsFactory = require('../factories/AtomsFactory');
const MoleculeFactory = require('../factories/MoleculeFactory');
const nucleophilicAttackOnSubstrate = require('../mechanisms/NucleophilicAttackOnSubstrate');
const nucleophilicAttackOnReagent = require('../mechanisms/NucleophilicAttackOnReagent');
const NucleophilicAttack = require('../mechanisms/NucleophilicAttack')
const LewisAcidAtom = require('../reflection/LewisAcidAtom');
const LewisBaseAtom = require('../reflection/LewisBaseAtom');
const ConjugateAcid = require('../reflection/ConjugateAcid')
const FindStrongestLewisBaseMolecule = require('../reflection/FindStrongestLewisBaseMolecule')
const FindStrongestLewisAcidMolecule = require('../reflection/FindStrongestLewisAcidMolecule')
const { S, B, P, C } = require('../factories/PeriodicTable');
const ENV = require('../env');
const colors = require('colors');
const DoLewisAcidBase = require('../AI/LewisAcidBase')

colors.enable();

// All reagents are treated as base molecules. If there are two or more lewis acid molecules that act as base or acid molecule we return false
const LewisAcidBase = (container, baseMolecule, acidMolecule) => {

    const baseAtom = LewisBaseAtom(baseMolecule[0])
    const acidAtom = LewisAcidAtom(acidMolecule[0])

    const acid_molecule_saved = _.cloneDeep(acidMolecule)
    const base_molecule_saved = _.cloneDeep(baseMolecule)


    // Note: This replaces the acid molecule with the combined molecule.
    const combinedMolecule = NucleophilicAttack(
        acidMolecule,
        acidAtom,
        baseMolecule,
        baseAtom
    )

    // Subtract one unit of base molecule
    base_molecule_saved[1] = base_molecule_saved[1] -1
    if (base_molecule_saved[1] === 0) {
        container.removeReactant(base_molecule_saved)
    }


    return combinedMolecule;

};

module.exports = LewisAcidBase;
