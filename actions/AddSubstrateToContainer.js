/*

Add substrate to container

Params in: container, substrate
Params out: container

In chemistry, you can define substrate broadly as the medium in which your chemical reaction takes place. It's a bit more than this, however; the substrate is also typically the reactant
of your chemical reaction, meaning that it is the chemical component that is actually acted upon and changed into something else by the reaction. At the end of the reaction, the original
substrate reactant will no longer have the same chemical makeup.


 */
const Constants = require("../Constants")
const _ = require('lodash');
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const moleculesAreTheSame = require('../reflection/moleculesAreTheSame')
const ReactionDecisionTree = require('../AI/ReactionDecisionTree')
const findLeavingGroupAtom = require('../reflection/findLeavingGroupAtom')

const AddSubstrateToContainer = (onAddSubstrateSuccess, container, substrate, units) =>{

    Typecheck(
        {name:"container", value:container, type:"array"},
        {name:"substrate", value:substrate, type:"array"},
        {name:"units", value:units, type:"number"},
    )
    substrate[Constants().units] = units
    if (null !== container[Constants().container_substrate_index] && moleculesAreTheSame(container[Constants().container_substrate_index], substrate)){
        container[Constants().container_substrate_index][Constants().units] += units
    } else {
        substrate[Constants().units] = units
        container[Constants().container_substrate_index] = substrate
    }



    onAddSubstrateSuccess(container, substrate)

    /*
    render("Adding substrate to container")

    ReactionDecisionTree(container)

     */
}

module.exports = AddSubstrateToContainer