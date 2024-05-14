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
const lookupMolecule = require('../actions/LookupMolecule')
const PubChemLookup = require('../actions/LookupPubChem')
const MoleculeFactory = require('../factories/MoleculeFactory')
const addSolventToContainer = require('../actions/AddSolventToContainer')
const addSubstrateToContainer = require('../actions/AddSubstrateToContainer')
const addReagentToContainer = require('../actions/AddReagentToContainer')

const AddSubstanceToContainer = (onError, onAddSolventSuccess, db, container, chemical_name, units, tag) =>{


    Typecheck(
        {name:"container", value:container, type:"array"},
        {name:"chemical_name", value:chemical_name, type:"string"},
        {name:"tag", value:tag, type:"string"},
        {name:"onError", value:onError, type:"function"},
        {name:"onAddSolventSuccess", value:onAddSolventSuccess, type:"function"},
        {name:"db", value:db, type:"object"},
    )


    lookupMolecule(db, chemical_name, "IUPACName", logger, PubChemLookup).then(
        // "resolves" callback
        (chemical) => {

            const molecule = MoleculeFactory(
                chemical.atoms,
                logger
            )

            if (units === 'solvent') {
                addSolventToContainer(onAddSolventSuccess, container, molecule)
            } else {
                molecule[1] = units
                // Container is empty
                if (null === container[Constants().substrate_index]) {
                    // Substrate and solvent can be the same.
                    addSubstrateToContainer(container, molecule, units * 1)
                } else {
                    addReagentToContainer(container, molecule, units * 1)
                }
            }

        },
        // Error
        onError

    )
}

module.exports = AddSubstanceToContainer