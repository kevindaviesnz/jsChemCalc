const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const FindLewisAcidAtom = require('../reflection/LewisAcidAtom')
const Hydrate = require('../mechanisms/Hydrate');
const AtomsFactory = require("../factories/AtomsFactory");

const env = require('../env')

const DehydrateReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        // DehydrateReverse

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

     //   if (env.errors) {
      //      logger.log(env.error_log, '[DehydrateReverse] ' + container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger))
      //  }
        
        const number_of_atoms_after_previous_mechanism_was_applied =  container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
            return 'H' !== a.atomicSymbol
        }).length

        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
                //computed_previous_container.getSubstrate()[0].atoms.checkHydrogens('DehydrateReverse', logger)
                const actual_number_of_hydrogens1 = computed_previous_container.getSubstrate()[0].atoms.actualNumberOfHydrogens('DehydrateReverse1', logger)
                const calculated_number_of_hydrogens1 = computed_previous_container.getSubstrate()[0].atoms.calculatedNumberOfHydrogens('DehydrateReverse1', logger)
                if (actual_number_of_hydrogens1 !== calculated_number_of_hydrogens1) {
                    console.log('DehydrateReverse1 incorrect hydrogens')
                    process.exit()
                }

        //computed_previous_container.getSubstrate()[0].atoms.checkHydrogens('DehydrateReverse',logger)

        // Add water
        computed_previous_container.addReagent(
            MoleculeFactory(AtomsFactory('O', logger), false, false, logger),
            1,
            logger
        )

        const hydrate_result = Hydrate(computed_previous_container, logger)
        if (false === hydrate_result) {
            return false
        }

        const number_of_atoms_before_previous_mechanism_was_applied =  computed_previous_container.getSubstrate()[0].atoms.filter((a)=>{
            return 'H' !== a.atomicSymbol
        }).length

        const computed_previous_container_nitrogens = computed_previous_container.getSubstrate()[0].atoms.filter((a)=>{
            return 'N' === a.atomicSymbol
        })

        const container_after_previous_mechanism_was_applied_nitrogens = container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
            return 'N' === a.atomicSymbol
        })


        if (0 === computed_previous_container_nitrogens.length && container_after_previous_mechanism_was_applied_nitrogens.length > 0) {
            throw new Error('Something went wrong. Hydration has added a nitrogen to the substrate - ' + container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger))
        }

        if (number_of_atoms_before_previous_mechanism_was_applied <= number_of_atoms_after_previous_mechanism_was_applied) {
            throw new Error('Hydration should have added an additional atom -' + container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger))
        }
      
        //computed_previous_container.getSubstrate()[0].atoms.checkHydrogens('DehydrateReverse', logger)
        const actual_number_of_hydrogens2 = computed_previous_container.getSubstrate()[0].atoms.actualNumberOfHydrogens('DehydrateReverse2', logger)
        const calculated_number_of_hydrogens2 = computed_previous_container.getSubstrate()[0].atoms.calculatedNumberOfHydrogens('DehydrateReverse2', logger)
        if (actual_number_of_hydrogens2 !== calculated_number_of_hydrogens2) {
            console.log('[DehydrateReverse] incorrect hydrogens - ' + container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger))
            process.exit()
        }
        
        pathways.push([computed_previous_container])

        return pathways


    } catch(e) {
        if (env.errors) {
            logger.log(env.error_log, '[DehydrateReverse] ' +e.stack)
        }
        return false
    }

}

module.exports = DehydrateReverse