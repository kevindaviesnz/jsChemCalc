const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('./Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('./Hydrate')
const ExtractAtomGroup = require('../actions/ExtractAtomGroup')

const OneTwoAdditionReverse = function(
        container, 
        container_before_previous_mechanism_was_applied, 
        max_steps, 
        synth, 
        pathway_id, 
        logger, 
        last_action, 
        db, 
        onPathwayEndedCallback,
        dbCallback
    ) {


    try {
        throw new Error('Not implemented correctly')
    } catch(e) {
        // @see https://www.differencebetween.com/what-is-the-difference-between-1-2-addition-and-1-4-addition/
        console.log(e)
        process.exit()
    }
    
    Typecheck(
        {name: "container", value: container, type: "object"},
        {name: "container_before_previous_mechanism_was_applied", value: container_before_previous_mechanism_was_applied, type: "object"},
        {name: "last_action", value: last_action, type: "function"},
        {name: "pathway_id", value: pathway_id, type: "string"},
        {name: "onPathwayEndedCallback", value: onPathwayEndedCallback, type: "function"},
        {name: "logger", value: logger, type: "object"},
        {name: "db", value: db, type: "object"}
    )
    
    const pathways = []
    
    const onSuccess = (container_after_previous_mechanism_was_applied, container_before_previous_mechanism_was_applied, reason) => {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "container_before_previous_mechanism_was_applied", value: container_before_previous_mechanism_was_applied, type: "object"},
            {name: "reason", value: reason, type: 'string'}
        )
        const container_before_previous_mechanism_was_applied_SMILES = container_before_previous_mechanism_was_applied === null?'':FormatAs(container_before_previous_mechanism_was_applied.substrate).SMILES(logger)
        //logger.log('verbose', '1,2 addition - pathway ended for ' + FormatAs(container.getSubstrate()[0]).SMILES(logger) + '. Reason:  ' +reason + ' ' + pathway_id + ' (resolved)')
     //   logger.log('verbose', '1,2 addition ' +  FormatAs(container_after_previous_mechanism_was_applied.substrate).SMILES(logger) + ' -> ' + container_before_previous_mechanism_was_applied_SMILES + ' ' + pathway_id + ' ' + max_steps + ' ' +reason)
        return container
    }

    //   Reverse(container, max_steps, 'Reverse reduce', OneTwoAdditionReverse, pathway_id, (container, resolve)=>{
    const onetwoaddition_reverse_fn = ()=>  {

        return (resolve, reject, max_steps) => {

            try {


                const computed_previous_container = _.cloneDeep(container)
                const atoms = _.cloneDeep(container.getSubstrate()[0].atoms)

                // @todo Tidy this up
                // Find at what point the 1,2 addition occurred.
                // For now we will look for a nitrogen with a positive charge that is attached to a carbon where that carbon
                // is single bonded to an oxygen or
                // where there is an oxygen with a positive charge that is attached to a carbon where that carbon
                // is double bonded to a nitrogen.
                let carbon_atom = null
                let carbon_bond = null
                let carbon_child_atom = null
                let previous_reagent_lewis_base_atom = null
                previous_reagent_lewis_base_atom = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom)=>{
                    // When doing 1,2 addition using nitrogen atom the nitrogen atom must have at least one hydrogen.
                    // @see Reductive amination
                    if (atom.atomicSymbol === 'N' && atom.charge(computed_previous_container.getSubstrate()[0].atoms) === 1 && atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length > 1) {
                        // Look for carbon atom
                        carbon_bond = _.find(atom.bonds(computed_previous_container.getSubstrate()[0].atoms), (maybe_carbon_bond)=>{
                            if (maybe_carbon_bond.atom.atomicSymbol === 'C') {
                                const oxygen_bond = _.find(maybe_carbon_bond.atom.bonds(computed_previous_container.getSubstrate()[0].atoms), (maybe_oxygen_bond)=>{
                                    return maybe_oxygen_bond.atom.atomicSymbol === 'O' && maybe_oxygen_bond.atom.singleBonds(computed_previous_container.getSubstrate()[0].atoms).length === 1
                                        && maybe_oxygen_bond.atom.charge(computed_previous_container.getSubstrate()[0].atoms) === 0
                                })
                                if (undefined !== oxygen_bond) {
                                    carbon_child_atom = oxygen_bond.atom
                                    return true
                                }
                            }
                            return false
                        })
                        if (undefined !== carbon_bond) {
                            carbon_atom = carbon_bond.atom
                            return true
                        }
                    }
                    return false
                })

                if (undefined === previous_reagent_lewis_base_atom) {
                    previous_reagent_lewis_base_atom = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom)=>{
                        // When doing 1,2 addition using oxygen atom the oxygen atom must have at two hydrogens.
                        // @see Ritter reaction
                        if (atom.atomicSymbol === 'O'
                            && atom.charge(computed_previous_container.getSubstrate()[0].atoms) === 1
                            && atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length === 2) {
                            // Look for carbon atom
                            carbon_bond = _.find(atom.bonds(computed_previous_container.getSubstrate()[0].atoms), (maybe_carbon_bond)=>{
                                if (maybe_carbon_bond.atom.atomicSymbol === 'C') {
                                    const nitrogen_bond = _.find(maybe_carbon_bond.atom.bonds(computed_previous_container.getSubstrate()[0].atoms), (maybe_nitrogen_bond)=>{
                                        return maybe_nitrogen_bond.atom.atomicSymbol === 'N'
                                            && maybe_nitrogen_bond.atom.singleBonds(computed_previous_container.getSubstrate()[0].atoms).length === 1
                                            && maybe_nitrogen_bond.atom.charge(computed_previous_container.getSubstrate()[0].atoms) === 0
                                    })
                                    if (undefined !== nitrogen_bond) {
                                        carbon_child_atom = nitrogen_bond.atom
                                        return true
                                    }
                                }
                                return false
                            })
                            if (undefined !== carbon_bond) {
                                carbon_atom = carbon_bond.atom
                                return true
                            }
                        }
                        return false
                    })
                }

                if (undefined === previous_reagent_lewis_base_atom) {
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - positively charged nitrogen or oxygen atom attached to carbon where the carbon is attached to an oxygen or nitrogen not found.'))
                    onPathwayEndedCallback()
                    return
                }

                let max_steps_copy = _.clone(max_steps)


                // Convert CO to C=O or C=N to C#N
                carbon_atom.bondAtomToAtom(carbon_child_atom)
                //progress.error()

                /*
                Extract a group of bonded atoms. As a requirement the atoms must be
                able to be attached at a single point, defined by parent atom and child atom.
                Child atom will be the first atom in the groups of atoms. We do this by reiterating
                through atoms starting from the child atom, saving each terminal atom to an array (including hydrogens),
                removing each terminal atom until there are atoms in the group left. If we end up
                with the same amount of atoms as in the whole molecule then return false. Otherwise return
                the saved atoms
                 */
                // Break the NC / OC bond.
                // atoms, parent_atom, child_atom

                const reagent_atoms = ExtractAtomGroup(
                    container.getSubstrate()[0].
                    computed_previous_container.getSubstrate()[0].atoms,
                    carbon_atom,
                    previous_reagent_lewis_base_atom,
                    logger
                )

                if (reagent_atoms.length === 0) {
                    //console.log(FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger))
                    //console.log(FormatAs(container.getSubstrate()[0]).SMILES(logger))
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - Could not extract atom group'))
                    return
                }
                //console.log('1,2 additon reverse reagent atoms')
                //console.log(FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger))
                //console.log(reagent_atoms)
                //progress.error()
                if (false === reagent_atoms) {
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - could not extract reagent'))
                    return
                }

                const reagent = MoleculeFactory(
                    reagent_atoms,
                    logger
                )
                
                computed_previous_container.addReagent(reagent, 1, logger)

                logger.log('verbose', '1,2 addition reversed - substrate after 1,2 addition reversed ' + FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger) + ' -> '
                    + FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger) + ' ' + pathway_id)


                dbCallback(container, '1,2 addition', computed_previous_container, synth, OneTwoAdditionReverse, max_steps_copy, pathway_id, logger)



            } catch(e) {
               // console.log(e)
               // logger.log('verbose', 'OneTwoAdditionReverse - rejecting ' + e + ' ' + pathway_id)
               // process.exit()
                reject(e)
            }


        }
    }

    return Reverse(container, container_before_previous_mechanism_was_applied,  max_steps, 'Reverse reduce', OneTwoAdditionReverse, last_action, logger, pathway_id, onetwoaddition_reverse_fn(), onSuccess)

}

module.exports = OneTwoAdditionReverse