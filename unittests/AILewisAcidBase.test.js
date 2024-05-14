
const logger = require('./logger')
const Prototypes = require("../Prototypes")
Prototypes()

const _ = require('lodash');

const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const AILewisAcidBase = require('../AI/LewisAcidBase')

test('testing ai lewis acid base', () => {

    const conjugate_base_of_sulphuric_acid = [
       MoleculeFactory(
           AtomsFactory('[O-][S](=O)(=O)[O-]', logger),
           false,
           false,
           logger
       ),
       1
    ]

    const protonated_ketone = [
       MoleculeFactory(
           AtomsFactory('CCC(=[O+])C', logger),
           false,
           false,
           logger
       ),
       1
    ]

    const methylamine = [
       MoleculeFactory(
           AtomsFactory('CN', logger),
           false,
           false,
           logger

       ),
       1
    ]

    const will_bond_with_methylamine = AILewisAcidBase(_.cloneDeep(methylamine), _.cloneDeep(protonated_ketone), logger)
    expect(will_bond_with_methylamine).toBe(true)

    // [O-][S](=O)(=O)[O-] should not bond with CCC(=[O+])C (
    const will_bond_with_deprotonated_ketone = AILewisAcidBase(_.cloneDeep(protonated_ketone), _.cloneDeep(conjugate_base_of_sulphuric_acid), logger)
    expect(will_bond_with_deprotonated_ketone).toBe(false)

    const will_bond_with_conjugate_base_of_sulphuric_acid = AILewisAcidBase(_.cloneDeep(conjugate_base_of_sulphuric_acid), _.cloneDeep(protonated_ketone), logger)
    expect(will_bond_with_conjugate_base_of_sulphuric_acid).toBe(false)



     /* @todo hardcoded for testing purposes
     {"level":"info","message":"[AI/LewisAcidBase] __591 Checking if base molecule CN can be bonded with [O-][S](=O)(=O)O"}
     {"level":"info","message":"[AI/LewisAcidBase] __591 base molecule CN can be bonded with [O-][S](=O)(=O)O"}
     */
    const deprotonated_sulphuric_aicd = [
       MoleculeFactory(
           AtomsFactory('[O-][S](=O)(=O)O', logger),
           false,
           false,
           logger
       ),
       1
    ]

    const will_bond_with_deprotonated_sulphuric_acid = AILewisAcidBase(_.cloneDeep(methylamine), _.cloneDeep(deprotonated_sulphuric_aicd), logger)
    expect(will_bond_with_deprotonated_sulphuric_acid).toBe(false)

});
