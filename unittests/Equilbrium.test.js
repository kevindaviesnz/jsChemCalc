
const logger = require('./logger')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ConjugateBase = require('../reflection/ConjugateBase')
const EquilibriumConstant = require('../reflection/EquilibriumConstant')
const ProductsOrReactantsFavoured = require('../reflection/ProductsOrReactantsFavoured')
const EquilibriumConcentrations = require('../reflection/EquilibriumConcentrations')

const Prototypes = require("../Prototypes");

Prototypes()


test('testing equilibrium constant', () => {

  const acetic_acid = MoleculeFactory(
    AtomsFactory('CC(=O)O', logger),
    false,
    false,
    logger
)

   const ammonia = MoleculeFactory(
     AtomsFactory('N', logger),
     false,
     false,
     logger
  )

   const conjugate_acid_of_ammonia = MoleculeFactory(
     AtomsFactory('[N+]', logger),
     false,
     false,
     logger
  )

  const deprotonated_acetic_acid = ConjugateBase(acetic_acid, logger)
  acetic_acid.pKa = 4.76
  conjugate_acid_of_ammonia.pKa = 9.24
  let equilibrium_constant = EquilibriumConstant(acetic_acid, conjugate_acid_of_ammonia, 1, 1,  logger)

  expect(equilibrium_constant).toBe(30199.51720402019)

  const protonated_nitrogen = MoleculeFactory(
      AtomsFactory('CCCC(=[N+])C', logger),
      false,
      false,
      logger
  )

  const deprotonated_sulphuric_acid = MoleculeFactory(
      AtomsFactory('[O-]S(=O)(=O)O', logger),
      false,
      false,
      logger
  )

  equilibrium_constant = EquilibriumConstant(protonated_nitrogen, deprotonated_sulphuric_acid, 1, 1,  logger)
  expect(equilibrium_constant).toBe(9999999)

});


test('testing equilibrium concentrations', () =>{




})



test('testing products favoured', () =>{

  const ammonia = MoleculeFactory(
    AtomsFactory('N', logger),
    false,
    false,
    logger
 )

 const acetic_acid = MoleculeFactory(
     AtomsFactory('CC(=O)O', logger),
     false,
     false,
     logger
 )

acetic_acid.pKa = 4.76
ammonia.pKa = 9.24
let products_favoured = ProductsOrReactantsFavoured(acetic_acid)(ammonia.pKa) === 1
expect(products_favoured).toBe(false)

const sulphuric_acid = MoleculeFactory(
  AtomsFactory('OS(=O)(=O)O', logger),
  false,
  false,
  logger
)

const protonated_nitrogen = MoleculeFactory(
  AtomsFactory('CCCC(=[N+])C', logger),
  false,
  false,
  logger
)
products_favoured = ProductsOrReactantsFavoured(protonated_nitrogen)(sulphuric_acid) === 1
expect(products_favoured).toBe(true)

})

