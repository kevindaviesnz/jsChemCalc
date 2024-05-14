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
const AcidBase = require("./AcidBase");
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom');
const { C } = require("../factories/PeriodicTable");
const AddAtom = require("../actions/AddAtom")
const ExtractAtomGroup = require('../actions/ExtractAtomGroup');
const RemoveAtoms = require("../actions/RemoveAtoms");
// @see https://en.wikipedia.org/wiki/Pinacol_rearrangement

const env = require('../env');
const { enable } = require("colors");

const LewisAcidBaseReverse = function(
    container_after_previous_mechanism_was_applied, 
    logger
) {


    try {

        Typecheck(
            {name: "container_after_previous_mechanism_was_applied", value: container_after_previous_mechanism_was_applied, type: "object"},
            {name: "container_after_previous_mechanism_was_applied.substrate", value: container_after_previous_mechanism_was_applied.substrate, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        if (null === container_after_previous_mechanism_was_applied.substrate) {
            throw new Error('Something went wrong. Substrate in container should not be null.')            
        }

        const pathways = []

   //     container_after_previous_mechanism_was_applied.substrate.atoms.checkBonds('LewisAcidBaseReverse', logger)
        const computed_previous_container = _.cloneDeep(container_after_previous_mechanism_was_applied)

        // Find at what point the reaction occurred.
        // @todo
        // For now we will look for a nitrogen with a positive charge that is attached to a carbon where that carbon
        // is single bonded to an oxygen or
        // where there is an oxygen with a positive charge that is attached to a carbon where that carbon
        // is double bonded to a nitrogen.
        // of where there is [Hg+](OAc)OAc bonded to a carbon (oxymercuration) 
        let carbon_atom = null
        let carbon_bond = null
        let carbon_child_atom = null
        let previous_reagent_lewis_base_atom = null

        previous_reagent_lewis_base_atom = _.find(container_after_previous_mechanism_was_applied.substrate.atoms, (atom)=>{
            // @see Oxymercuration
            // Look for carbon atom bonded to Hg(OAc)(OAc)
            // When doing Lewis Acid Base using nitrogen atom the nitrogen atom must have at least one hydrogen.
            // @see Reductive amination
            if ('N' === atom.atomicSymbol) {
                if (env.debug) {
                    logger.log(env.debug_log, ('[LewisAcidBaseReactionReverse] Atom with atomic symbol N found').bgYellow)
                }
                if (atom.charge( computed_previous_container.getSubstrate()[0].atoms, logger) === 1 ) {
                    if (env.debug) {
                        logger.log(env.debug_log, ('[LewisAcidBaseReactionReverse] Atom with atomic symbol N and positive charge found').bgYellow)
                    }
                    const expected_number_of_hydrogens = computed_previous_container.getSubstrate()[0].atoms.calculatedNumberOfHydrogens('LewisAcidBaseReverse', logger)
                    const actual_number_of_hydrogens = computed_previous_container.getSubstrate()[0].atoms.actualNumberOfHydrogens('LewisAcidBaseReverse', logger)
                    // @changed
                    // @see Ritter reaction - N atom is not required to have hydrogens 
                    if (atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length > 1) {
                        if (env.debug) {
                            logger.log(env.debug_log, ('[LewisAcidBaseReactionReverse] Atom with atomic symbol N, positive charge, and more than one hydrogen found').bgYellow)
                        }
                    } else {
                        if (env.debug) {
                            logger.log(env.debug_log, ('[LewisAcidBaseReactionReverse] Atom with atomic symbol N, positive charge, but more than one hydrogen found not found').bgYellow)
                        }
                    }
                }
            }
            if (
                atom.atomicSymbol === 'N' 
                && atom.charge( computed_previous_container.getSubstrate()[0].atoms, logger) === 1 
              //  && atom.hydrogens(computed_previous_container.getSubstrate()[0].atoms).length > 1  // @see Ritter reaction - N atom is not required to have hydrogens
            ) {
                // Look for carbon atom
                // @changed
                // @see Ritter https://en.wikipedia.org/wiki/Ritter_reaction
                // carbon atom bonded to N can't be double or triple bonded to the N
                carbon_bond = _.find(atom.singleBonds(computed_previous_container.getSubstrate()[0].atoms), (maybe_carbon_bond)=>{ // Tested with Reductive
                    if (maybe_carbon_bond.atom.atomicSymbol === 'C') {

                        if (maybe_carbon_bond.atom.doubleBonds(computed_previous_container.getSubstrate()[0].atoms).length > 0 ||
                            maybe_carbon_bond.atom.tripleBonds(computed_previous_container.getSubstrate()[0].atoms).length > 0) {
                                return false
                        }

                        // @changed
                        // @see Ritter reaction - oxygen atom not required
                        // This is required for Reductive amination but breaks Ritter
                        // There isn't any way to do this apart from on a reaction by reaction basis.
                        // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
                        const oxygen_bond = _.find(maybe_carbon_bond.atom.bonds(computed_previous_container.getSubstrate()[0].atoms), (maybe_oxygen_bond)=>{
                            return maybe_oxygen_bond.atom.atomicSymbol === 'O' 
                                && maybe_oxygen_bond.atom.singleBonds(computed_previous_container.getSubstrate()[0].atoms).length === 1
                                && maybe_oxygen_bond.atom.charge( computed_previous_container.getSubstrate()[0].atoms, logger) === 0
                        })
                        if (undefined !== oxygen_bond) { // undefined !== oxygen_bond
                            carbon_child_atom = oxygen_bond.atom

                            return true
                        } else {

                            // @see https://en.wikipedia.org/wiki/Ritter_reaction
                            // Check if the nitrogen atom has a triple bond to a carbon atom
                            if(atom.tripleBonds(computed_previous_container.getSubstrate()[0].atoms).length === 1) {

                                return true
                            } else {
  
                            }
                        }


                        return false // true testing


                    }
                     return false
                })
                if (undefined !== carbon_bond) {
                    carbon_atom = carbon_bond.atom
                    return true
                } else {
                }
            }
            return false
        })        

       // computed_previous_container.getSubstrate()[0].atoms.checkBonds('LewisAcidBaseReaction (2)', logger)

      if (null === carbon_atom) {
        return false
    }

    if (undefined === previous_reagent_lewis_base_atom) {
        return false
    }

 //   const carbon_atom_copy = _.cloneDeep(carbon_atom)
 let reagent_atoms = ExtractAtomGroup(
    computed_previous_container.getSubstrate()[0],
    computed_previous_container.getSubstrate()[0].atoms,
    carbon_atom, // parent 
    previous_reagent_lewis_base_atom, // eg nitrogen
    logger
)

   // reagent_atoms = carbon_atom.breakDativeBond(previous_reagent_lewis_base_atom, computed_previous_container.getSubstrate()[0], logger)

    // Convert CO to C=O or C=N to C#N
    // Create double bond between carbon atom and oxygen atom
    // @see Reductive amination https://cdn.masterorganicchemistry.com/wp-content/uploads/2019/10/3-formation-of-imine-from-ketone-with-amine-full-arrow-pushing-mechanism.gif
    // This must be done after the lewis acid base reagent atoms are removed.
    if (null !== carbon_child_atom) {
            computed_previous_container.getSubstrate()[0].atoms = carbon_child_atom.bondAtomToAtom(carbon_atom, false, computed_previous_container.getSubstrate()[0].atoms, logger)

    }
    const reagent = MoleculeFactory (
        reagent_atoms,
        false,
        false,
        logger
    )
    reagent.smiles_string = reagent.canonicalSmiles(false, reagent.atoms, logger)
    computed_previous_container.reagents = []
    computed_previous_container.addReagent(reagent, 1, logger)
        
        // @todo - this should be done in actions/ExtractAtomGroup
        carbon_atom.electronPairs = carbon_atom.electronPairs.filter((p)=>{
            return p.length > 1
        })
        
        // @todo - this should be done in actions/ExtractAtomGroup
        computed_previous_container.getSubstrate()[0].atoms = RemoveAtoms(
            computed_previous_container.getSubstrate()[0],
            reagent.atoms,
            logger
        )


        computed_previous_container.getSubstrate()[0].conjugateAcid = false
        computed_previous_container.getSubstrate()[0].conjugateBase = false

        if (undefined === computed_previous_container.getSubstrate()[0].atoms) {
            if (env.errors) {
                logger.log(env.error_log, '[LewisAcidBaseReverse] Atoms should not be undefined. ' 
                + container_after_previous_mechanism_was_applied.substrate.canonicalSmiles(false, container_after_previous_mechanism_was_applied.substrate.atoms, logger
                )) 
            }
        }

        
//       computed_previous_container.getSubstrate()[0].atoms.checkBonds('LewisAcidBaseReverse', logger)


        pathways.push([computed_previous_container])

        return pathways


    } catch(e) {
        logger.log('error', '[LewisAcidBaseReverse] ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}

module.exports = LewisAcidBaseReverse