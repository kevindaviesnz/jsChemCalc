
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')


test('testing canonical smiles', () => {
    const atoms = AtomsFactory('O', logger)
    const water = MoleculeFactory(
      atoms,
      false,
      false,
      logger
   )
   
   expect(water.canonicalSmiles).toBe('O')

   const ammonia = MoleculeFactory(
      AtomsFactory('N', logger),
      false,
      false,
      logger
   )
   
    expect(ammonia.canonicalSmiles).toBe('N')

    const molecule_with_nitrogen = MoleculeFactory(
      AtomsFactory('CC[C+](N)C', logger),
      false,
      false,
      logger
   )

   expect(molecule_with_nitrogen.canonicalSmiles).toBe('CC[C+](N)C')

   

});
