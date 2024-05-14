
function ProductsOrReactantsFavoured(acid) {

    return (conjugate) => {

          // If we don't know the pKa of either the acid or the conjugate then
          // we return products favoured to prevent reversal.
          if (null === acid.pKa) {
             return 1 // Products favoured
          }
          if (null === conjugate.pKa) {
            return 0 // Reactants favoured
          }

          // Calculate the difference between the pKa values
          const pKaDifference = conjugate.pKa - acid.pKa;
          // Determine whether products or reactants are favoured
          if (pKaDifference > 0) {
            return 1; // Products are favoured
          } else if (pKaDifference < 0) {
            return -1; // Reactants are favoured
          } else {
            return 0
          }

    }

}

module.exports = ProductsOrReactantsFavoured;