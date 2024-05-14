
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')


test('testing atoms factory', () => {
    const atoms = AtomsFactory('O', logger)
    expect(typeof atoms).toBe('object')
    expect(atoms.length).toEqual(3)
});