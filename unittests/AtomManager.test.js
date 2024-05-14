
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomFactory = require('../factories/AtomFactory')

// Atom manager should container no properties so that it is immutable.
const AtomManager = require('../managers/AtomManager')

test('testing removeElectron', () => {

    // (atomicSymbol, inititalCharge, index, ringbond, ringbond_type, molecule_id, logger
    const atom = AtomFactory('N',  0, 0, 0, '', 'm_abc', logger)
    const atomManager = new AtomManager()

    expect(atom.electronPairs.length).toBe(5)

    const new_atom = atomManager.removeElectron(null, null, _.cloneDeep(atom), atom.electrons()[0])
    expect(new_atom.electronPairs.length).toBe(4)

});

test('testing removeElectronPair', () => {

    // (atomicSymbol, inititalCharge, index, ringbond, ringbond_type, molecule_id, logger
    const atom = AtomFactory('N',  0, 0, 0, '', 'm_abc', logger)
    const atomManager = new AtomManager()

    expect(atom.electronPairs.length).toBe(5)

    const new_atom = atomManager.removeElectronPair(null, null, _.cloneDeep(atom), atom.electronPairs[0])
    expect(new_atom.electronPairs.length).toBe(4)

});

test('testing addElectronPair', () => {

    // (atomicSymbol, inititalCharge, index, ringbond, ringbond_type, molecule_id, logger
    const atom = AtomFactory('N',  0, 0, 0, '', 'm_abc', logger)
    const atomManager = new AtomManager()

    const new_atom = atomManager.addElectronPair(null, null, _.cloneDeep(atom), ['abc', '123'])
    expect(new_atom.electronPairs.length).toBe(6)


});
