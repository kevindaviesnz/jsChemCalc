
const logger = require('./logger')
const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const ContainerFactory = require('../factories/ContainerFactory')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBase')
const AIBronstedLoweryAcidBase = require('../AI/BronstedLoweryAcidBase')

test('testing bronsted lowery acid base', () => {

    // Note at this point we have determined that protonation/deprotonation will occur.
    let container = ContainerFactory([], [], null, logger)
    const acetic_acid = MoleculeFactory(
        AtomsFactory('CC(=O)O', logger),
        false,
        false,
        logger
    )

    const deprotonated_acetic_acid = MoleculeFactory(
        AtomsFactory('CC(=O)[O-]', logger),
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

    const protonated_ammonia = MoleculeFactory(
        AtomsFactory('[N+]', logger),
        false,
        false,
        logger
    )

    container.addReactant(acetic_acid, 1, logger)
    container.addReactant(ammonia, 1, logger)

    // Do bronsted lowery acid base reaction, passing the base molecule (ammonia) from the container and the acid molecule (acetic acid) from the container.
    const ammonia_in_container = container.findMatchingReactant(ammonia, logger)
    const acetic_acid_in_container = container.findMatchingReactant(acetic_acid, logger)

    // Note: All the ammonia and acetic acid is consumed.
    // Equilibrium constant = 30199.51720402019
    BronstedLoweryAcidBase(container, ammonia_in_container, acetic_acid_in_container, logger)
    expect(container.reactants[0][0].canonicalSmiles).toBe('[N+]')
    expect(container.reactants[0][1]).toBe(1)
    expect(container.reactants[1][0].canonicalSmiles).toBe('CC(=O)[O-]')
    expect(container.reactants[1][1]).toBe(1)
    expect(container.reactants.reduce((carry, current)=>{
       return carry + current[1]
    }, 0)).toBe(2)

    // Add two more units of ammonia
    container.addReactant(ammonia, 2, logger)
    BronstedLoweryAcidBase(container, ammonia_in_container, acetic_acid_in_container, logger)
    expect(container.reactants[0][0].canonicalSmiles).toBe('[N+]')
    expect(container.reactants[0][1]).toBe(1)
    expect(container.reactants[1][0].canonicalSmiles).toBe('CC(=O)[O-]')
    expect(container.reactants[1][1]).toBe(1)
    expect(container.reactants[2][0].canonicalSmiles).toBe('N')
    expect(container.reactants[2][1]).toBe(2)
    expect(container.reactants.reduce((carry, current)=>{
       return carry + current[1]
    }, 0)).toBe(4) // Ammonia should not react with the conjugate acid or conjugate base.

    // Reversal
    // Add 1 units of deprotonated acetic acid
    container = ContainerFactory([], [], null, logger)
    container.addReactant(deprotonated_acetic_acid, 1, logger)
    container.addReactant(protonated_ammonia, 1, logger)
    const deprotonated_acetic_acid_in_container = container.findMatchingReactant(deprotonated_acetic_acid, logger)
    const protonated_ammonia_in_container = container.findMatchingReactant(protonated_ammonia, logger)
    BronstedLoweryAcidBase(container, deprotonated_acetic_acid_in_container, protonated_ammonia_in_container, logger)
    //console.log(container.reactants)
    expect(container.reactants[0][0].canonicalSmiles).toBe('CC(=O)[O-]')
    expect(container.reactants[0][1]).toBe(1)
    expect(container.reactants[1][0].canonicalSmiles).toBe('[N+]')
    expect(container.reactants[1][1]).toBe(1)
    //expect(container.reactants[2][0].canonicalSmiles).toBe('CC(=O)O')
    //expect(container.reactants[2][1]).toBe(0)
   // expect(container.reactants[3][0].canonicalSmiles).toBe('N')
   // expect(container.reactants[3][1]).toBe(0)

    // deprotonation of [N+] by deprotonated sulphuric acid
    container = ContainerFactory([], [], null, logger)
    const protonated_nitrogen = MoleculeFactory(
          AtomsFactory('CCCC(=[N+])C', logger),
          false,
          false,
          logger
      )

    const deprotonated_sulphuric_acid = MoleculeFactory(
          AtomsFactory('[O-]S(=O)(=O)O', logger),
          false,
          false,
          logger
    )

    container.addReactant(protonated_nitrogen, 1, logger)
    container.addReactant(deprotonated_sulphuric_acid, 1, logger)

    const protonated_nitrogen_in_container = container.findMatchingReactant(protonated_nitrogen, logger)
    const deprotonated_sulphuric_acid_in_container = container.findMatchingReactant(deprotonated_sulphuric_acid, logger)

//    ok = AIBronstedLoweryAcidBase([deprotonated_sulphuric_acid,1], [protonated_nitrogen,1], logger)
//    console.log('Ok')
//    console.log(ok)
    BronstedLoweryAcidBase(container, deprotonated_sulphuric_acid_in_container, protonated_nitrogen_in_container, logger)
//    console.log(container.reactants)

    expect(container.reactants[0][0].canonicalSmiles).toBe('O[S](=O)(=O)O')
    expect(container.reactants[1][0].canonicalSmiles).toBe('CCCC(=N)C')




});
