
/*
# Example usage:

// Acid
const acetic_acid = MoleculeFactory(
    AtomsFactory('CC(=O)O', logger),
    false,
    false
)

// Base
const ammonia = MoleculeFactory(
    AtomsFactory('N', logger),
    false,
    false
)

const conjugate_acid_of_ammonia = ConjugateAcid(ammonia, logger)
const conjugate_base_of_acetic_aicd = ConjugateBase(acetic_acid, logger)
const equilibrium_constant = EquilibriumConstant(acetic_acid, conjugate_acid_of_ammonia, logger)
const proceed_with_reaction = false
const random_number = MATH.rand(0, equilibrium_constant)
if ((acetic_acid.pKa > conjugate_base_of_acetic_acid.pKa && ammonia.pKa > conjugate_acid_of_ammonia && random_number !=== equilibrium_constant)
   || (acetic_acid.pKa < conjugate_base_of_acetic_acid.pKa && ammonia.pKa < conjugate_acid_of_ammonia && random_number === equilibrium_constant)) {
    proceed_with_reaction = true
}

Notes:
Organic Chemistry p181
Following Steps 1 through 3, we have pKeq 5 4.76 2 9.24 5 24.48, so Keq 5 3.0 3 104. Because we know that
acid-base reactions are favored when the stronger acid reacts with the stronger base to give the weaker acid
and the weaker base, we can conclude that the equilibrium for the reaction between acetic acid and ammonia lies
to the right. Using the mathematical approach just developed, we can calculate that the preference to the right
is 3.0 3 104. This means that if we started with equal amounts of acetic acid and ammonia, the reaction
would prefer the products 30,000 to 1.

*/

const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')

const EquilibriumConstant = (acid_molecule, conjugate_acid_molecule, acid_amount, conjugate_acid_amount, logger) => {
    try {

        // Workaround for when we have a molecule with null pKa
        if (null === acid_molecule.pKa) {
            // Look for donor atom in acid molecule
            const acid_atom = BronstedLoweryAcidAtom(acid_molecule, null, logger)
            if (1 === acid_atom.charge(acid_molecule.atoms, logger)) {
                return 9999999
            }  else {
                return -999999
            }
            // If donor atom has a positive charge then return 9999999 (reactants will be consumed).
            // If donor atom has a neutral charge then return -9999999 (products will be consumed).
            // Example:

        }
    
        /*
        if (null === acid_molecule_pKa || null === conjugate_acid_molecule_pKa) {
            // return a high value so that the reactants will be consumed
            // preventing a reverse reaction.
            return 99999999
        }
        */
        // Step 1: Look up pKa values of the acid and conjugate acid
        // Step 2: Subtract pKa of the conjugate acid from pKa of the acid
        const pKeq = acid_molecule.pKa - conjugate_acid_molecule.pKa;

        // Step 3: Calculate Keq by taking the antilog of -pKeq
        const Keq = Math.pow(10, -pKeq);

        // Adjust Keq based on the amounts of acid and conjugate acid
        const adjusted_Keq = Keq * Math.pow(conjugate_acid_amount, -1) * Math.pow(acid_amount, 1);

        return adjusted_Keq;

    } catch (e) {
        logger.log('error', ('[EquilibriumConstant] ' + e.stack).red);
        console.log(e.stack);
        process.exit(0, '[EquilibriumConstant] ' + e.stack);
    }
};

module.exports = EquilibriumConstant;

