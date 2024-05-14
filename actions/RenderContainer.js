
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const RenderMolecule = require('../actions/RenderMolecule')

const RenderContainer = (container) =>{

    Typecheck(
        {name:"container", value:container, type:"array"}
    )

    const substrate_molecule = container[Constants().container_substrate_index]=== null?"None":RenderMolecule(container[Constants().container_substrate_index])
    const solvent_molecule = container[Constants().container_solvent_index]=== null?"None":container[Constants().container_solvent_index]
    const reagent_molecule = container[Constants().container_reagent_index]=== null?"None":RenderMolecule(container[Constants().container_reagent_index])

    const molecules = container[Constants().container_molecules_index].map((molecule)=>{
        return RenderMolecule(molecule)
    })

    return "Substrate: " + substrate_molecule
    + "\nSolvent: " + solvent_molecule
    + "\nReagent: " + reagent_molecule
    +"\nMolecules: " + molecules

}

module.exports = RenderContainer