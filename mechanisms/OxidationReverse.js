const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('./Reverse')
const uniqid = require('uniqid');

const BreakBondInSameMoleculeReverse = require('./BreakBondInSameMoleculeReverse')
const MakeCarbocation = require('../actions/MakeCarbocation')

const env = require('../env');
const FindAlkeneCarbonAtoms = require("../actions/FindAlkeneCarbonAtoms");


const OxidationReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

        try {

            // eg CC(C)=O <--- CC=C

            Typecheck(
                {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
                {name: "logger", value: logger, type: "object"}
            )

            const pathways = []
            
           // container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('OxidationReverse',logger)

            let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

            // For now test for oxidation of an alkene with a terminal carbon (C=O)
            // Look for an oxygen atom double bonded to a carbon where that carbon is bonded to terminal carbon
            const filtered_atoms = computed_previous_container.getSubstrate()[0].atoms.filter((a)=>{
                return 'C' === a.atomicSymbol || 'O' === a.atomicSymbol | 'H' === a.atomicSymbol
            })

            const terminal_carbon = _.find(filtered_atoms, (atom)=>{
                if ('C' !== atom.atomicSymbol || false === atom.isTerminalAtom(filtered_atoms)) {
                    return false
                }
                const bonds = atom.bonds(filtered_atoms, false)
                const carbonyl_carbon_bonded_to_terminal_carbon_bond = _.find(bonds, (bond)=>{
                    if ('C' !== bond.atom.atomicSymbol) {
                        return false
                    }
                    // Look for C=O bond
                    const carbonyl_bond = _.find(bond.atom.bonds(filtered_atoms), (b)=>{
                        return 'O' === b.atom.atomicSymbol && "=" === b.bond_type
                    })
                    return undefined !== carbonyl_bond
                })
                return undefined !== carbonyl_carbon_bonded_to_terminal_carbon_bond
            })

            if (undefined === terminal_carbon) {
                if (env.debug) {
                    logger.log(env.debug_log, '[OxidisationReverse] Could not terminal carbon bonded to carbonyl carbon')
                }
                return false
            }

            const carbonyl_carbon = _.find(filtered_atoms, (atom)=>{
                if ('C' !==atom.atomicSymbol || atom.atomId === terminal_carbon.atomId || false === atom.isBondedTo(terminal_carbon, filtered_atoms)) {
                    return false
                }
                // Look for C=O bond
                const carbonyl_bond = _.find(atom.bonds(filtered_atoms), (b)=>{
                    return 'O' === b.atom.atomicSymbol && "=" === b.bond_type
                })
                return undefined !== carbonyl_bond
            })
            
            const carbonyl_oxygen = _.find(filtered_atoms, (atom)=>{
                return 'O' == atom.atomicSymbol && atom.isBondedTo(carbonyl_carbon, filtered_atoms)
            })

            // Remove proton from terminal carbon and the substrate, turning the terminal carbon into a carbocation.
            const proton = terminal_carbon.hydrogens(filtered_atoms)[0]
            computed_previous_container.getSubstrate()[0].atoms = terminal_carbon.breakBond(proton, computed_previous_container.getSubstrate()[0], logger)
            _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                return a.atomId === proton.atomId
            })

            computed_previous_container.getSubstrate()[0].atoms = carbonyl_carbon.breakBond(carbonyl_oxygen, computed_previous_container.getSubstrate()[0], logger)
            computed_previous_container.getSubstrate()[0].atoms = carbonyl_carbon.breakBond(carbonyl_oxygen, computed_previous_container.getSubstrate()[0], logger)
            _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                return carbonyl_oxygen.atomId === a.atomId
            })

            // Make double bond between carbonyl carbon and terminal carbon
            // Note that there should still be a single bond between the carbonyl carbon and the terminal carbon
            // The terminal carbon will have one available slot and the carbonyl carbon will have two available slots.
            const new_carbonyl_carbon_electron = 'C.' + carbonyl_carbon.atomId + '.999'
            const new_terminal_carbon_electron = 'C.' + terminal_carbon.atomId + '.888'
            carbonyl_carbon.electronPairs.push([new_carbonyl_carbon_electron, new_terminal_carbon_electron])
            terminal_carbon.electronPairs.push([new_terminal_carbon_electron, new_carbonyl_carbon_electron])
            
            // Add hydrogen to carbonyl carbon
            const hydrogen = AtomFactory('H', 0, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)
            const hydrogen_electron = hydrogen.electronPairs[0][0]
            const new_carbonyl_carbon_electron_bonded_to_hydrogen = 'C.' + carbonyl_carbon.atomId + '.777'
            hydrogen.electronPairs[0].push(new_carbonyl_carbon_electron_bonded_to_hydrogen)
            carbonyl_carbon.electronPairs.push([new_carbonyl_carbon_electron_bonded_to_hydrogen, hydrogen_electron])
            computed_previous_container.getSubstrate()[0].atoms.push(hydrogen)

            // Add oxidisation reagent to container
            computed_previous_container.addReagent("OA:", 1, logger)

            const actual_number_of_hydrogens1 = computed_previous_container.getSubstrate()[0].atoms.actualNumberOfHydrogens('OxidiseReverseReverse1', logger)
            const calculated_number_of_hydrogens1 = computed_previous_container.getSubstrate()[0].atoms.calculatedNumberOfHydrogens('OxidiseReverse1', logger)
            if (actual_number_of_hydrogens1 !== calculated_number_of_hydrogens1) {
                //console.log(computed_previous_container.getSubstrate()[0].atoms)
                //console.log(actual_number_of_hydrogens1)
                //console.log(calculated_number_of_hydrogens1)
                if (env.errors) {
                    logger.log(env.error_log, '[OxidiseReverse] FATAL ERROR Incorrect hydrogens.')
                }
                computed_previous_container = container_after_previous_mechanism_was_applied
                return false
            }

            computed_previous_container.getSubstrate()[0].conjugateAcid = false
            computed_previous_container.getSubstrate()[0].conjugateBase = false
    

            return computed_previous_container



        } catch(e) {
            logger.log('error', ('[OxidiseReverse] ' + e).bgRed)
            console.log(e.stack)
            process.exit()
        }

    
}

module.exports = OxidationReverse