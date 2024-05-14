

const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const LewisAcidAtom = require('./LewisAcidAtom')
const _ = require('lodash')
const MoleculeFactory = require('../factories/MoleculeFactory')

const FindStrongestLewisAcidMolecule = (molecules, logger) =>{

    try {


        Typecheck(
            {name:"molecules", value:molecules, type:"array"},
            {name:"logger", value:logger, type:"object"},
        )


        // Filter molecules that are strings
        molecules = molecules.filter((m)=>{
            return typeof m !== 'string'
        })

        // Lewis acid molecule is the molecule that will accept the electron pair.
        // Look for molecules with at least one atom that can accept an electron pair
        const molecules_that_can_accept_an_electron_pair = molecules.filter((m)=>{
            const lewis_acid_atom = LewisAcidAtom(m[0], logger)
            return undefined !== lewis_acid_atom
        })

        if (molecules_that_can_accept_an_electron_pair.length === 0) {
            return undefined
        }

        // Get reagent that has a carbocation @todo
        /*
        const molecule_with_carbocation = _.find(molecules_that_can_accept_an_electron_pair, (m)=>{
            return m.hasCarbocation()
        })

        if (undefined !== molecule_with_carbocation) {
            return molecule_with_carbocation
        }
        */
        // Sort molecules by pKa
        const molecules_sorted_by_pKa = molecules_that_can_accept_an_electron_pair.sort((m1,m2)=>{
            return m1.pKa - m2.pKa
        })

        // Clarity
        if (molecules_sorted_by_pKa.length === 0) {
            return 
        } else {
            const strongest_lewis_acid_molecule = molecules_sorted_by_pKa[0]
            return [
                MoleculeFactory(
                    strongest_lewis_acid_molecule[0].atoms,
                    strongest_lewis_acid_molecule[0].conjugateBase,
                    strongest_lewis_acid_molecule[0].conjugateAcid,
                    logger
                ),
                strongest_lewis_acid_molecule[1]
            ]
        }

        //return molecules_sorted_by_pKa.length>0?molecules_sorted_by_pKa[0]:undefined



    } catch(e) {
        logger.log('error', 'FindStrongestLewisAcidMolecule() ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}


module.exports = FindStrongestLewisAcidMolecule