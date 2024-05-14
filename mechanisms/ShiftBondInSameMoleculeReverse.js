const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const FormatAs = require('../factories/FormatAs')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('./Reverse')
const uniqid = require('uniqid');
const { C } = require("../factories/PeriodicTable");

const env = require('../env')

const BondAtomToAtomInSameMoleculeReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    // @todo This should not result in the formation of two separate molecules.
        
    try {


        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        // @todo Dihyroxylation specific
        // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Map%3A_Organic_Chemistry_(Smith)/12%3A_Oxidation_and_Reduction/12.09%3A_Dihydroxylation
        // Look for oxygen atom bonded to Os atom and also bonded to carbon atom
        const d_oxygen = _.find(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
            if ("O" !== a.atomicSymbol && "" === a.charge(computed_previous_container.getSubstrate()[0].atoms, logger)) {
                return false
            }
            const d_oxygen_bonds = a.bonds(computed_previous_container.getSubstrate()[0].atoms, logger)
            const os_bond = _.find(d_oxygen_bonds, (b)=>{
                return "Os" === b.atom.atomicSymbol
            })
            if (undefined === os_bond) {
                return false
            }
            const c_bond = _.find(d_oxygen_bonds, (b)=>{
                return "C" === b.atom.atomicSymbol
            })
            return undefined !== c_bond
        })
    
        if (undefined !== d_oxygen) {
            computed_previous_container_cloned = _.cloneDeep(computed_previous_container)
            // Break bond between oxygen and carbon. This should create a carbocation.
            const d_oxygen_carbon = _.find(d_oxygen.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b) =>{
                return "C" === b.atom.atomicSymbol
            }).atom
            computed_previous_container.getSubstrate()[0].atoms = d_oxygen_carbon.breakDativeBond(d_oxygen, computed_previous_container.getSubstrate()[0], logger)
            const os_atom = _.find(d_oxygen.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b) =>{
                return "Os" === b.atom.atomicSymbol
            }).atom
            computed_previous_container.getSubstrate()[0].atoms = d_oxygen.makeDativeBond(os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
            computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
            pathways.push([computed_previous_container])
            computed_previous_container = computed_previous_container_cloned
        }



        return pathways


    } catch(e) {
        console.log('[BondAtomToAtomInSameMoleculeReverse] ' + e.stack)
        process.exit()
        if (env.errors) {
            logger.log(env.error_log, ('[BondAtomToAtomInSameMoleculeReverse] ' + e.stack).bgRed)
        }
    }
}

module.exports = BondAtomToAtomInSameMoleculeReverse