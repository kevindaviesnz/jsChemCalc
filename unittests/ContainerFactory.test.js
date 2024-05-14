
const logger = require('./logger')

const Prototypes = require("../Prototypes");
Prototypes()

const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')


test('testing container factory', () => {

  const container = ContainerFactory([], [], null, logger)
  const water = MoleculeFactory(
      AtomsFactory('O', logger),
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

  container.addReactant(water, 1, logger)
  container.addReactant(ammonia, 1, logger)

  expect(container.reactants[0][0].canonicalSmiles).toBe('O')
  expect(container.reactants[1][0].canonicalSmiles).toBe('N')


      

});