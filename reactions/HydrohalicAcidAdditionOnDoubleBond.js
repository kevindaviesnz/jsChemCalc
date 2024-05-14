
const MoleculeFactory = require('../factories/MoleculeFactory')
const AtomFactory = require('../factories/AtomFactory')
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const MakeCarbocation = require('../actions/MakeCarbocation')
const AtomsFactory = require('../factories/AtomsFactory')
const ExtractOHLeavingGroups = require('../actions/ExtractOHLeavingGroups')
const FindCarbocation = require('../actions/FindCarbocation')
const AddAtom = require('../actions/AddAtom')
const { ConnectionCheckOutFailedEvent } = require('mongodb')

const env = require('../env')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const Deprotonate = require('../mechanisms/Deprotonate')
const Reduce = require('../mechanisms/Reduce')
const LewisAcidBaseReaction = require('./LewisAcidBaseReaction')
const BreakBondInSameMolecule = require('../mechanisms/BreakBondInSameMolecule')
const { P, H } = require('../factories/PeriodicTable')
const Protonate = require('../mechanisms/Protonate')
const FindAlkeneCarbonAtoms = require('../actions/FindAlkeneCarbonAtoms')


const HydrohalicAdditionOnDoubleBond = (container, logger) => {

    try {

        // This is the reverse of an Eliminate reaction
        // @see Org.chem for dum. p320
        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "molecule atoms", value: container.getSubstrate()[0].atoms, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )

       
        // Check reagents for a hydrohalic acid (eg HCl, HBr)
        var hydrohalic_acid_reagent = _.find(container.reagents, r=>{
            return r.isHydrohalicAcid || 'HX' === r
        })

        if (undefined === hydrohalic_acid_reagent) {
            if (env.debug) {
                logger.log(env.debug_log, ('[HydrohalicAdditionToAlkenes] No hydrohalic acid found reagent found.').bgRed)
            }
            return false
        }

        const alkene_carbon_atoms = FindAlkeneCarbonAtoms(container.getSubstrate()[0], logger)
       
        // Convert C=C bond to CC bond.
        //const base_atom = LewisBaseAtom(container.getSubstrate()[0], logger) // this is the most saturated carbon and will be converted into a short-lived carbocation
        const base_atom = alkene_carbon_atoms.most_saturated_carbon

        if (undefined === base_atom) {
            if (env.debug) {
                logger.log(env.debug_log, ('[HydrohalicAcidAdditionOnDoubleBond] Base atom not found so returning false.').bgRed)
            }
            return false
        }

        // Check that base atom is not bonded to a carbocation or an atom with a positive charge
        // Now handled by ../reflection/LewisBaseAtom
        const carbocation_bonded_to_base_atom = _.find(base_atom.bonds(container.getSubstrate()[0].atoms, false), (b)=>{
            return b.atom.isCarbocation(container.getSubstrate()[0].atoms, logger) || 1=== b.atom.charge(container.getSubstrate()[0].atoms, logger)
        })
        if (undefined !== carbocation_bonded_to_base_atom) {
            if (env.debug) {
                logger.log(env.debug_log, ('[HydrohalicAcidAdditionOnDoubleBond] Base atom is bonded to a carbocation or an atom with a positive charge so returning false.').bgRed)
            }
            return false
        }

       // const acid_atom = LewisAcidAtom(container.getSubstrate()[0], logger) // this is the atom that will by protonated
        const acid_atom = alkene_carbon_atoms.least_saturated_carbon


        if (undefined === acid_atom) {
            if (env.debug) {
                logger.log(env.debug_log, ('[HydrohalicAcidAdditionOnDoubleBond] Acid atom not found so returning false.').bgRed)
            }
            return false
        }

        const atoms = base_atom.breakBond(acid_atom, container.getSubstrate()[0], logger)
        if (false === atoms) {
            return false
        }

        container.getSubstrate()[0].atoms = atoms

        if ('HX' === hydrohalic_acid_reagent) {
            // Use HCl as default
            hydrohalic_acid_reagent = MoleculeFactory(
                AtomsFactory('[Cl]', logger),
                false,
                false,
                logger
            )
        } 

        const proton = hydrohalic_acid_reagent.atoms[0]
        
        // Break bond between proton and halide on hydrohalic reagent
        hydrohalic_acid_reagent.atoms[1].breakBond(proton, hydrohalic_acid_reagent, logger)
        // Remove proton from reagent
        _.remove(hydrohalic_acid_reagent.atoms, (a)=>{
            return a.atomId === proton.atomId
        })


        const hydrohalic_acid_reagent_deprotonated = MoleculeFactory(
            hydrohalic_acid_reagent.atoms,
            true,
            false,
            logger
        )

        proton[Constants().electron_index] = []

        // Add proton to acid atom on substrate
        // acid atom should be base atom
        container.getSubstrate()[0].atoms.push(proton)
        //container.getSubstrate()[0].atoms = proton.bondAtomToAtom(acid_atom, true, container.getSubstrate()[0].atoms, logger, false)
        container.getSubstrate()[0].atoms = acid_atom.bondAtomToAtom(proton, true, container.getSubstrate()[0].atoms, logger, false)
//        throw new Error('testing')


        // [X-] atom (regent) attacks substrate carbocation
     //   container.getSubstrate()[0].atoms.checkBonds('HydrohalicAcidAdditionOnDoubleBond', logger)
        return LewisAcidBaseReaction(container, hydrohalic_acid_reagent_deprotonated, container.getSubstrate()[0], hydrohalic_acid_reagent_deprotonated.atoms[0], base_atom, logger)


    } catch(e) {
        logger.log('error', ('[HydrohalicAcidAddition] Critical error: '+e.stack).bgRed)
        console.log(e.stack)
        process.exit()
    }

}

module.exports =  HydrohalicAdditionOnDoubleBond