
const logger = require('./logger')

const Prototypes = require("../Prototypes");
Prototypes()

const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const ContainerManager = require('../managers/ContainerManager')
const ChemReact = require('../actions/ChemReact')
const fetchAllPossibleReactions = require('../reflection/fetchAllPossibleReactions')
const determineMostLikelyNextReaction = require('../reflection/determineMostLikelyNextReaction')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')
const Stabilise = require('../actions/Stabilise')
const _ = require('lodash');


test('testing pinacol + generic acid (akyl shift', ()=> {

   const pinacol = MoleculeFactory(AtomsFactory('CC(C)(C(C)(C)O)O'))
   const generic_acid = 'A:'
   
   const container = ContainerFactory()

   container.addReactant(pinacol, 1)
   container.addReactant(generic_acid, 1)

   ChemReact(container)

   expect(container.reactants[0][0].canonicalSmiles).toBe('O')
   expect(container.reactants[1][0].canonicalSmiles).toBe('CC(C(C)=[O+])(C)C')
   expect(container.reactants[2][0]).toBe('CB:')


})

test('testing pinacol + sulphuric acid (akyl shift', ()=> {

   const pinacol = MoleculeFactory(AtomsFactory('CC(C)(C(C)(C)O)O'))
   const sulphuric_acid = MoleculeFactory(AtomsFactory('OS(=O)(=O)O'))
   
   const container = ContainerFactory()

   container.addReactant(pinacol, 1)
   container.addReactant(sulphuric_acid, 1)

   ChemReact(container)

   expect(container.reactants[0][0].canonicalSmiles).toBe('O')
   expect(container.reactants[1][0].canonicalSmiles).toBe('CC(C(C)=[O+])(C)C')
   expect(container.reactants[2][0].canonicalSmiles).toBe('[O-][S](=O)(=O)O')


})


 