const Stabilise = require("../actions/Stabilise")
const MoleculeFactory = require("../factories/MoleculeFactory")

/*

Example usage:

const reactant = "Acetic Acid";
const base = "Ammonia";
const reactantUnits = 2;
const baseUnits = 10;

const stoichiometricCoefficients = getStoichiometricCoefficients(reactant, base, reactantUnits, baseUnits);
console.log(stoichiometricCoefficients);
*/
const StoichiometricCoefficients = (reactant, base, reactantUnits, baseUnits, logger) => {

   try {

      // Define a dictionary to store the stoichiometric coefficients
      const coefficients = {}
      coefficients[reactant] = reactantUnits
      coefficients[base] = baseUnits
      coefficients['product1'] = 0 // You can add more products if needed
      coefficients['product2'] = 0 // Add more products as necessary

      // Ensure that the reaction is balanced based on the given coefficients
      if (coefficients.reactant === coefficients.base) {
         coefficients.product1 = coefficients.reactant;
         coefficients.product2 = coefficients.reactant;
      } else {
         throw new Error("The reaction is not balanced with the given coefficients.")
      }

      return [
         coefficients.reactantUnits,
         coefficients.baseUnits,
         coefficients.product1,
         coefficients.product2
      ];


   } catch(e) {
      logger.log('error', 'Resonance() '+e)
      console.log(e.stack)
      process.exit()
   }

}




module.exports = StoichiometricCoefficients

