
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

if (false){

    test('testing reductive amination (ChemReact)', ()=> {

        let container = ContainerFactory([], [], null, logger)

    // CCC(=[O+])C + [O-][S](=O)(=O)O + CN ---> CCC(O)(C)[N+]C, [O-][S](=O)(=O)O
    container = ContainerFactory([], [], null, logger)
    const m2 = MoleculeFactory(
        AtomsFactory('CCC(=[O+])C', logger),
        false,
        false,
        logger
        )
    container.addReactant(m2,1)
    const sulphuric_acid_ion2 = MoleculeFactory(
        AtomsFactory('[O-][S](=O)(=O)O', logger),
        false,
        false,
        logger
        )
        const sulphuric_acid_ion = MoleculeFactory(
            AtomsFactory('[O-][S](=O)(=O)O', logger),
            false,
            false,
            logger
            )
    container.addReactant(sulphuric_acid_ion, 1)
    const methylamine = MoleculeFactory(
        AtomsFactory('CN', logger),
        false,
        false,
        logger
        )
    container.addReactant(methylamine, 1)

    ChemReact(container, logger)
    expect(container.reactants[0][0].canonicalSmiles).toBe('CCC(O)(C)[N+]C')
    expect(container.reactants[1][0].canonicalSmiles).toBe('[O-][S](=O)(=O)O')

    // CCC(=O)C + OS(=O)(=O)O ---> CCC(=[O+])C,[O-][S](=O)(=O)O
    container = ContainerFactory([], [], null, logger)
    const ketone = MoleculeFactory(
        AtomsFactory('CCC(=O)C', logger),
        false,
        false,
        logger
        )
    container.addReactant(ketone, 1)
    const sulphuric_acid = MoleculeFactory(
        AtomsFactory('OS(=O)(=O)O', logger),
        false,
        false,
        logger
        )
    container.addReactant(sulphuric_acid, 1)
    ChemReact(container, logger)
    expect(container.reactants[0][0].canonicalSmiles).toBe('CCC(=[O+])C')
    expect(container.reactants[1][0].canonicalSmiles).toBe('[O-][S](=O)(=O)O')


    })
}
