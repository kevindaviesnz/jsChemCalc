
const logger = require('./logger')
const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ConjugateAcid = require('../reflection/ConjugateAcid')


test('testing ai conjugate acid', () => {

    const ammonia = MoleculeFactory(
       AtomsFactory('N', logger),
       false,
       false,
       logger
    )
    const protonated_ammonia = ConjugateAcid(ammonia, null, logger)
    expect(protonated_ammonia.canonicalSmiles).toBe('[N+]')

   const deprotonated_sulphuric_acid = MoleculeFactory(
      AtomsFactory('[O-]S(=O)(=O)O', logger),
      false,
      false,
      logger
   )

   const protonated_deprotonated_sulphuric_acid = ConjugateAcid(deprotonated_sulphuric_acid, null, logger)
   expect(protonated_deprotonated_sulphuric_acid.canonicalSmiles).toBe('O[S](=O)(=O)O')

});
