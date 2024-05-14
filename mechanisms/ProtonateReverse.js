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
const Protonate = require('../mechanisms/Protonate');
const AcidBase = require("../reactions/AcidBase");
const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom');
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom")

// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env')

const ProtonateReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {


        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "container_after_previous_mechanism_was_applied.substrate", value: container_after_previous_mechanism_was_applied.substrate, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        if (null === container_after_previous_mechanism_was_applied.substrate) {
            throw new Error('Something went wrong. Substrate in container should not be null.')            
        }
    
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

    //    computed_previous_container.getSubstrate()[0].atoms.checkHydrogens('ProtonateReverse', logger)
        
        // Make sure we don't "inherit" a reducing agent as adding a reducing agent is treated as a separate step.
        computed_previous_container.removeReagent('RA:', logger)
        // Remove any base reagents as we add A: as a separate step after the base has been consumed.
        computed_previous_container.removeReagent('B:', logger)
        computed_previous_container.addReagent('A:', 1, logger)

        // Get the atom most likely to have been protonated, excluding atoms that most likely were deprotonated.
        const atoms = computed_previous_container.getSubstrate()[0].atoms.filter((a)=>{
            return a.atomicSymbol !== 'C' 
            && a.charge(computed_previous_container.getSubstrate()[0].atoms, logger) === 1
            && a.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length > 0
        })


        if (0 === atoms.length) {
            return false
        }
        

        const atom_to_deprotonate = atoms[0]
        
        const proton = atom_to_deprotonate.hydrogens(computed_previous_container.getSubstrate()[0].atoms)[0]
        computed_previous_container.getSubstrate()[0].atoms = proton.breakBond(atom_to_deprotonate, computed_previous_container.getSubstrate()[0], logger)
        // Remove proton from atom
        _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
            return a.atomId === proton.atomId
        })


        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false

        computed_previous_container.mechanism = 'protonate'

        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
        
        computed_previous_container.removeReagent('B:', logger)
        computed_previous_container.removeReagent('A:', logger)
        computed_previous_container.addReagent('A:', 1, logger)

        
        pathways.push([computed_previous_container])

        return pathways

    } catch(e) {
        logger.log('error', '[DeprotonateReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = ProtonateReverse