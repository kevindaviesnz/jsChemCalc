const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('./Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('./Hydrate')
const HydrideShift = require('./HydrideShift')
// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env')

const OneTwoAdditionReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []
        
        let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        // @todo Hydroboration specific
        // @see Org Chem for Dummies P202 
        // Look for terminal boron atom with two hydrogens and bonded to a carbon.
        const boron_atom = _.find(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
            if ('B' !== a.atomicSymbol || a.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms, logger) === false) {
                return false
            }
            if (a.hydrogens(computed_previous_container.getSubstrate()[0].atoms, logger).length !== 2) {
                return false
            }
            const boron_carbon_bonds = a.bonds(computed_previous_container.getSubstrate()[0].atoms, logger).filter((b)=>{
                return 'C' === b.atom.atomicSymbol
            })
            return boron_carbon_bonds.length === 1
        })

        if (undefined !== boron_atom) {

            const boron_carbon_atom = _.find(boron_atom.bonds(computed_previous_container.getSubstrate()[0].atoms), (b)=>{
                return 'C' === b.atom.atomicSymbol
            }).atom

            // Break boron-carbon bond, moving electron pair to boron and creating a carbocation.
            boron_carbon_atom.breakDativeBond(boron_atom, computed_previous_container.getSubstrate()[0], logger)

            // Get boron carbon carbon bonds
            const boron_carbon_carbon_bonds = boron_carbon_atom.bonds(computed_previous_container.getSubstrate()[0].atoms, logger).filter((b)=>{
                if('C' !== b.atom.atomicSymbol){
                    return false
                }
                return b.atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length > 0
            })

            // Create new reagent using boron atom and it's hydrogens.
            const boron_hydrogens = boron_atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms)
            const boron_reagent_atoms = _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                return a.atomId === boron_atom.atomId || a.atomId === boron_hydrogens[0].atomId || a.atomId === boron_hydrogens[1].atomId
            })

            const boron_dihydride = MoleculeFactory(
                boron_reagent_atoms,
                false,
                false,
                logger
            )

            // For each born carbon carbon bond remove a proton from the bonded to the boron carbon carbon atom and create dative bond.
            boron_carbon_carbon_bonds.map((b)=>{

                const computed_previous_container_cloned = _.cloneDeep(computed_previous_container)
                const adjacent_carbon = b.atom
                
                // Remove proton
                const adjacent_carbon_hydrogens = adjacent_carbon.hydrogens(computed_previous_container.getSubstrate()[0].atoms)
                adjacent_carbon_hydrogens[0].breakDativeBond(adjacent_carbon, computed_previous_container.getSubstrate()[0], logger)
                _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                    return a.atomId === adjacent_carbon_hydrogens[0]
                })

                // At this point boron carbon atom should be a carbocation.
                // This should create a double bond.
                adjacent_carbon.makeDativeBond(boron_carbon_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)

                // Add proton to reagent
                const proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)
                proton[Constants().electron_index] = []
                boron_atom.makeDativeBond(proton, true, _.cloneDeep(boron_dihydride.atoms), logger)
                boron_dihydride.atoms.push(proton)
                
                computed_previous_container.reagents = []
                computed_previous_container.addReagent(boron_dihydride, 1, logger)
                computed_previous_container.mechanism = "1,2 addition"
                computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)

                pathways.push([_.cloneDeep(computed_previous_container)])

                computed_previous_container = computed_previous_container_cloned

                return b
            })

        }


        return pathways
    

    } catch(e) {
        logger.log('error', '[OneTwoEliminationReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = OneTwoAdditionReverse