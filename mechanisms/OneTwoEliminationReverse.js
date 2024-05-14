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

const OneTwoEliminationReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []
        
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        // Find atom with a positive charge and double bond
        const atom_to_break_double_bond = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom) => {
            return atom.doubleBonds(computed_previous_container.getSubstrate()[0].atoms, logger).length === 1
        })

        if (false === atom_to_break_double_bond || undefined === atom_to_break_double_bond || null === atom_to_break_double_bond) {
            if (env.debug) {
                logger.log(env.debug_log, ('[OneTwoEliminationReverse] - positive charged atom with double bond not found.').bgRed)
            }
            return false
        }

        // Get carbon atom attached to the double bond
        const carbon_atom_double_bond = _.find(atom_to_break_double_bond.bonds(computed_previous_container.getSubstrate()[0].atoms), (bond) => {
            return bond.atom.atomicSymbol === 'C' && bond.bond_type === '='
        })

        if (false === carbon_atom_double_bond || undefined === carbon_atom_double_bond || null === carbon_atom_double_bond) {
            if (env.debug) {
                logger.log(env.debug_log, ('[OneTwoEliminationReverse] - no carbon with double bond found on atom..').bgRed)
            }
            return false
        }

        // Convert double bond to single bond
        // 'this' is the atom that will keep the electrons.
        // Break bond by "collapsing" electron pair onto "atom"
        // After breaking the bond the "this" should have an additional charge and
        // the "atom" should have one less charge.
        computed_previous_container.getSubstrate()[0].atoms = carbon_atom_double_bond.atom.breakBond(atom_to_break_double_bond, computed_previous_container.getSubstrate()[0], logger)

        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false

        // @todo use centralised list of halides
        const halide_symbols = ['Br', 'Cl', 'F', 'I']
        const leaving_group_molecule = MoleculeFactory(
            AtomsFactory('O', logger),
            false,
            false, 
            logger
        )

        const _target_atom = computed_previous_container.getSubstrate()[0].atoms.getAtomByAtomId(carbon_atom_double_bond.atom.atomId)

        // Add water leaving group
        const oxygen_atom = _.find(leaving_group_molecule.atoms, (a)=>{
            return 'O' === a.atomicSymbol
        })
        computed_previous_container.getSubstrate()[0].atoms.push(oxygen_atom)
        oxygen_atom.makeDativeBond(_target_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
        const hydrogens = leaving_group_molecule.atoms.filter((a)=>{
            return 'H' === a.atomicSymbol
        })

        computed_previous_container.getSubstrate()[0].atoms.push(hydrogens[0])
        computed_previous_container.getSubstrate()[0].atoms.push(hydrogens[1])
             
        pathways.push([computed_previous_container])

        return pathways
    

    } catch(e) {
        logger.log('error', '[OneTwoEliminationReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = OneTwoEliminationReverse