
const logger = require('./logger')
const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ConjugateBase = require('../reflection/ConjugateBase')


test('testing ai conjugate base', () => {

  const acetic_acid = MoleculeFactory(
        AtomsFactory('CC(=O)O', logger),
        false,
        false,
        logger
   )
   const deprotonated_acetic_acid = ConjugateBase(acetic_acid, logger)
   expect(deprotonated_acetic_acid.canonicalSmiles).toBe('CC(=O)[O-]')

   const sulphuric_acid = MoleculeFactory(
      AtomsFactory('OS(=O)(=O)O', logger),
      false,
      false,
      logger
   )

   const deprotonated_sulphuric_acid = ConjugateBase(sulphuric_acid, logger)
   expect(deprotonated_sulphuric_acid.canonicalSmiles).toBe('[O-][S](=O)(=O)O')

});
