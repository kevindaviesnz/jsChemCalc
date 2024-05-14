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
const AkylShift = require('../mechanisms/AkylShift')
// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env');
const ReduceReverse = require("../mechanisms/ReduceReverse");
const DeprotonateReverse = require("../mechanisms/DeprotonateReverse");
const HydrateReverse = require("../mechanisms/HydrateReverse");
const BreakBondInSameMoleculeReverse = require("../mechanisms/BreakBondInSameMoleculeReverse")
const BondAtomToAtomInSameMoleculeReverse = require("../mechanisms/BondAtomToAtomInSameMoleculeReverse")
const LewisBaseAtom = require("../reflection/LewisBaseAtom");
const ExtractAtomGroup = require("../actions/ExtractAtomGroup")
const RemoveAtoms = require("../actions/RemoveAtoms")

const OxymercurationReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        // @see Organic Chemistry for Dummies, p202

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        // As oxymercuration consists of several steps we return an array of containers representing each step of the reaction.
        if (false === container_after_previous_mechanism_was_applied.substrate.functionalGroups(logger).alkene.length === 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[OxymercurationReverse] - Product must be an alcohol').bgRed)
            }
            return false
        }


        // Determine molecule id
        const temp = container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
            return 'C' === a.atomicSymbol
        })[0].electronPairs[0][0]
        const molecule_id = temp.split(".")[1].substring(0, temp.split(".")[1].length-1)

        const containers = []

        // Apply reduction to add HgOAc to carbon atom.
        // Find child carbonyl carbon atom.
        const child_carbonyl_carbon_atom = _.find(container_after_previous_mechanism_was_applied.substrate.atoms, (a)=>{
            if ('C' === a.atomicSymbol) {
                if (false === a.hasProton(container_after_previous_mechanism_was_applied.substrate)) {
                    return false
                }
                const carbonyl_carbon_atom_bond = _.find(a.bonds(container_after_previous_mechanism_was_applied.substrate.atoms), (b)=>{
                    const possible_carbonyl_carbon = b.atom
                    if ('C' !== possible_carbonyl_carbon.atomicSymbol) {
                        return false
                    }
                    const oxygen_bond = _.find(possible_carbonyl_carbon.bonds(container_after_previous_mechanism_was_applied.substrate.atoms), (b) =>{
                        if ('O' !== b.atom.atomicSymbol) {
                            return false
                        }
                        const o_bonds = b.atom.bonds(container_after_previous_mechanism_was_applied.substrate.atoms)
                        return o_bonds.length === 1  // don't count hydrogens
                    })
                    return undefined !== oxygen_bond
                })
                return undefined !== carbonyl_carbon_atom_bond
            }
        })
        if (undefined === child_carbonyl_carbon_atom){
            if (env.debug) {
                logger.log(env.debug_log, ('[OxymercurationReverse] - Could not find child carbonyl carbon to add Hg to.').bgRed)
            }
            return false
        }
        // Remove hydrogen from child carbonyl carbon atom along with electrons to create a carbocation
        const hydrogen_atom = _.find(child_carbonyl_carbon_atom.bonds(container_after_previous_mechanism_was_applied.substrate.atoms, true), (b)=>{
            return 'H' === b.atom.atomicSymbol
        }).atom
        const hydrogen_electrons = hydrogen_atom.electronPairs[0]
        const reduce_reverse_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
        _.remove(reduce_reverse_container.getSubstrate()[0].atoms, (a)=>{
            return a.atomId === hydrogen_atom.atomId
        })
        _.remove(child_carbonyl_carbon_atom.electronPairs, (ep)=>{
            const ep_copy = _.clone(ep)
            ep_copy.reverse()
            return _.isEqual(ep_copy, hydrogen_electrons)
        })

        // Add Hg-O-Ac to child carbonyl carbon atom.
        const Hg = AtomFactory('Hg', 0, -1, 0, '', molecule_id+'400', logger)
        reduce_reverse_container.getSubstrate()[0].atoms.push(Hg)
        reduce_reverse_container.getSubstrate()[0].atoms = Hg.makeDativeBond(child_carbonyl_carbon_atom, false, reduce_reverse_container.getSubstrate()[0].atoms, logger)
        const O = AtomFactory('O', 0,  -1, 0, '', molecule_id+'500', logger)
        reduce_reverse_container.getSubstrate()[0].atoms.push(O)
        Hg.makeCovalentBond(reduce_reverse_container.getSubstrate()[0], O, logger)
        const Ac = AtomFactory('Ac', 0,  -1, 0, '', molecule_id+'600', logger)
        reduce_reverse_container.getSubstrate()[0].atoms.push(Ac)
        O.makeCovalentBond(reduce_reverse_container.getSubstrate()[0], Ac, logger)
        reduce_reverse_container.getSubstrate()[0].smiles_string = reduce_reverse_container.getSubstrate()[0].canonicalSmiles(false, reduce_reverse_container.getSubstrate()[0].atoms, logger)
        reduce_reverse_container.reagents = []
        reduce_reverse_container.addReagent('RA:', 1, logger)
        reduce_reverse_container.mechanism = "oxymercuration step 5 - reduce"
        containers.push(reduce_reverse_container)
        
        const deprotonate_reverse_container_pathways = DeprotonateReverse(_.cloneDeep(reduce_reverse_container), logger)
        if (false === deprotonate_reverse_container_pathways) {
            if (env.debug) {
                logger.log(env.debug_log, ('[OxymercurationReverse] - Could not deprotonate previous result.').bgRed)
            }
            return false
        }
        const deprotonate_reverse_container = deprotonate_reverse_container_pathways[0][0]
        deprotonate_reverse_container.getSubstrate()[0].smiles_string = deprotonate_reverse_container.getSubstrate()[0].canonicalSmiles(false, deprotonate_reverse_container.getSubstrate()[0].atoms, logger)
        deprotonate_reverse_container.mechanism = "oxymercuration step 4 - deprotonate"
        containers.unshift(deprotonate_reverse_container)
        
        const hydrate_reverse_container = _.cloneDeep(deprotonate_reverse_container)
        hydrate_reverse_container.reagents = []
        const hydrate_reverse_container_after_hydration_pathways = HydrateReverse(hydrate_reverse_container, logger)
        if (false === hydrate_reverse_container_after_hydration_pathways) {
            if (env.debug) {
                logger.log(env.debug_log, ('[OxymercurationReverse] - Could not hydrate previous result.').bgRed)
            }
            return false
        }
        const hydrate_reverse_container_after_hydration = hydrate_reverse_container_after_hydration_pathways[0][0]
        //hydrate_reverse_container.getSubstrate()[0].smiles_string = hydrate_reverse_container.getSubstrate()[0].canonicalSmiles(false, hydrate_reverse_container.getSubstrate()[0].atoms, logger)
        hydrate_reverse_container_after_hydration.mechanism = "oxymercuration step 3 - hydrate"
        containers.unshift(hydrate_reverse_container_after_hydration)

        const break_bond_reverse_container_pathways = BreakBondInSameMoleculeReverse(_.cloneDeep(hydrate_reverse_container_after_hydration), logger)
        if (false === break_bond_reverse_container_pathways) {
            if (env.debug) {
                logger.log(env.debug_log, ('[OxymercurationReverse] - Could not break bond on previous result.').bgRed)
            }
            return false
        }
        const break_bond_reverse_container = break_bond_reverse_container_pathways[0][0]
        break_bond_reverse_container.getSubstrate()[0].smiles_string = break_bond_reverse_container.getSubstrate()[0].canonicalSmiles(false, break_bond_reverse_container.getSubstrate()[0].atoms, logger)
        break_bond_reverse_container.mechanism = "oxymercuration step 2 - break bond"
        containers.unshift(break_bond_reverse_container)
       
        // Break bonds between Hg and carbons creating two separate molecules
        const mercury_atom = _.find(_.cloneDeep(break_bond_reverse_container).substrate.atoms, (atom)=>{
            return 'Hg' === atom.atomicSymbol
        })
        const mercury_carbon_bonds = mercury_atom.bonds(break_bond_reverse_container.getSubstrate()[0].atoms).filter((b)=>{
            return 'C' === b.atom.atomicSymbol
        })
        
        break_bond_reverse_container.getSubstrate()[0].atoms = mercury_atom.breakBond(mercury_carbon_bonds[0].atom, break_bond_reverse_container.getSubstrate()[0], logger)
        
        const computed_previous_container = _.cloneDeep(break_bond_reverse_container)

        const mercuric_acetate_O = AtomFactory('O', 0,  -1, 0, '', molecule_id+'555', logger)
        computed_previous_container.getSubstrate()[0].atoms.push(mercuric_acetate_O)
        mercury_atom.makeCovalentBond(computed_previous_container.getSubstrate()[0], mercuric_acetate_O, logger)
        const mercuric_acetate_Ac = AtomFactory('Ac', 0,  -1, 0, '', molecule_id+'655', logger)
        computed_previous_container.getSubstrate()[0].atoms.push(mercuric_acetate_Ac)
        mercuric_acetate_O.makeCovalentBond(computed_previous_container.getSubstrate()[0], mercuric_acetate_Ac, logger)
        const mercuric_acetate_atoms = ExtractAtomGroup(
            computed_previous_container.getSubstrate()[0],
            computed_previous_container.getSubstrate()[0].atoms,
            mercury_carbon_bonds[1].atom, // parent 
            mercury_atom,
            logger
        )

        // @todo Hg atom should not have a positive charge
        const mercuric_acetate = MoleculeFactory (
            mercuric_acetate_atoms,
            false,
            false,
            logger
        )

        computed_previous_container.reagents = []
        computed_previous_container.addReagent(mercuric_acetate, 1, logger)
       // containers[0].addReagent(mercuric_acetate, 1, logger)

        computed_previous_container.getSubstrate()[0].atoms = RemoveAtoms(
            computed_previous_container.getSubstrate()[0],
            mercuric_acetate.atoms,
            logger
        )

        // Re-create double bond
        // break_bond_reverse_container.getSubstrate()[0].atoms = mercury_atom.breakBond(mercury_carbon_bonds[0].atom, break_bond_reverse_container.getSubstrate()[0], logger)
        // Add an electron
        mercury_carbon_bonds[0].atom.electronPairs.push(['C.'+molecule_id + '' + 789 +'.'+1])
        mercury_carbon_bonds[0].atom.makeDativeBond(mercury_carbon_bonds[1].atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
        computed_previous_container.getSubstrate()[0].atoms = computed_previous_container.getSubstrate()[0].atoms.map((a)=>{
            if (a.atomId === mercury_carbon_bonds[0].atom.atomId) {
                a = mercury_carbon_bonds[0].atom
            }
            if (a.atomId === mercury_carbon_bonds[1].atom.atomId) {
                a = mercury_carbon_bonds[1].atom
            }
            return a
        })

        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
        computed_previous_container.mechanism = 'oxymercuration step 1 Add mecuric acetate'
        containers.unshift(computed_previous_container)

        // Set reagents
        containers[0].reagents = [] // "oxymercuration step 1 Add mecuric acetate"
        containers[0].addReagent(mercuric_acetate, 1, logger) 
        containers[1].reagents = [] // "oxymercuration step 2 - break bond"
        containers[1].addReagent(mercuric_acetate, 1, logger) 
        const water = MoleculeFactory(
            AtomsFactory('O', logger),
            false,
            false, 
            logger
        )
        containers[2].reagents = [] // "oxymercuration step 3 - hydrate"
        containers[2].addReagent(water, 1, logger) 
        containers[3].reagents = [] //  "oxymercuration step 4 - deprotonate"
        containers[3].addReagent('B:', 1, logger) 
        containers[4].reagents = [] // "oxymercuration step 5 - reduce"
        containers[4].addReagent('RA:', 1, logger) 
        pathways.push(containers)

        return pathways

    

    } catch(e) {
        logger.log('error', '[Oxymercuration] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = OxymercurationReverse