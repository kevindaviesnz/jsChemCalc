const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const FindBreakBondToCarbonAtom =  require('../reflection/FindBreakBondToCarbonAtom')
const _ = require('lodash');
const FormatAs = require('../factories/FormatAs')
/*

Break atom bond within the same molecule.

This should NOT result in two separate molecules. Use LewisAcidBaseReactionReverse() or Dehydrate() instead.
 */


const BreakBondInSameMolecule = (container, logger) => {

    
    
    try {

        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"},
        )

        //container.getSubstrate()[0].atoms.checkBonds('BreakBondInSameMolecule', logger)
    
        // Look for a carbon with five electron pairs
        const illegal_carbon = _.find(container.getSubstrate()[0].atoms, (atom) => {
            return atom.atomicSymbol === "C" && atom.electronPairs().length === 5
        })

        /*
        Here, after finding an "illegal" carbon, we break one of the carbon bonds
        to make the carbon "legal."
        */

        if (undefined !== illegal_carbon) {

    
            // Remove a bond from the carbon
            // Find a nitrogen or oxygen atom
            let target_bond = _.find(illegal_carbon.tripleBonds(container.getSubstrate()[0].atoms), (bond) => {
                return bond.atom.atomicSymbol === 'N' || bond.atom.atomicSymbol === 'O'
            })
            if (null === target_bond || undefined === target_bond) {
                target_bond = _.find(illegal_carbon.doubleBonds(container.getSubstrate()[0].atoms), (bond) => {
                    return bond.atom.atomicSymbol === 'N' || bond.atom.atomicSymbol === 'O'
                })
            }
    
            try {
                if (null !== target_bond && undefined !== target_bond) {
                    container.getSubstrate()[0].atoms = illegal_carbon.breakSingleBond(target_bond.atom, container.getSubstrate()[0], logger)

                    container.getSubstrate()[0].conjugateAcid = false
                    container.getSubstrate()[0].conjugateBase = false
        
                    return true
                } else {
                    throw new Error("BreakBondInSameMolecule() FAILED - no nitrogen or oxygen attached to the carbon found")
                    return false
                }
            } catch(e) {
                return false
            }
    

        } else {

/*
            container.getSubstrate()[0].atoms.map((a)=>{
                if (a.atomicSymbol !== 'H') {
                    console.log(a)
                }
                return a
            })
            */

            // @see https://courses.lumenlearning.com/suny-potsdam-organicchemistry2/chapter/20-4-the-wittig-reaction/
            // For now look for oxygen atom bonded to a phosphorous atom
            const atom = _.find(container.getSubstrate()[0].atoms, (atom) => {
                if('O' !== atom.atomicSymbol && 2 === atom.bonds(container.getSubstrate()[0].atoms).length) {
                    return false
                }
                // Check there is a carbon bond
                if(_.findIndex(atom.bonds(container.getSubstrate()[0].atoms), (bond)=>{
                    return 'C' === bond.atom.atomicSymbol
                }) === -1) {
                    return false
                }
                return _.findIndex(atom.bonds(container.getSubstrate()[0].atoms), (bond)=>{
                    return 'P' === bond.atom.atomicSymbol
                }) !== -1
            })

            if (undefined === atom) {
                throw new Error('Could not find atom with bond to break.')
            }

            // Get carbon atom
            const target_carbon_bond = _.find(atom.bonds(container.getSubstrate()[0].atoms), (bond)=>{
                return 'C' === bond.atom.atomicSymbol
            })

            try {
                if (null !== target_carbon_bond && undefined !== target_carbon_bond) {
                    logger.log('info', 'Broke bond between carbonyl carbon and carbonyl oxygen')
                    container.getSubstrate()[0].atoms = atom.breakSingleBond(target_carbon_bond.atom, container.getSubstrate()[0], logger)

        
                    return true
                } else {
                    throw new Error("BreakBondInSameMolecule() FAILED - unable to find OC bond to break")
                }
            } catch(e) {
                return false
            }

            

        }


    } catch(e) {
        logger.log('info', 'BreakBondInSameMolecule() ' + e)
        console.log(e.stack)
        process.exit()
        return false
    }


}


module.exports = BreakBondInSameMolecule