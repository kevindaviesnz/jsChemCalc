
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')


test('testing molecule factory', () => {
    const atoms = AtomsFactory('O', logger)
    const water = MoleculeFactory(
      atoms,
      false,
      false,
      logger
   )
   expect(typeof water).toBe('object')

   const ammonia = MoleculeFactory(
      AtomsFactory('N', logger),
      false,
      false,
      logger
   )
    expect(typeof ammonia).toBe('object')

    const molecule_with_nitrogen = MoleculeFactory(
       AtomsFactory('CC[C+](N)C', logger),
       false,
       false,
       logger
    )


});
