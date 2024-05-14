
const Constants = require("../Constants")
const Typecheck = require("../Typecheck")
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const deprotonate = require('../actions/Deprotonate')
const ContainerView = require('../view/Container')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const _ = require('lodash');
const { C } = require("../factories/PeriodicTable")
const MoleculeFactory = require("../factories/MoleculeFactory")
const AtomsFactory = require("../factories/AtomsFactory")
const ConjugateAcid = require("../reflection/ConjugateAcid")
const ConjugateBase = require("../reflection/ConjugateBase")
const EquilibriumConstant = require("../reflection/EquilibriumConstant")
const ProductsOrReactantsFavoured = require("../reflection/ProductsOrReactantsFavoured")
const EquilibriumConcentrations = require('../reflection/EquilibriumConcentrations')
const Protonate = require('../AI/Protonate')
const Deprotonate = require('../AI/Deprotonate')


const BronstedLoweryAcidBase = (base_molecule, acid_molecule) => {

        if (base_molecule[1] === 0 || acid_molecule[1] === 0) {
            return false
        }

        if ('CB:' === acid_molecule[0] || 'B:' === acid_molecule[0]) {
            return false
        }

        // Here we test if the base molecule can be protonated
        if ('CB:' !== base_molecule[0] && 'B:' !== base_molecule[0] && false === Protonate(_.cloneDeep(base_molecule), _.cloneDeep(acid_molecule))) {
            return false
        }

        // Here we test if the acid molecule can be deprotonated
        if ('CA:' !== acid_molecule[0] && 'A:' !== acid_molecule[0] && false === Deprotonate(_.cloneDeep(acid_molecule), _.cloneDeep(base_molecule))) {
            return false
        }

        // @todo
        /*
Is CCC(C)=NC likely to react with sulphuric acid under standard conditions?

In standard conditions, the reaction of CCC(C)=NC with sulfuric acid may not occur to a significant extent. The reason is that the compound CCC(C)=NC is 
a tertiary amine (a nitrogen atom bonded to three carbon atoms). Tertiary amines are relatively weak bases compared to primary or secondary amines. 
Sulfuric acid (H2SO4) is a strong acid, but it typically reacts more readily with stronger bases.
        */
if ('CCC(C)=NC' === base_molecule[0].canonicalSmiles && "O[S](=O)(=O)O" === acid_molecule[0].canonicalSmiles) {
    return false
}
        
        const base_molecule_protonated = typeof base_molecule === "string"?"CA":ConjugateAcid(_.cloneDeep(base_molecule[0]), null);
        const acid_molecule_deprotonated = typeof acid_molecule === "string"? "CB:":ConjugateBase(_.cloneDeep(acid_molecule[0]));

        if (false === base_molecule_protonated || false === acid_molecule_deprotonated) {
            return false
        }


}


module.exports = BronstedLoweryAcidBase
