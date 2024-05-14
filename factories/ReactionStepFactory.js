/*

Initialised container

Params in: null
Params out: container object

[0] = molecules
 */

const _ = require('lodash')
const FormatAs = require('../factories/FormatAs')
const Typecheck = require('../Typecheck')

/*
const reaction_step = {
                                                'pathway': pathway_id,
                                                'mechanism': mechanism_name,
                                                'precursor_substrate_SMILES': precursor_canonicalSMILES,
                                                'chemical_substrate_SMILES': product_canonicalSMILES,
                                                'parent_substrate': parent_chemical,
                                                'child_substrate': child_chemical
                                            }
 */

const ReactionStepFactory = (substrate_SMILES, product_SMILES, mechanism) => {



    return {

    }


}

module.exports = ReactionStepFactory