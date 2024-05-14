const Stabilise = require("../actions/Stabilise")
const MoleculeFactory = require("../factories/MoleculeFactory")

/*

Example usage:

const KaEthanol = calculateKaFrompKa(ethanol);
console.log(`The acid dissociation constant (Ka) for ethanol is ${KaEthanol.toFixed(5)}`);

*/
const AcidDiassociationConstant = (molecule, logger) => {

   try {
      return Math.pow(10, -pKa);
   } catch(e) {
      logger.log('error', 'AcidDisassociationConstant() '+e)
      console.log(e.stack)
      process.exit()
   }

}


module.exports = AcidDiassociationConstant

