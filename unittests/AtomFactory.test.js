const logger = require('./logger')

const AtomFactory = require('../factories/AtomFactory')

test('testing atom factory', () => {

    expect(typeof logger).not.toBe('string')
    expect(typeof logger).not.toBe('number')
    expect(typeof logger).toBe('object')

    expect(typeof AtomFactory).not.toBe('object')
    expect(typeof AtomFactory).not.toBe('string')
    expect(typeof AtomFactory).not.toBe('number')
    expect(typeof AtomFactory).toBe('function')

    const atom = AtomFactory('O', 0, 0, 'm_id', logger)
    expect(typeof atom.atomicSymbol).not.toBe('number')
    expect(typeof atom.atomicSymbol).toBe('string')
    expect(atom.neutralAtomNumberOfBonds.toBe(0))
    expect(atom.electronegativity.toBe(0))
    expect(atom.atomSize.toBe(0))
    expect(atom.neutralAtomNumberOutershellElectronCount.toBe(0))
    expect(atom.electronsPerShell.toBe(0))
    expect(atom.electronsPairs.toBe(0))
    expect(atom.outershellMaxNumberOfElectrons.toBe(0))
    expect(atom.freeElectrons.toBe(0))
    expect(atom.bondCount.toBe(0))
    expect(atom.freeSlots).toBe(1)
    expect(atom.electronCount).toBe(1)
    expect(atom.electrons).toBe(1)

    expect(atom.atomicSymbol).toBe('O')
    


    
    const temp = ['a','b','c']
    expect(temp).toStrictEqual(['a','b','c']);




});