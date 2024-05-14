const Stabilise = require("../actions/Stabilise")
const MoleculeFactory = require("../factories/MoleculeFactory")

const Resonance = (container, molecule, location, logger) => {

   try {

      // Note: molecule and location atom should be passed in by value to prevent them from being modified.
      // Create array to hold the resonance structures
      const resonance_structures = []

      // @todo This needs to be revised.
      if (location.charge() > 0) {

         const double_bonded_carbon_bond = _.find(location.bonds(molecule.atoms), (b)=>{
            return 'C' === b.atom.atomicSymbol && b.bondType === "="
         })

         // Here we delocalise the positive charge by shifting it to the
         // carbon on the double bond and then shifting it to an adjacent
         // neutral atom through stablisation..
         if (undefined !== double_bonded_carbon_bond) {
            // Convert double bond to single bond. These should result in a carbocation.
            location.breakBond(double_bonded_carbon_bond.atom, molecule, logger)
            resonance_structures.push(
               MoleculeFactory(
                  molecule.atoms,
                  molecule.conjugateBase,
                  molecule.conjugateAcid,
                  logger
               )
            )
            const stablised = Stabilise(molecule)
            if (stablised) {
               resonance_structures.push(
                  MoleculeFactory(
                     molecule.atoms,
                     molecule.conjugateBase,
                     molecule.conjugateAcid,
                     logger
                  )
               )
            }
         } else  {

            const carbon_bond = _.find(location_atom.bonds(molecule.atoms), (b)=>{
               return b.atom.atomicSymbol === 'C' && b.bondType === ""
            })

            if (undefined !== carbon_bond) {
               // Here we delocalise by creating a positive charge on the carbon atom.
               const double_bond = _.find(location_atom.bonds(molecule.atoms), (b)=>{
                  return 'C' !== b.atom.atomicSymbol && b.bondType === "="
               })
               if (undefined !== double_bond) {
                  // This will result in a carbocation adjacent to positively charged location atom
                  double_bond.atom.breakBond(carbon_bond.atom, molecule.atoms, logger)
                  resonance_structures.push(
                     MoleculeFactory(
                        molecule.atoms,
                        molecule.conjugateBase,
                        molecule.conjugateAcid,
                        logger
                     )
                  )
               }
            }

         }

      }

   } catch(e) {
      logger.log('error', 'Resonance() '+e)
      console.log(e.stack)
      process.exit()
   }

}


module.exports = Resonance

