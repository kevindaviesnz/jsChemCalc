
const logger = require('./logger')
const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const AIBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase')

test('testing ai bronsted lower acid base', () => {

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

    let ok = AIBronstedLoweryAcidBase([ammonia,1], [acetic_acid,1], logger)
    expect(ok).not.toBe(false)

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

  
  ok = AIBronstedLoweryAcidBase([deprotonated_sulphuric_acid,1], [protonated_nitrogen,1], logger)  
  expect(ok).not.toBe(false)




});
