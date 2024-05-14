

const Typecheck = require('../Typecheck')
const render = require('../actions/render')
const Constants = require('../Constants')
const FunctionalGroups = require('../reflection/FunctionalGroups')
const SN1 = require('../reactions/SN1')
const SN2 = require('../reactions/SN2')
const LewisAcidBaseReaction = require('../reactions/LewisAcidBase')
const Protonate = require('../mechanisms/Protonate')
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const FormatAs = require('../factories/FormatAs')
const AkylShift = require('../mechanisms/AkylShift')
const BondAtomToAtom = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BreakBond = require('../mechanisms/BreakBondInSameMolecule')
const Deprotonate = require('../mechanisms/Deprotonate')
//const Dehydrate = require('../mechanisms/Dehydrate')
const ProtonTransfer = require('../mechanisms/ProtonTransfer')
const Reduce = require('../mechanisms/Reduce')
const Hydrate = require('../mechanisms/Hydrate')
const _ = require('lodash');
const { loggers } = require('winston')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const BronstedLoweryAcidBase = require('../reactions/BronstedLoweryAcidBaseReaction')
const ContainerView = require('../view/Container')
const AcidBaseReaction = require('../reactions/AcidBase')

const colors = require('colors');

colors.enable()

// Pinacol rearrangement
// Protonate
// Reductive amination (in process)

// Deprotonation -> Leaving group removal -> Akyl shift -> Deprotonate

/**
 * The mechanism index is reset if we have no more mechanisms to process for the current reaction and the mechanism history is set to empty.
 * If we have no more mechanisms to process and mechanism history is empty, then we stop the reaction.
 * 
 * @param object container Container to hold results of each step in the reaction
 * @param number mechanism_index Incremental index to get next mechanism from mechanism map
 * @param array container_history This is an array of container "snapshots" as each reverse mechanism is applied.
 * @param array mechanism_history 
 * @param boolean terminate 
 * @param object logger 
 * @returns 
 */

const AI = (container, mechanism_index, container_history, mechanism_history, terminate, logger) => {

    try {

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "mechanism_index", value: mechanism_index, type: "number"},
            {name: "container_history", value: container_history, type: "array"},
            {name: "mechanism_history", value: mechanism_history, type: "array"},
            {name: "terminate", value: terminate, type: "boolean"},
            {name: "logger", value: logger, type: "object"}
        )

        logger.log('debug', '[AI] mechanism history'.bgGreen)
        logger.log('debug', mechanism_history.join(', ').bgGreen)

        // Get available reagents from current container
        const available_reagents = container.reagents.map((r)=>{
            return typeof r === 'string'? r: r.canonicalSmiles(false, r.atoms, logger) + ' ' + (r.conjugateBase?'conjugate base':'is not conjugate base') + ' ' + (r.conjugateAcid?'conjugate acid':'is not conjugate acid')
        }).join(', ')

        // Deprotonation must be before LeavingGroupRemoval.See Ritter above. (CONFLICT - reductive amination)
        const mechanism_names_map = [
            //     'Protonate',
           //      'Deprotonate', 
             'BondAtomToAtomInSameMolecule',
             'Acid base',
             'LeavingGroupRemoval',
             'AkylShift',
     //            'Hydrate',
             'Reduction',
                // 'bronsted lowery acid base'
             ]

        // Deprotonation must be before LeavingGroupRemoval.See above.
        const mechanism_map = [
//            Protonate,
     //      Deprotonate,
//            Dehydrate,
           BondAtomToAtomInSameMolecule,            
           AcidBaseReaction,
           LeavingGroupRemoval,
            AkylShift,
  //          Hydrate,
            Reduce,
           // BronstedLoweryAcidBase,
        ]
    
        let test_container = _.cloneDeep(container)
        let end_of_reaction = false

        // Always terminate reaction after Lewis acid base.
        if (undefined === mechanism_map[mechanism_index]){
            if (mechanism_history.length > 0) {
                logger.log('debug', ('[AI] Mechanism not found so resetting mechanism history ' + mechanism_index).bgYellow)
                mechanism_history = []
                mechanism_index = 0
                logger.log('debug', ('[AI] Reset mechanism index to 0').bgYellow)
                //AI(container,0, (container_history), [],  logger)
            } else {
                logger.log('debug', ('[AI] Finished running reaction substrate: ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)).bgRed)
                logger.log('debug', '=========================================================')
                end_of_reaction = true
            }
        } else {
            logger.log('info', ('[AI] Running '+ mechanism_names_map[mechanism_index] + ' on  ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger) + ' ' +  mechanism_index).bgGreen)
            const result = mechanism_map[mechanism_index](test_container, logger) // Returns a container
            if (false === result) {
                logger.log('info', ('Previous step not ' + mechanism_names_map[mechanism_index] + 'as step returned false for ' + container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)).bgRed)
                // If a mechanism returns false we drop down into the next mechanism. If all mechanisms return
                // false then the reaction has ended.
               ++mechanism_index
               //AI(container,++mechanism_index, (container_history), mechanism_history, logger)
            } else {

                // If the result has already been produced in the container then we don't apply the mechanism. This is the same as
                // if the reverse mechanism returned false
                let is_reversal = false
                
                // Get container history as array of canonical smiles and check if the canonical smiles for the current substrate (substrate after
                // mechanism applied) is in the array,
                const previous_container_index = container_history.map((c)=>{
                    return c.substrate.canonicalSmiles(false, c.substrate.atoms, logger)
                }).indexOf(test_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)) 

                // Current substrate found
                if (-1 !== previous_container_index) {
                    logger.log('debug', ('Previous container substrate ' + container_history[previous_container_index].substrate.canonicalSmiles).yellow)
                    logger.log('debug', ('New container substrate ' + test_container.getSubstrate()[0].canonicalSmiles(false, container.getSubstrate()[0].atoms,logger)).yellow)
                    is_reversal = true
                }
                
                if (true === is_reversal) {
                    // Result is a previous result so revert back to the container before the mechanism was applied
                    ++mechanism_index
                } else {

                    container = test_container
                    container_history.push(container)

                    if ('Acid base' === mechanism_names_map[mechanism_index]) {
                       // logger.log('debug', ('[AI] Terminating reaction after acid base reaction.').bgRed)
                      //  end_of_reaction = true
                    }

                    if ('Deprotonate' === mechanism_names_map[mechanism_index]) {
                       // logger.log('debug', ('[AI] Terminating reaction after deprotonation.').bgRed)
                       // end_of_reaction = true
                    }

                    if ('Protonation' === mechanism_names_map[mechanism_index]) {
                        // logger.log('debug', ('[AI] Terminating reaction after deprotonation.').bgRed)
                        // end_of_reaction = true
                     }

                     if ('Reduce' === mechanism_names_map[mechanism_index]) {
                        //logger.log('debug', ('[AI] Terminating reaction after reducing.').bgRed)
                        end_of_reaction = true
                     }

                    mechanism_history.push(mechanism_names_map[mechanism_index])
                    ++mechanism_index
                }


            }
            
        }

        // end_of_reaction will be true if there is no mechanism matching the current mechanism index and the mechanism history
        // is empty. mechanism_history will be empty if each mechanism returns false, ie there is no previous reaction step.
        if (false === end_of_reaction) {
            return AI(container, mechanism_index, (container_history), mechanism_history, terminate, logger)
        } else {
            return container
        }

    } catch(e) {
        logger.log('error', ('[AI] ' + e.stack).red)
      //  console.log(mechanism_index)
       // console.log(LewisAcidBaseReaction)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = AI