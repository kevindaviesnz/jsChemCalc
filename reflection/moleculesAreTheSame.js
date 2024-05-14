
const Constants = require("../Constants")
const _ = require('lodash');
const Typecheck = require('../Typecheck')

/*

Make copies of both molecules and set the number of units
for each molecule to 0.
Then check if the molecules are equal.

 */

const moleculesAreTheSame = (first_molecule, second_molecule) =>{
    Typecheck(
        {name:"first_molecule", value:first_molecule, type:"array"},
        {name:"second_molecule", value:second_molecule, type:"array"},
    )
    const first_molecule_cloned = _.clone(first_molecule)
    const second_molecule_cloned = _.clone(second_molecule)
    const units_index = Constants().units
    second_molecule_cloned[units_index] = 0
    first_molecule_cloned[units_index] = 0
    return _.isEqual(second_molecule_cloned, first_molecule_cloned)
}

module.exports = moleculesAreTheSame