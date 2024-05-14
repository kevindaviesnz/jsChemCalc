/*

Add solvent to container

Params in: container, solvent
Params out: container

A solvent is the component of a solution that is present in the greatest amount. It is the substance in which the solute is dissolved. Usually, a solvent is a liquid.
However, it can be a gas, solid, or supercritical fluid. The amount of solvent required to dissolve a solute depends on temperature and the presence of other substances in a sample.
 The word "solvent" comes from the Latin solvō, which means to loosen or untie.

 */
const Constants = require("../Constants")
const _ = require('lodash');
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const ReactionDecisionTree = require('../AI/ReactionDecisionTree')
const moleculesAreTheSame = require('../reflection/moleculesAreTheSame')

const AddSolventToContainer = (onAddSolventSuccess, container, solvent) =>{

    // Solvent is a molecule array
    Typecheck(
        {name:"container", value:container, type:"array"},
        {name:"solvent", value:solvent, type:"array"}
    )

    if(container[Constants().container_solvent_index] !== null) {
        container[Constants().container_solvent_index].should.be.an.Array()
    }

    container[Constants().container_solvent_index] = solvent

    onAddSolventSuccess(container, solvent)

    /*
    render("Adding solvent to container")


*/
    // ReactionDecisionTree(container)

}

module.exports = AddSolventToContainer