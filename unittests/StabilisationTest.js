
const logger = require('./logger')

const Prototypes = require("../Prototypes");
Prototypes()

const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const ChemReact = require('../actions/ChemReact')
const fetchAllPossibleReactions = require('../reflection/fetchAllPossibleReactions')
const determineMostLikelyNextReaction = require('../reflection/determineMostLikelyNextReaction')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')
const Stabilise = require('../actions/Stabilise')
const _ = require('lodash');

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


const methylamine = MoleculeFactory(
   AtomsFactory('CN', logger),
   false,
   false,
   logger
)

const water = MoleculeFactory(
   AtomsFactory('O', logger),
   false,
   false,
   logger
)

const molecule_with_water_leaving_group = MoleculeFactory(
  AtomsFactory('CCC([O+])C', logger),
  false,
  false,
  logger
)

const molecule_with_carbocation = MoleculeFactory(
  AtomsFactory('[C+]N', logger),
  false,
  false,
  logger
)



test('testing stabilisation', () => {

   const molecule_with_carbocation_stabilised = Stabilise(_.cloneDeep(molecule_with_carbocation), 0, logger)
   expect(molecule_with_carbocation_stabilised.canonicalSmiles).toBe('C=[N+]')

});


