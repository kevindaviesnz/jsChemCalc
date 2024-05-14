/*

Add reagent to container

Params in: container, reagent
Params out: container

 */
const Constants = require("../Constants")
const _ = require('lodash');
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const ReactionDecisionTree = require('../AI/ReactionDecisionTree')
const moleculesAreTheSame = require('../reflection/moleculesAreTheSame')

const AddReagentToContainer = (onAddReagentSuccess, container, reagent) =>{

    // Solvent is a molecule array
    Typecheck(
        {name:"container", value:container, type:"array"},
        {name:"onAddReagentSuccess", value:onAddReagentSuccess, type:"function"},

    )

    const container_reagent_index = Constants().container_reagent_index
    const unit_index = Constants().units

    if(container[container_reagent_index] !== null) {
        container[container_reagent_index].should.be.an.Array()
    }

    render("Adding reagent to container")

    container[Constants().container_reagent_index] = reagent

    onAddReagentSuccess(container, reagent)
    /*
    if (null !== container[container_reagent_index]  && moleculesAreTheSame(container[container_reagent_index], reagent)) {
        // Add number of units
        process.error()
        container[container_reagent_index][unit_index] += reagent[unit_index]
    } else {
        container[container_reagent_index] = reagent
        container[Constants().container_molecules_index].push(reagent)
    }

    ReactionDecisionTree(container)

     */

}

module.exports = AddReagentToContainer