const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')

const ProtonTransferReverse = function(
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
        return container
    }

    //   Reverse(container, max_steps, 'Reverse reduce', ProtonTransferReverse, pathway_id, (container, resolve)=>{
    const proton_transfer_reverse_fn = ()=>  {

        return (resolve, reject, max_steps) => {

            try {

                if (undefined === container) {
                    throw new Error('Container is undefined')
                }

                const computed_previous_container = _.cloneDeep(container)
                let max_steps_copy = _.clone(max_steps)

                const substrate_smiles_before = _.cloneDeep(FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger))

                if (ProtonTransfer(computed_previous_container, logger)===false) {
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - proton transfer failed'))
                    onPathwayEndedCallback()
                    return
                }

                if (substrate_smiles_before === FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger)) {
                    resolve(onSuccess(container, container_before_previous_mechanism_was_applied, 'Path ended - proton transfer made no changes to molecule'))
                    return
                }

                logger.log('verbose', 'ProtonTransferReverse - substrate after proton transfer reversed ' + FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger) + ' -> '
                    + FormatAs(computed_previous_container.getSubstrate()[0]).SMILES(logger) + ' ' + pathway_id)
                dbCallback(container, 'proton transfer', computed_previous_container, synth, ProtonTransferReverse, max_steps_copy, pathway_id, logger)

            } catch(e) {

                reject(e)

            }

        }
    }

    return Reverse(container, container_before_previous_mechanism_was_applied,  max_steps, 'Proton transfer reduce', ProtonTransferReverse, last_action, logger, pathway_id, proton_transfer_reverse_fn(), onSuccess)

}

module.exports = ProtonTransferReverse