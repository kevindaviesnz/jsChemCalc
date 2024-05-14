/*

Check if molecule is a solvent

A solvent is the component of a solution that is present in the greatest amount. It is the substance in which the solute is dissolved. Usually, a solvent is a liquid. However, it can be a gas,
solid, or supercritical fluid. The amount of solvent required to dissolve a solute depends on temperature and the presence of other substances in a sample. The word "solvent" comes
from the Latin solvō, which means to loosen or untie.

Params in: container, chemical name or SMILES
Params out: bool

 */
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const Constants = require('../Constants')

const isSolvent = (container, molecule) =>{

    Typecheck(
        {name:"container", value:container, type:"array"},
        {name:"molecule", value:molecule, type:"object"}
    )

    if(container[Constants().container_solvent_index] !== null) {
        container[Constants().container_solvent_index].should.be.an.Array()
    }

    // Nothing in the container
    if(container[Constants().container_molecules_index].length ===0) {
        return true
    }

    // Check for molecules in the container where the number of units is greater than the molecule we are adding.
    //  Second item in a molecule array is the number of units.
    const unit_index = Constants().units
    const container_molecules_index = Constants().container_molecules_index
    const c = container[container_molecules_index].filter((current_molecule)=>{
        return current_molecule[unit_index] > molecule[unit_index] // units
    })

    render("Checking if molecule is a solvent")
    return c.length === 0

}

module.exports = isSolvent