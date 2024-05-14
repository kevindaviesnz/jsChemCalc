// @see https://en.wikiversity.org/wiki/Reactivity_and_Mechanism
// @see https://en.wikiversity.org/wiki/Reactivity_and_Mechanism
const FormatAs = require('../factories/FormatAs')
const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const _ = require('lodash');
const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups');
const RemoveAtoms = require('../actions/RemoveAtoms')
const FindCarbocationCarbonPair = require('../actions/FindCarbocationCarbonPair')
const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup');
const MoleculeFactory = require('../factories/MoleculeFactory');

const env = require('../env')

const LeavingGroupRemoval = (container, logger) => {

    try {

        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "atoms", value: container.getSubstrate()[0].atoms, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )


        const available_reagents = container.reagents.map((r)=>{
            const reagent_smiles = undefined === r.canonicalSmiles?r.smiles:r.canonicalSmiles(false, r.atoms,logger) 
            return typeof r === 'string'? r: reagent_smiles + ' ' + (r.conjugateBase?'conjugate base':'is not conjugate base') + ' ' + (r.conjugateAcid?'conjugate acid':'is not conjugate acid')
        }).join(', ')
      //  logger.log('debug', ('[LeavingGroupRemoval] Available reagents: ' + available_reagents).bgYellow)

 
        const leaving_group_molecule = RemoveLeavingGroup(container.getSubstrate()[0], logger)
        // Return leaving group molecule and starting molecule with leaving group removed.
        container.addReagent(leaving_group_molecule, 1, logger)

        if (typeof container.getSubstrate()[0] !== "object" || Object.prototype.toString.call(container.getSubstrate()[0]) === '[object Array]') {
            throw new Error('Substrate should be an array')
        }

        if(Object.prototype.toString.call(container.getSubstrate()[0].atoms) !== '[object Array]'){
            throw new Error('Substrate atoms should be an array')
        }


    } catch(e) {

        logger.log('error', '[LeavingGroupRemoval] '+e.stack)
        console.log(e.stack)
        process.exit()

    }



}


module.exports = LeavingGroupRemoval