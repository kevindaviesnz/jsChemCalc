const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');
const LeavingGroupList = require('../actions/LeavingGroupList')
const Hydrate = require('../mechanisms/Hydrate')
const Protonate = require('../mechanisms/Protonate');
const AcidBase = require("../reactions/AcidBase");
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom");
const ExtractAtomGroup = require('../actions/ExtractAtomGroup');
const { at } = require("lodash");
const RemoveAtoms = require("../actions/RemoveAtoms")

const env = require('../env')

/*
Important note:
Here we have a dibromide and we are applying different reactions in reverse to determine possible pathways to get to the dibromide.
*/


const ToDibromide = function(
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

        //container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('DeprotonateReverse', logger)
        let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
        let bromine_carbon_carbon_with_terminal_bromine_bonds
        let bromine_carbon

        // Bromination (alkene -> dibromide)
        // @see Org Chem for dummies P205
        // Look for terminal bromine atom bonded to a carbon
        const terminal_bromine = _.find(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
            if ('Br' !== a.atomicSymbol || a.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms) === false) {
                return false
            }
            const terminal_bromide_bonds = a.bonds(computed_previous_container.getSubstrate()[0].atoms)    
            bromine_carbon = _.find(terminal_bromide_bonds, (b)=>{
                return "C" === b.atom.atomicSymbol
            }).atom

            // Look for adjacent terminal bromine atom eg C([Br])C([Br])
            bromine_carbon_carbon_with_terminal_bromine_bonds = bromine_carbon.bonds(computed_previous_container.getSubstrate()[0].atoms, logger).filter((b)=>{
                if ('C' !== b.atom.atomicSymbol) {
                    return false
                }
                const child_bonds = b.atom.bonds(computed_previous_container.getSubstrate()[0].atoms, logger)
                const bromine_atom_bond = _.find(child_bonds, (o_b)=>{
                    return 'Br' === o_b.atom.atomicSymbol && o_b.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms, logger)
                })
                return undefined !== bromine_atom_bond
            })

            return bromine_carbon_carbon_with_terminal_bromine_bonds.length > 0
    
        })


        if (undefined === terminal_bromine) {
            return false
        } else {

            // @todo can have more than one adjacent bromine
            const adjacent_carbon = bromine_carbon_carbon_with_terminal_bromine_bonds[0].atom
            const adjacent_bromine = _.find(adjacent_carbon.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b)=>{
                return 'Br' === b.atom.atomicSymbol && b.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms)
            }).atom

            // Remove adjacent bromine atom from adjacent carbon, creating a carbocation.
            computed_previous_container.getSubstrate()[0].atoms = adjacent_carbon.breakDativeBond(adjacent_bromine, computed_previous_container.getSubstrate()[0], logger)
            _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                return a.atomId === adjacent_bromine.atomId
            })

            // Bond other bromine to the adjacent carbon (carbon atom should now be a carbocation)
            computed_previous_container.getSubstrate()[0].atoms = terminal_bromine.makeDativeBond(adjacent_carbon, false, computed_previous_container.getSubstrate()[0].atoms, logger)

            const br = MoleculeFactory(
                AtomsFactory("[Br+]", logger),
                false,
                false,
                logger
            )
            computed_previous_container.addReagent(br, 1, logger)
            if (pathways.length > 0) {
                pathways[pathways.length-1].push([computed_previous_container])
             } else {
                pathways.push([computed_previous_container])
             }
             computed_previous_container = computed_previous_container_cloned


            computed_previous_container.reagents = []

            // Break bond between terminal bromine and bromine carbon
            computed_previous_container.getSubstrate()[0].atoms = bromine_carbon.breakDativeBond(terminal_bromine, computed_previous_container.getSubstrate()[0], logger)
            // Break bond between terminal bromine and adjacent carbon
            computed_previous_container.getSubstrate()[0].atoms = adjacent_carbon.breakDativeBond(terminal_bromine, computed_previous_container.getSubstrate()[0], logger)

            // Remove terminal bromine
            _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                return a.atomId === terminal_bromine.atomId
            })

            // Recreate C=C bond
            // Determine molecule id
            const temp = container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
                return 'C' === a.atomicSymbol
            })[0].electronPairs[0][0]
            const molecule_id = temp.split(".")[1].substring(0, temp.split(".")[1].length-1)
            
            // Add electrons to carbon so we can bond it to the carbocation.
            // @todo replace 110 with random number
            adjacent_carbon.electronPairs.push(['C.' + molecule_id + '112'])
            adjacent_carbon.electronPairs.push(['C.' + molecule_id + '113'])

            computed_previous_container.getSubstrate()[0].atoms = adjacent_carbon.makeDativeBond(bromine_carbon, false, computed_previous_container.getSubstrate()[0].atoms, logger)

            // Recreate bromine reagent
            const brbr = MoleculeFactory(
                AtomsFactory("BrBr", logger),
                false,
                false,
                logger
            )
            computed_previous_container.addReagent(brbr, 1, logger)

            pathways[pathways.length-1].push([_.cloneDeep(computed_previous_container)])

        }
                        
        return pathways


    } catch(e) {
        logger.log('error', '[ToDibromide] ' + e)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = ToDibromide