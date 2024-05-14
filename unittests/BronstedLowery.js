
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


// ChemReact(container, logger)
test('testing vinegar + ammonia', ()=> {

   const container = ContainerFactory([], [], null, logger)
   container.addReactant(acetic_acid, 1)
   container.addReactant(ammonia, 1)

   ChemReact(container, logger)

   expect(container.reactants[0][0].canonicalSmiles).toBe('[N+]')
   expect(container.reactants[1][0].canonicalSmiles).toBe('CC(=O)[O-]')

})


 test('testing reductive amination', ()=> {

    let container = ContainerFactory([], [], null, logger)

    // Work backwards
    // CCC(O)(C)[N+]C + [O-][S](=O)(=O)O + O ---> O, O[S](=O)(=O), CCC(C)=NC
    const m1 = MoleculeFactory(
       AtomsFactory('CCC(O)(C)[N+]C', logger),
       false,
       false,
       logger
       )
    container.addReactant(m1,1)
    const sulphuric_acid_ion = MoleculeFactory(
       AtomsFactory('[O-][S](=O)(=O)O', logger),
       false,
       false,
       logger
       )
    container.addReactant(sulphuric_acid_ion, 1)
    const water = MoleculeFactory(
       AtomsFactory('O', logger),
       false,
       false,
       logger
       )
    container.addReactant(water, 1)
    ChemReact(container, logger)

    expect(container.reactants[0][0].canonicalSmiles).toBe('O')
    expect(container.reactants[1][0].canonicalSmiles).toBe('O[S](=O)(=O)O')
    expect(container.reactants[2][0].canonicalSmiles).toBe('CCC(C)=NC')

 })