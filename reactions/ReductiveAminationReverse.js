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
const ProtonateReverse = require("../mechanisms/ProtonateReverse");
const HydrateReverse = require("../mechanisms/HydrateReverse");
const DehydrateReverse = require("../mechanisms/DehydrateReverse");
const BreakBondInSameMoleculeReverse = require("../mechanisms/BreakBondInSameMoleculeReverse")
const BondAtomToAtomInSameMoleculeReverse = require("../mechanisms/BondAtomToAtomInSameMoleculeReverse")
const LewisBaseAtom = require("../reflection/LewisBaseAtom");
const ExtractAtomGroup = require("../actions/ExtractAtomGroup")
const RemoveAtoms = require("../actions/RemoveAtoms");
const OneTwoEliminationReverse = require("../mechanisms/OneTwoEliminationReverse");

const ReductiveAminationReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

    try {

        // @see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination
        // @see http://commonorganicchemistry.com/Rxn_Pages/Reductive_Amination/Reductive_Amination_Index.htm
        // @see 

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        const pathways = []

        const LewisAcidBaseReverse = require('../reactions/LewisAcidBaseReverse')

        // As reductive amination consists of several steps we return an array of containers representing each step of the reaction.
        if (false === container_after_previous_mechanism_was_applied.substrate.functionalGroups(logger).amine.length === 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminationReverse] - Product must be an amine').bgRed)
            }
            return false
        }


        // Determine molecule id
        const temp = container_after_previous_mechanism_was_applied.substrate.atoms.filter((a)=>{
            return 'C' === a.atomicSymbol
        })[0].electronPairs[0][0]
        const molecule_id = temp.split(".")[1].substring(0, temp.split(".")[1].length-1)

        const containers = []
        
        // Start: BrCNC(C)C
        // Apply reduction to iminium ion
        // Do not reverse reduction if the molecule already has an atom with a positive charge.
        const positive_atom = _.find(container_after_previous_mechanism_was_applied.substrate.atoms, (atom)=>{
                return atom.charge(container_after_previous_mechanism_was_applied.substrate.atoms, logger) === 1
        })
        if (undefined !== positive_atom) {
            if (env.debug) {
                logger.log(env.debug_log, "[ReductiveAmination] Not reducing as molecule already has an atom with a positive charge.")
            }
            return false
        }
                        
        // Look for a NC or OC bond
        const atom_to_reverse_reduce = _.find(container_after_previous_mechanism_was_applied.substrate.atoms, (atom) => {
            return atom.singleBonds(container_after_previous_mechanism_was_applied.substrate.atoms).length > 0 && (atom.atomicSymbol === "N" || atom.atomicSymbol === 'O')
        })
        
        if (undefined === atom_to_reverse_reduce) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminationReverse] Path ended - could not find NC or OC bond.').bgRed)
            }
            return false
        }

        const target_bonds = atom_to_reverse_reduce.singleBonds(container_after_previous_mechanism_was_applied.substrate.atoms).filter((bond) => {
            return bond.atom.atomicSymbol === 'C' 
          //  && bond.atom.isTerminalAtom(container_after_previous_mechanism_was_applied.substrate.atoms) === true // @see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
        })

        if (target_bonds.length === 0) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminationReverse] Path ended -  no target bonds found where target atom is a terminal carbon.').bgRed)
            }
            return false
        }

        // Target bond can be more than one carbon bond. So we need to return an array of all possible pathways with each pathway differentiated
        // by the target bond.
        const target_bond = target_bonds[1] // @todo 
        // C
        const target_carbon_atom_in_computed_previous_container = container_after_previous_mechanism_was_applied.substrate.atoms.getAtomByAtomId(target_bond.atom.atomId)
        // Remove proton from carbon
        const proton = target_bond.atom.hydrogens(container_after_previous_mechanism_was_applied.substrate.atoms)[0]
        const proton_target_atom = proton.bonds(container_after_previous_mechanism_was_applied.substrate.atoms, true)[0].atom
        let reduce_container = _.cloneDeep(container_after_previous_mechanism_was_applied)
        reduce_container.getSubstrate()[0].atoms = proton.breakBond(proton_target_atom, reduce_container.getSubstrate()[0], logger)
        // Remove proton from substrate
        _.remove(reduce_container.getSubstrate()[0].atoms, (a)=>{
            return a.atomId === proton.atomId
        })

        if (false === reduce_container.getSubstrate()[0].atoms) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminationReverse] Target carbon has no protons.').bgRed)
            }
            return false
        }
        
        // N
        const atom_to_reduce_reverse_in_computed_previous_container = reduce_container.getSubstrate()[0].atoms.getAtomByAtomId(atom_to_reverse_reduce.atomId)

        // If nitrogen, check for oxygen. If oxygen atom found then return false.
        if ('N'=== atom_to_reduce_reverse_in_computed_previous_container.atomicSymbol) {
            const oxygen = _.find(reduce_container.getSubstrate()[0].atoms, (atom)=>{
                return 'O' === atom.atomicSymbol
            })
            if (undefined !== oxygen) {
                if (env.debug) {
                    logger.log(env.debug_log, "[ReductiveAminationReverse] Oxygen atom found where the atom to reduce reverse is a nitrogen.")
                }
                return false
            }
        }

        const uniq_id = uniqid().substr(uniqid().length-3,3)

        const electron_pair_to_add = [
            target_carbon_atom_in_computed_previous_container.atomicSymbol  +'.' + target_carbon_atom_in_computed_previous_container.atomId + '.' + atom_to_reduce_reverse_in_computed_previous_container.atomId + '.' + uniq_id,
            atom_to_reduce_reverse_in_computed_previous_container.atomicSymbol  + '.' + atom_to_reduce_reverse_in_computed_previous_container.atomId + '.' + target_carbon_atom_in_computed_previous_container.atomId + '.' + uniq_id
        ]

        // remove free electrons from base atom and add new electrons
        const nitrogen_free_electrons = atom_to_reduce_reverse_in_computed_previous_container.freeElectrons()
        _.remove(atom_to_reduce_reverse_in_computed_previous_container.electronPairs, (electron_pair)=>{
            if (electron_pair[1] !== undefined) {
                return false
            }
            return electron_pair[0] === nitrogen_free_electrons[0][0] || electron_pair[0] === nitrogen_free_electrons[1][0]
        })
        atom_to_reduce_reverse_in_computed_previous_container.electronPairs.push(_.cloneDeep(electron_pair_to_add).reverse())
        // Add electron pair to carbon atom to form a double bond
        target_carbon_atom_in_computed_previous_container.electronPairs.push(_.cloneDeep(electron_pair_to_add))

        reduce_container.getSubstrate()[0].atoms = reduce_container.getSubstrate()[0].atoms.map((atom)=>{
            if (atom.atomId === target_carbon_atom_in_computed_previous_container.atomId) {
                atom = target_carbon_atom_in_computed_previous_container
            }
            return atom
        })

        // Remove single electrons from target carbon atom
        _.remove(target_carbon_atom_in_computed_previous_container.electronPairs, (ep)=>{
            return ep.length === 1
        })

        reduce_container.getSubstrate()[0].conjugateAcid = false
        reduce_container.getSubstrate()[0].conjugateBase = false
        // BrC[N+]=C(C)C -> reduce -> BrCNC(C)C
        reduce_container.getSubstrate()[0].smiles_string = reduce_container.getSubstrate()[0].canonicalSmiles(false, reduce_container.getSubstrate()[0].atoms, logger)

        // Remove existing reagents and add reducing agent. This is because adding a reducing agent is treated as a separate step.
        reduce_container.reagents = []
        reduce_container.addReagent('RA:', 1, logger)
        
        reduce_container.mechanism = "Reductive amination step 7 - reduce"
        // CC[N+]=C -> CCNC
        reduce_container.getSubstrate()[0].smiles_string = reduce_container.getSubstrate()[0].canonicalSmiles(false, reduce_container.getSubstrate()[0].atoms, logger)
        containers.push(reduce_container)
        
        const one_two_elimination_reverse_container_pathways = OneTwoEliminationReverse(_.cloneDeep(reduce_container), logger)        
        if (false === one_two_elimination_reverse_container_pathways) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminatonReverse] - 1,2 elimination failed.').bgRed)
            }
            return false
        }
        const one_two_elimination_reverse_container = one_two_elimination_reverse_container_pathways[0][0]
        // "BrCNC(C)([O+])C" -> 1,2 Elimination BrC[N+]=C(C)C
        one_two_elimination_reverse_container.getSubstrate()[0].smiles_string = one_two_elimination_reverse_container.getSubstrate()[0].canonicalSmiles(false, one_two_elimination_reverse_container.getSubstrate()[0].atoms, logger)
        one_two_elimination_reverse_container.mechanism = "Reductive amination step 4 - 1,2 elimination"
        containers.unshift(one_two_elimination_reverse_container)

        // Protonate the nitrogen that is bonded to the carbonyl
        const deprotonate_reverse_container_2 = _.cloneDeep(one_two_elimination_reverse_container)
        const nitrogen = _.find(deprotonate_reverse_container_2.substrate.atoms, (a)=>{
            if ('N' !== a.atomicSymbol) {
                return false
            }
            // Check if atom is bonded to a carbonyl carbon
            const carbon_bond = _.find(a.bonds(deprotonate_reverse_container_2.substrate.atoms, logger), (b)=>{
                if ('C' !== b.atom.atomicSymbol) {
                    return false
                }
                const carbonyl_oxygen_bond = _.find(b.atom.bonds(deprotonate_reverse_container_2.substrate.atoms, logger), (o)=>{
                    if ('O' !== o.atom.atomicSymbol) {
                        return false
                    }
                    return true
                })
                return undefined !== carbonyl_oxygen_bond
            })
            return undefined !== carbon_bond
        })
        if (undefined === nitrogen) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminatonReverse] - Could not find nitrogen that would have been deprotonated.').bgRed)
            }
            return false
        }
        const deprotonated_proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)
        deprotonated_proton[Constants().electron_index] = []
        deprotonate_reverse_container_2.substrate.atoms.push(deprotonated_proton)
        deprotonate_reverse_container_2.substrate.atoms = nitrogen.bondAtomToAtom(
            deprotonated_proton,
            true, 
            deprotonate_reverse_container_2.substrate.atoms, 
            logger
        )
        // Nitrogen will now have a positive charge.
        deprotonate_reverse_container_2.substrate.smiles_string = deprotonate_reverse_container_2.substrate.canonicalSmiles(false, deprotonate_reverse_container_2.substrate.atoms, logger)
        deprotonate_reverse_container_2.mechanism = "Reductive amination step 3 - proton transfer"
        containers.unshift(deprotonate_reverse_container_2)

        const protonate_reverse_container_2 = _.cloneDeep(deprotonate_reverse_container_2)
        const oxygen = _.find(protonate_reverse_container_2.substrate.atoms, (a)=>{
            if ('O' !== a.atomicSymbol) {
                return false
            }
            // Check if atom is bonded to a carbonyl carbon
            const carbon_bond = _.find(a.bonds(protonate_reverse_container_2.substrate.atoms, logger), (b)=>{
                if ('C' !== b.atom.atomicSymbol) {
                    return false
                }
                const carbonyl_nitrogen_bond = _.find(b.atom.bonds(protonate_reverse_container_2.substrate.atoms, logger), (n)=>{
                    if ('N' !== n.atom.atomicSymbol) {
                        return false
                    }
                    return true
                })
                return undefined !== carbonyl_nitrogen_bond
            })
            return undefined !== carbon_bond
        })
        if (undefined === oxygen) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminatonReverse] - Could not find oxygen that would have been protonated.').bgRed)
            }
            return false
        }
        const added_proton = oxygen.hydrogens(protonate_reverse_container_2.substrate.atoms)[0]
        protonate_reverse_container_2.substrate.atoms = added_proton.breakBond(oxygen, protonate_reverse_container_2.substrate, logger)
        // Remove proton from atom
        _.remove(protonate_reverse_container_2.substrate.atoms, (a)=>{
            return a.atomId === added_proton.atomId
        })
        // BrC[N+]C(C)(C)O -> Proton Transfer BrCNC(C)([O+])C
        protonate_reverse_container_2.substrate.smiles_string = protonate_reverse_container_2.substrate.canonicalSmiles(false, protonate_reverse_container_2.substrate.atoms, logger)
        protonate_reverse_container_2.mechanism = "Reductive amination step 3 - proton transfer"
        containers.unshift(protonate_reverse_container_2)
        const lewis_acid_base_reverse_container_pathways = LewisAcidBaseReverse(_.cloneDeep(protonate_reverse_container_2), logger)
        if (false === lewis_acid_base_reverse_container_pathways) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminationReverse] - Lewis acid-base failed.').bgRed)
            }
            return false
        }
        const lewis_acid_base_reverse_container = lewis_acid_base_reverse_container_pathways[0][0]
        // CC(=[O+])C , NCBr
        lewis_acid_base_reverse_container.getSubstrate()[0].smiles_string = lewis_acid_base_reverse_container.getSubstrate()[0].canonicalSmiles(false, lewis_acid_base_reverse_container.getSubstrate()[0].atoms, logger)
        lewis_acid_base_reverse_container.mechanism = "Reductive amination step 2 - 1,2 Addition"
        containers.unshift(lewis_acid_base_reverse_container)

        const protonate_reverse_container_3_pathways = ProtonateReverse(_.cloneDeep(lewis_acid_base_reverse_container), logger)
        if (false === protonate_reverse_container_3_pathways) {
            if (env.debug) {
                logger.log(env.debug_log, ('[ReductiveAminatonReverse] - Could not protonate previous result.').bgRed)
            }
            return false
        }
        const protonate_reverse_container_3 = protonate_reverse_container_3_pathways[0][0]
        // C=O -> Protonation C=[O+]
        protonate_reverse_container_3.substrate.smiles_string = protonate_reverse_container_2.substrate.canonicalSmiles(false, protonate_reverse_container_3.substrate.atoms, logger)
        protonate_reverse_container_3.mechanism = "Reductive amination step 1 - protonate"
        // Here we should end up with a ketone as the substrate
        containers.unshift(protonate_reverse_container_3)

        // Set reagents
        containers[0].reagents = [] // Protonate
        containers[0].addReagent('A:',1, logger)
        
        containers[1].addReagent('A:',1, logger) // Lewis acid base
        
        containers[2].reagents = [] // proton transfer
        containers[2].addReagent('A:',1, logger) 
        containers[2].addReagent('CB:',1, logger)

        containers[3].reagents = [] // proton transfer
        containers[3].addReagent('A:',1, logger) 
        containers[3].addReagent('CB:',1, logger)

        containers[4].reagents = [] // 1,2 elimination
        containers[4].addReagent('A:',1, logger) 
        containers[4].addReagent('CB:',1, logger)

        containers[5].reagents = [] // reduce
        containers[5].addReagent('RA:', 1, logger) 

        pathways.push(containers)

        return pathways
    

    } catch(e) {
        logger.log('error', '[ReductiveAminationReverse] ' + e)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = ReductiveAminationReverse