const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const AtomsFactory = require('../factories/AtomsFactory')
const MoleculeFactory = require('../factories/MoleculeFactory')
const Synthesise = require('../AI/Synthesise')
const Reverse = require('../mechanisms/Reverse')
const uniqid = require('uniqid');

const BreakBondInSameMoleculeReverse = require('../mechanisms/BreakBondInSameMoleculeReverse')
const MakeCarbocation = require('../actions/MakeCarbocation')

const env = require('../env');
const { ifError } = require("should");
const { H } = require("../factories/PeriodicTable");
const LewisBaseAtom = require("../reflection/LewisBaseAtom");
const RemoveAtom = require('../actions/RemoveAtom')


const ReduceReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
    ) {

        try {


            Typecheck(
                {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
                {name: "logger", value: logger, type: "object"}
            )

            const pathways = []
         //   return false

      //      container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('ReduceReverse',logger)

            let computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied) 


            // Dihydroxylation, Hydroboration
            // Look for terminal oxygen atom
            const terminal_oxygen = _.find(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                return 'O' === a.atomicSymbol && a.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms)
            })

            if (undefined !== terminal_oxygen) {
                
                
                const terminal_oxygen_bonds = terminal_oxygen.bonds(computed_previous_container.getSubstrate()[0].atoms)
                const carbonyl_carbon = _.find(terminal_oxygen_bonds, (b)=>{
                    return "C" === b.atom.atomicSymbol
                }).atom
               
               
                if (undefined !== carbonyl_carbon) {
                        
                    // Dihydroxylation
                    // @todo Dihydroxylation specific OsO4 
                    // @see Org Chem for dummies P203
                    // Look for adjacent terminal oxygen eg C(O)C(O)
                    const carbonyl_carbon_carbon_with_terminal_oxygen_bonds = carbonyl_carbon.bonds(computed_previous_container.getSubstrate()[0].atoms, logger).filter((b)=>{
                        if ('C' !== b.atom.atomicSymbol) {
                            return false
                        }
                        const child_bonds = b.atom.bonds(computed_previous_container.getSubstrate()[0].atoms, logger)
                        const o_atom_bond = _.find(child_bonds, (o_b)=>{
                            return 'O' === o_b.atom.atomicSymbol && o_b.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms, logger)
                        })
                        return undefined !== o_atom_bond
                    })

                    if (carbonyl_carbon_carbon_with_terminal_oxygen_bonds.length > 0) {
                        
                        // @todo can have more than one adjacent oxygen
                        const adjacent_carbon = carbonyl_carbon_carbon_with_terminal_oxygen_bonds[0].atom
                        const adjacent_oxygen = _.find(adjacent_carbon.bonds(computed_previous_container.getSubstrate()[0].atoms, logger), (b)=>{
                            return 'O' === b.atom.atomicSymbol && b.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms)
                        }).atom
                        
                        // Create oxmium dioxide molecule that we will bond to the two oxygens
                        const oxmium_dioxide = MoleculeFactory(
                            AtomsFactory("O=[Os]=O", logger),
                            false,
                            false,
                            logger
                        )

                        const os_atom = _.find(oxmium_dioxide.atoms, (a)=>{
                            return 'Os' === a.atomicSymbol
                        })

                        // Remove proton from terminal oxygen
                        const proton = terminal_oxygen.hydrogens(computed_previous_container.getSubstrate()[0].atoms)[0]
                        computed_previous_container.getSubstrate()[0].atoms = proton.breakBond(terminal_oxygen, computed_previous_container.getSubstrate()[0], logger)
                        // Remove proton from atom
                        _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                            return a.atomId === proton.atomId
                        })

                        // Remove proton from adjacent oxygen
                        const a_proton = adjacent_oxygen.hydrogens(computed_previous_container.getSubstrate()[0].atoms)[0]
                        computed_previous_container.getSubstrate()[0].atoms = a_proton.breakBond(adjacent_oxygen, computed_previous_container.getSubstrate()[0], logger)
                        // Remove proton from atom
                        _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                            return a.atomId === proton.atomId
                        })


                        terminal_oxygen.makeDativeBond(os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                        adjacent_oxygen.makeDativeBond(os_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                        computed_previous_container.getSubstrate()[0].atoms = [...computed_previous_container.getSubstrate()[0].atoms, ...oxmium_dioxide.atoms]
                        computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)
                        computed_previous_container.reagents = []
                        const water = MoleculeFactory(
                            AtomsFactory("O", logger),
                            false,
                            false,
                            logger
                        )
                        computed_previous_container.addReagent(water, 1, logger)
                        pathways.push([_.cloneDeep(computed_previous_container)])
                    }


                    // Hydroboration
                    // @see Org Chem for dummies P202
                    // OH <--- BH2 (terminal boron)


                    if (container_after_previous_mechanism_was_applied.reagents.length === 2 && container_after_previous_mechanism_was_applied.lookUpReagentBySmiles("OO", logger) 
                        && container_after_previous_mechanism_was_applied.lookUpReagentBySmiles("[Na+]ionic[O-]", logger)
                    ) {
                            // Hydroboration
                            // Replace alcohol group with BH2
                            carbonyl_carbon.breakDativeBond(terminal_oxygen, computed_previous_container.getSubstrate()[0], logger)
                            // Remove oxygen from substrate
                            _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                                return a.atomId === terminal_oxygen.atomId
                            })
                            const boron_atoms = AtomsFactory('[B-]', logger)
                            boron_atoms.map((a)=>{
                                computed_previous_container.getSubstrate()[0].atoms.push(a)
                            })
                            const boron = _.find(boron_atoms, (a)=>{
                                return 'B' === a.atomicSymbol
                            })
                            boron.makeDativeBond(carbonyl_carbon, false, computed_previous_container.getSubstrate()[0].atoms, logger)
                            computed_previous_container.mechanism = "reduce"
                            pathways.push([_.cloneDeep(computed_previous_container)])
    
                    }
                }
            }

            computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

            // Reductive amination
            // Do not reverse reduction if the molecule already has an atom with a positive charge.
            const positive_atom = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom)=>{
                return atom.charge(computed_previous_container.getSubstrate()[0].atoms, logger) === 1
            })

            if (false && undefined === positive_atom) {

                // Look for a NC or OC bond
                const atom_to_reverse_reduce = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom) => {
                    return atom.singleBonds(computed_previous_container.getSubstrate()[0].atoms).length > 0 && (atom.atomicSymbol === "N" || atom.atomicSymbol === 'O')
                })

                if (undefined !== atom_to_reverse_reduce) {

                    const target_bonds = atom_to_reverse_reduce.singleBonds(computed_previous_container.getSubstrate()[0].atoms).filter((bond) => {
                        return bond.atom.atomicSymbol === 'C' 
                        && bond.atom.isTerminalAtom(computed_previous_container.getSubstrate()[0].atoms) === true // @see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
                    })

                    const target_bond = target_bonds[0]
                    // C
                    const target_carbon_atom_in_computed_previous_container = computed_previous_container.getSubstrate()[0].atoms.getAtomByAtomId(target_bond.atom.atomId)
                    // Remove proton from carbon
                    const proton = target_bond.atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms)[0]
                    const proton_target_atom = proton.bonds(computed_previous_container.getSubstrate()[0].atoms, true)[0].atom

                    computed_previous_container.getSubstrate()[0].atoms = proton.breakBond(proton_target_atom, computed_previous_container.getSubstrate()[0], logger)

                    // Remove proton from substrate
                    _.remove(computed_previous_container.getSubstrate()[0].atoms, (a)=>{
                        return a.atomId === proton.atomId
                    })

                    if (false !== computed_previous_container.getSubstrate()[0].atoms) {

                    }

                    // N
                    const atom_to_reduce_reverse_in_computed_previous_container = computed_previous_container.getSubstrate()[0].atoms.getAtomByAtomId(atom_to_reverse_reduce.atomId)

                    // If nitrogen, check for oxygen. If oxygen atom found then return false.
                    if ('N'=== atom_to_reduce_reverse_in_computed_previous_container.atomicSymbol) {
                        const oxygen = _.find(computed_previous_container.getSubstrate()[0].atoms, (atom)=>{
                            return 'O' === atom.atomicSymbol
                        })
                        if (undefined !== oxygen) {
                            if (env.debug) {
                                logger.log(env.debug_log, "[ReduceReverse] Oxygen atom found where the atom to reduce reverse is a nitrogen.")
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

                    computed_previous_container.getSubstrate()[0].atoms = computed_previous_container.getSubstrate()[0].atoms.map((atom)=>{
                        if (atom.atomId === target_carbon_atom_in_computed_previous_container.atomId) {
                            atom = target_carbon_atom_in_computed_previous_container
                        }
                        return atom
                    })

                    // Remove single electrons from target carbon atom
                    _.remove(target_carbon_atom_in_computed_previous_container.electronPairs, (ep)=>{
                        return ep.length === 1
                    })

                    computed_previous_container.getSubstrate()[0].conjugateAcid = false
                    computed_previous_container.getSubstrate()[0].conjugateBase = false
                    computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger)

                    // Remove existing reagents and add reducing agent. This is because adding a reducing agent is treated as a separate step.
                    computed_previous_container.reagents = []
                    computed_previous_container.addReagent('RA:', 1, logger)
                    
                    computed_previous_container.mechanism = "reduce"
                    computed_previous_container.getSubstrate()[0].smiles_string = computed_previous_container.getSubstrate()[0].canonicalSmiles(false, computed_previous_container.getSubstrate()[0].atoms, logger)

                    pathways.push([_.cloneDeep(computed_previous_container)])



                }
    

            } // Reductive amination
                            

            return pathways


        } catch(e) {
            logger.log('error', ('[ReduceReverse] ' + e).bgRed)
            console.log(e.stack)
            process.exit()
        }



    //   Reverse(container, max_steps, 'Reverse reduce', ReduceReverse, pathway_id, (container, resolve)=>{
    const reduce_reverse_fn = ()=>  {

        return (resolve, reject, max_steps) => {

            try {


                target_bonds.map((target_bond, i) => {




                })
            } catch(e) {

                reject(e)
            }

        }
    }

    return Reverse(container, container_before_previous_mechanism_was_applied,  max_steps, 'Reverse reduce', ReduceReverse, last_action, logger, pathway_id, reduce_reverse_fn(), onSuccess)

}

module.exports = ReduceReverse