const FunctionalGroups = require("./reflection/FunctionalGroups")
const pKa = (pka_atoms) => {
// https://sciencing.com/calculate-pka-values-2765.html
  // https://www.masterorganicchemistry.com/2010/06/18/know-your-pkas/
    const fg = FunctionalGroups(pka_atoms)
    const pKa_value = fg.functionalGroups.hydrochloric_acid.length > 0? -6.3
        :fg.functionalGroups.deprotonated_hydrochloric_acid.length > 0? 2.86
            :fg.functionalGroups.water.length > 0? 14
                :fg.functionalGroups.protonated_water.length > 0? -1.74
                    :fg.functionalGroups.ether.length >0?-3.5:12345
    return pKa_value

}
module.exports = pKa

