
const logger = require('./logger')

const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')

// Molecule manager should container no properties so that it is immutable.
const MoleculeManager = require('../managers/MoleculeManager')


const m = MoleculeFactory(
    AtomsFactory('[C+]N', logger),
     false,
     false,
     logger
)

test('testing fetchAtomThatCanAcceptAnElectronPair', () => {
    const moleculeManager = new MoleculeManager()
    const atom_that_can_accept_an_electron_pair = moleculeManager.fetchAtomThatCanAcceptAnElectronPair(m.atoms)
    expect(atom_that_can_accept_an_electron_pair.atomicSymbol).toBe('C')
})

test('testing fetchAtomsBondedToASpecificAtom', () => {
    const moleculeManager = new MoleculeManager()
    const atom = m.atoms[0]
    const atoms_bonded_to_a_specific_atom = moleculeManager.fetchAtomsBondedToASpecificAtom(m, atom, logger)
    expect(atoms_bonded_to_a_specific_atom.length).toBe(1)
})

test('testing fetchAtomsByElectrophilicity', () => {
    const moleculeManager = new MoleculeManager()
    const atoms_sorted_by_electrophilicity = moleculeManager.fetchAtomsByElectrophilicity(m.atoms.filter(atom=>atom.atomicSymbol !== 'H'))
    expect(atoms_sorted_by_electrophilicity[0].atomicSymbol).toBe('C')
})

test('addFreeElectronPairFromAtomToBondedTargetAtom', () => {
    const moleculeManager = new MoleculeManager()
    const target_atom = m.atoms.filter(a=>a.atomicSymbol !== 'H')[0]
    const source_atom = moleculeManager.addFreeElectronPairFromAtomToBondedTargetAtom(m, target_atom)
    expect(target_atom.freeSlots()).toBe(0)

})

test('testing addDativeBondBetweenBondedAtoms', () => {
    const m2 = MoleculeFactory(
        AtomsFactory('[C+]N', logger),
        false,
        false,
        logger
    )
    const moleculeManager = new MoleculeManager()
    const container = null
    const new_molecule = moleculeManager.addDativeBondBetweenBondedAtoms(container, _.cloneDeep(m2), logger)
    expect(new_molecule.canonicalSmiles).toBe('C=[N+]')

});

