const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('../mechanisms/Hydrate')

const OneTwoEliminationReverse = function(
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

    // OneTwoEliminationReverse
    //logger.log('verbose', 'Calling OneTwoEliminationReverse() for ' + FormatAs(container.getSubstrate()[0]).SMILES(logger) + ' ' + pathway_id)

    Typecheck(
        {name: "container", value: container, type: "object"},
        {name: "container_before_previous_mechanism_was_applied", value: container_before_previous_mechanism_was_applied, type: "object"},
        {name: "last_action", value: last_action, type: "function"},
        {name: "pathway_id", value: pathway_id, type: "string"},
        {name: "onPathwayEndedCallback", value: onPathwayEndedCallback, type: "function"},
        {name: "logger", value: logger, type: "object"},
        {name: "db", value: db, type: "object"}
    )

    const onSuccess = (container_after_previous_mechanism_was_applied, container_before_previous_mechanism_was_applied, reason) => {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "container_before_previous_mechanism_was_applied", value: container_before_previous_mechanism_was_applied, type: "object"},
            {name: "reason", value: reason, type: 'string'}
        )
        const container_before_previous_mechanism_was_applied_SMILES = container_before_previous_mechanism_was_applied === null?'':FormatAs(container_before_previous_mechanism_was_applied.substrate).SMILES(logger)
      //  logger.log('verbose', '1,2 Elimination - pathway ended for ' + FormatAs(container.getSubstrate()[0]).SMILES(logger) + '. Reason:  ' +reason + ' ' + pathway_id + ' (resolved)')
        //logger.log('verbose', '1,2 Elimination ' +  FormatAs(container_after_previous_mechanism_was_applied.substrate).SMILES(logger) + ' -> ' + container_before_previous_mechanism_was_applied_SMILES + ' ' + pathway_id + ' ' + max_steps + ' ' +reason)
        return container
    }

    //   Reverse(container, max_steps, 'Reverse reduce', OneTwoEliminationReverse, pathway_id, (container, resolve)=>{
    const onetwoelimination_reverse_fn = ()=>  {

        return (resolve, reject, max_steps) => {

            try {

                const computed_previous_container = _.cloneDeep(container)

                // Find atom with a positive charge and double bond
                const atom_to_break_double_bond = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom) => {
                    return atom.doubleBonds(computed_previous_container.getSubstrate()[0].atoms).length === 1 && atom.charge(computed_previous_container.getSubstrate()[0].atoms) === 1
                })

                if (false === atom_to_break_double_bond || undefined === atom_to_break_double_bond || null === atom_to_break_double_bond) {
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - positive charged atom with double bond not found'))
                    return
                }

                // Get carbon atom attached to the double bond
                const carbon_atom_double_bond = _.find(atom_to_break_double_bond.bonds(computed_previous_container.getSubstrate()[0].atoms), (bond) => {
                    return bond.atom.atomicSymbol === 'C' && bond.bond_type === '='
                })

                if (false === carbon_atom_double_bond || undefined === carbon_atom_double_bond || null === carbon_atom_double_bond) {
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - no carbon with double bond found on atom.'))
                    onPathwayEndedCallback()
                    return
                }

                // Convert double bond to single bond
                // 'this' is the atom that will keep the electrons.
                // Break bond by "collapsing" electron pair onto "atom"
                // After breaking the bond the "this" should have an additional charge and
                // the "atom" should have one less charge.
                computed_previous_container.getSubstrate()[0].atoms = carbon_atom_double_bond.atom.breakSingleBond(atom_to_break_double_bond, computed_previous_container.getSubstrate()[0], logger)

                computed_previous_container.getSubstrate()[0].conjugateAcid = false
                computed_previous_container.getSubstrate()[0].conjugateBase = false
        

                // @todo use centralised list of halides
                const halide_symbols = ['Br', 'Cl', 'F', 'I']
                _.cloneDeep(['O']).map((atom_symbol, i) => { // _.cloneDeep(['O', ...halide_symbols]).map((atom_symbol, i

                    if (atom_symbol !=='O' && container.getSubstrate()[0].hasHalide()) {
                        resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - attempting to add ' + atom_symbol + ' but molecule already has a halide.'))
                        return
                    }

                    if (atom_symbol ==='O' && container.getSubstrate()[0].hasOxygen()) {
                        resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - attempting to add oxygen but molecule already has an oxygen atom.'))
                        return
                    }

                    if (atom_symbol ==='O' && container.getSubstrate()[0].hasHalide()) {
                        resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - attempting to add oxygen but molecule already has a halide atom.'))
                        return
                    }

                    const computed_previous_container_in_loop = _.cloneDeep(computed_previous_container)
                    let max_steps_copy = _.clone(max_steps)

                    // If we're doing a pathway split we need to replace the last pathway id portion with a new id.
                    // eg if the current pathway is abc.123 then we replace 123 with a new id -> abc.123
                    if (i > 0) {
                        const pathway_id_components = pathway_id.split('.') // We always have at least two components
                        pathway_id_components[pathway_id_components.length - 1] = uniqid().substr(uniqid().length - Constants().pathway_id_segment_length, Constants().pathway_id_segment_length)
                        pathway_id = pathway_id_components.join('.')
                    }

                    const _target_atom = computed_previous_container_in_loop.substrate.atoms.getAtomByAtomId(carbon_atom_double_bond.atom.atomId)

                    if (halide_symbols.indexOf(atom_symbol) !==-1){
                        const halide_atom = AtomFactory(atom_symbol, 0,0, uniqid().substr(uniqid().length-3,3),logger)
                        if (computed_previous_container_in_loop.substrate.addHalide(_target_atom, halide_atom, logger) === false) {
                            throw new Error('OneTwoEliminationReverse - Adding halide failed.')
                        }
                    } else {
                        const leaving_group_molecule = MoleculeFactory(AtomsFactory(atom_symbol, logger), logger)
                        if (computed_previous_container_in_loop.substrate.addLeavingGroup(_target_atom, leaving_group_molecule, logger) === false) {
                            throw new Error('OneTwoEliminationReverse - Adding leaving group failed.')
                        }
                    }

                    logger.log('verbose', 'OneTwoEliminationReverse - substrate after reversing 1,2 elimination ' + FormatAs(container.getSubstrate()[0]).SMILES(logger) + ' -> '
                    + FormatAs(computed_previous_container_in_loop.substrate).SMILES(logger) + ' ' + pathway_id)

//                    console.log('1,2 elimination reverse')
  //                  console.log(FormatAs(container.getSubstrate()[0]).SMILES(logger))
    //                process.exit()

                    dbCallback(container, '1,2 elimination', computed_previous_container_in_loop, synth, OneTwoEliminationReverse, max_steps_copy, pathway_id, logger)


                })

            } catch(e) {
               // console.log(e)
               // logger.log('verbose', 'OneTwoEliminationReverse - rejecting ' + e + ' ' + pathway_id)
               // process.exit()
                reject(e)
            }


        }
    }

    return Reverse(container, container_before_previous_mechanism_was_applied,  max_steps, '1,2 elimination reduce', OneTwoEliminationReverse, last_action, logger, pathway_id, onetwoelimination_reverse_fn(), onSuccess)

}

module.exports = OneTwoEliminationReverse