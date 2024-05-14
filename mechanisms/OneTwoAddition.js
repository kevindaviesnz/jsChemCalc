/*

@see https://www.masterorganicchemistry.com/2010/05/21/lets-talk-about-the-12-elimination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877
@see https://www.masterorganicchemistry.com/2017/03/22/reactions-of-dienes-12-and-14-addition/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png

 */

const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const FindBreakBondToCarbonAtom =  require('../reflection/FindBreakBondToCarbonAtom')
const FindLewisBaseAtom = require('../reflection/LewisBaseAtom')
const _ = require('lodash');
const LeavingGroupRemoval = require('../mechanisms/LeavingGroupRemoval')
const BondAtomToAtom = require('./BondAtomToAtomInSameMolecule')
const FormatAs = require('../factories/FormatAs');
const CarbocationRearrangement = require("./CarbocationRearrangement");
const FindMoleculeWithMostBaseLewisAtom = require("../reflection/FindMoleculeWithMostBaseLewisAtom")
const AddAtomsToMolecule = require('../actions/AddAtomsToMolecule')

const OneTwoAddition = (container, logger) => {

    try {
        throw new Error('Not implemented correctly')
    } catch(e) {
        // @see https://www.differencebetween.com/what-is-the-difference-between-1-2-addition-and-1-4-addition/
        console.log(e)
        process.exit()
    }


    Typecheck(
        {name: "container", value: container, type: "object"},
        {name: "logger", value: logger, type: "object"},
    )

    try {
        if (Array.isArray(container)) {
            throw new Error('Container should be an object, not an array.')
        }
    } catch(e) {
        console.log('container')
        console.log(container)
        console.log(e)
        process.exit()
    }


    //logger.log('debug', 'Attempting 1,2 Addition - ' + FormatAs(container.getSubstrate()[0]).SMILES(logger))

    // Find reagent lewis base atom
    // Find carbon atom on substrate where the carbon atom has a double bond
    // Break the double bond
    // Bond reagent to carbon atom
    try {

        if (container.reagents.length === 0) {
            throw new Error('1,2 addition No reagents so not proceeding.')
        }

        // Find reagent where there is an atom with a negative charge
        const reagent = FindMoleculeWithMostBaseLewisAtom(container.reagentsAsArray())

        if (reagent === false) {
            throw new Error('1,2 addition Reagent has no atom that can donate an electron pair so not proceeding.')
        }

        const reagent_lewis_base_atom = FindLewisBaseAtom(reagent)
        let substrate_carbon_atom = null

        // First find carbon atom double bonded to a terminal oxygen
        // and if not found find carbon atom double bonded to another carbon atom,
        substrate_carbon_atom = _.find(container.getSubstrate()[0].atoms, (atom)=>{
            return atom.atomicSymbol === 'C' && atom.doubleBonds(container.getSubstrate()[0].atoms).filter((bond)=>{
                return bond.atom.atomicSymbol === 'O'
            }).length === 1
        })

        if (undefined === substrate_carbon_atom) {
            substrate_carbon_atom = _.find(container.getSubstrate()[0].atoms, (atom)=>{
                return atom.atomicSymbol === 'C' && atom.doubleBonds(container.getSubstrate()[0].atoms).filter((bond)=>{
                    return bond.atom.atomicSymbol === 'C'
                }).length === 1
            })
    
        }

        if (undefined === substrate_carbon_atom) {
            substrate_carbon_atom = _.find(container.getSubstrate()[0].atoms, (atom)=>{
                return atom.atomicSymbol === 'C' && atom.doubleBonds(container.getSubstrate()[0].atoms).length === 1
            })
        }


        if (undefined === substrate_carbon_atom) {
            throw new Error('1,2 addition Substrate has no carbon atom with a double bond')
        }

        // Break the carbon double bond
        // Convert double bond to single bond
        // 'this' is the atom that will keep the electrons.
        // Break bond by "collapsing" electron pair onto "atom"
        // After breaking the bond the "this" should have an additional charge and
        // the "atom" should have one less charge.
        const atom_to_break_double_bond = substrate_carbon_atom.doubleBonds(container.getSubstrate()[0].atoms)[0].atom
        substrate_carbon_atom.atoms.breakSingleBond(atom_to_break_double_bond, container.getSubstrate()[0], logger)

        // Bond reagent to substrate
        substrate_carbon_atom.bondAtomToAtom(reagent_lewis_base_atom)
        container.getSubstrate()[0] = AddAtomsToMolecule(container.getSubstrate()[0], reagent.atoms, logger)

        container.reagents.push([])
        
        logger.log('debug', 'Successfully completed 1,2 Addition - ' + FormatAs(container.getSubstrate()[0]).SMILES(logger))

        return true

    } catch(e) {
        console.log(e.stack)
        process.exit()
        return false
    }


}


module.exports = OneTwoAddition