
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')


test('testing bronsted lowery base atom', () => {

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

    const base_atom = BronstedLoweryBaseAtom(base_molecule, water, logger)

    expect(base_atom).toBe(undefined)

    //const will_protonate = AIProtonate(ammonia, water, logger)

});
