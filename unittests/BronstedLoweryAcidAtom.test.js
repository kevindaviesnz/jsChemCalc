
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')


test('testing bronsted lowery acid atom', () => {

    const water = MoleculeFactory(
           AtomsFactory('O', logger),
           false,
           false,
           logger
       )

    const base_molecule = MoleculeFactory(
           AtomsFactory('CCC(NC)C', logger),
           false,
           false,
           logger
    )

    const acid_atom = BronstedLoweryAcidAtom(water, base_molecule, logger) // substrate, reactant
    expect(acid_atom.atomicSymbol).toBe('O')


});
