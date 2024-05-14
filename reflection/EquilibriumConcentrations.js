
// Example usage:
 /*
 const Keq = 30199.51720402019;
 const initialConcentrationHA = 1;
 const initialConcentrationB = 2; // Different initial concentration for B (ammonia)
 
 const equilibriumConcentrations = calculateEquilibriumConcentrations(Keq, initialConcentrationHA, initialConcentrationB);
 
 if (equilibriumConcentrations) {
   console.log("Concentration of HA at equilibrium:", equilibriumConcentrations.HA);
   console.log("Concentration of B at equilibrium:", equilibriumConcentrations.B);
   console.log("Concentration of A- at equilibrium:", equilibriumConcentrations.AMinus);
   console.log("Concentration of HB+ at equilibrium:", equilibriumConcentrations.HBPlus);
 }
 */

function EquilibriumConcentrations(products_preferred, initialAcid, initialBase, Keq, logger) {
   try {

      // Given the reaction:
      // CH3COOH (acetic acid) + NH3 (ammonia) ⇌ CH3COO- (conjugate base of acetic acid) + NH4+ (conjugate acid of ammonia)

      // Initial concentrations:
      //const initialAcid = 1; // [HA] (acetic acid) = 1 unit//
      //const initialBase = 1;   // [B] (ammonia) = 1 unit


      // Let x represent the change in concentration of both acetic acid and ammonia at equilibrium:
      const x = products_preferred?Math.sqrt(Keq):Math.sqrt(1/Keq);

      // [HA]eq = 1 - x
      const HAeq = initialAcid - x;
      // [B]eq = 1 - x
      const Beq = initialBase - x;
      // [A-]eq = x
      const CBeq = x;
      // [HB+]eq = x
      const CAeq = x;

      // Now, we can use the equilibrium constant expression:
      // K_eq = ([A-]eq * [HB+]eq) / ([HA]eq * [B]eq)
      const calculatedK_eq = (CBeq * CAeq) / (HAeq * Beq);

      // To solve for x, we can rearrange and simplify the equation:
      // 30,000 * (1 - x) * (1 - x) = x * x
      // 30,000 * (1 - x)² = x²

      // Solving the quadratic equation for x:
      // a = 30,000
      const a = 30000;
      // b = -60,000
      const b = -2 * a;
      // c = 30,000
      const c = a;

      // Using the quadratic formula:
      const discriminant = Math.sqrt(b * b - 4 * a * c);
      const x1 = (-b + discriminant) / (2 * a);
      const x2 = (-b - discriminant) / (2 * a);

      // Choose the positive root (x1) since x represents a concentration (must be positive)
      const xValue = x1;

      // So, at equilibrium:

      // Concentration of acetic acid ([HA]eq)
      const HAeqValue = initialAcid - xValue;

      // Concentration of ammonia ([B]eq)
      const BeqValue = initialBase - xValue;

      // Concentration of the conjugate base of acetic acid ([A-]eq)
      const CBeqValue = xValue;

      // Concentration of the conjugate acid of ammonia ([HB+]eq)
      const CAeqValue = xValue;

      // Output the results
      /*
      console.log("At equilibrium:");
      console.log("Concentration of acetic acid ([HA]eq) ≈ " + HAeqValue + " units");
      console.log("Concentration of ammonia ([B]eq) ≈ " + BeqValue + " units");
      console.log("Concentration of the conjugate base of acetic acid ([A-]eq) ≈ " + CBeqValue + " units");
      console.log("Concentration of the conjugate acid of ammonia ([HB+]eq) ≈ " + CAeqValue + " units");
      */
      // @todo
if (products_preferred) {
      return {
         HA: HAeqValue,
         B:BeqValue,
         CB: CBeqValue,
         CA: CAeqValue
      }

} else {
      return {
         CB: HAeqValue,
         CA:BeqValue,
         HA: CBeqValue,
         B: CAeqValue
      }

}



   } catch (e) {
      // Handle any errors here
      logger.log('error', ('[EquilibriumConcentrations] '+e).bgRed)
      console.error(e.stack)
      process.exit(0, `[EquilibriumConcentrations] ${e}`);     
   }
 }

 
 
 module.exports = EquilibriumConcentrations

/*
Alternative
// Function to calculate equilibrium concentrations when products are favored
const calculateEquilibriumConcentrations = (initialAceticAcid, initialAmmonia, equilibriumConstant) => {
    try {
        // Calculate the change in concentration (x) using the quadratic equation
        const a = equilibriumConstant;
        const b = -2 * equilibriumConstant;
        const c = equilibriumConstant;

        // Use the quadratic formula to solve for x
        const discriminant = Math.sqrt(b * b - 4 * a * c);
        const x1 = (-b + discriminant) / (2 * a);
        const x2 = (-b - discriminant) / (2 * a);

        // Choose the positive root (x1) since x represents a concentration (must be positive)
        const x = x1;

        // Calculate equilibrium concentrations
        const aceticAcidEquilibrium = initialAceticAcid * (1 - x);
        const ammoniaEquilibrium = initialAmmonia * (1 - x);
        const conjugateBaseEquilibrium = initialAceticAcid * x;
        const conjugateAcidEquilibrium = initialAmmonia * x;

        // Return the equilibrium concentrations
        return {
            aceticAcidEquilibrium,
            ammoniaEquilibrium,
            conjugateBaseEquilibrium,
            conjugateAcidEquilibrium,
        };
    } catch (e) {
        // Handle any errors
        console.error("Error calculating equilibrium concentrations:", e);
        return null;
    }
};

// Example usage:
const initialAceticAcid = 1; // Initial concentration of acetic acid
const initialAmmonia = 1;   // Initial concentration of ammonia
const equilibriumConstant = 30000; // Equilibrium constant (products favored)

// Calculate equilibrium concentrations
const equilibriumConcentrations = calculateEquilibriumConcentrations(initialAceticAcid, initialAmmonia, equilibriumConstant);

console.log("Equilibrium Concentrations:");
console.log("Acetic Acid: " + equilibriumConcentrations.aceticAcidEquilibrium);
console.log("Ammonia: " + equilibriumConcentrations.ammoniaEquilibrium);
console.log("Conjugate Base of Acetic Acid: " + equilibriumConcentrations.conjugateBaseEquilibrium);
console.log("Conjugate Acid of Ammonia: " + equilibriumConcentrations.conjugateAcidEquilibrium);
*/
