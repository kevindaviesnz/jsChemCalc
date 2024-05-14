

const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const LewisBaseAtom = require('./LewisBaseAtom')
const _ = require('lodash')
const MoleculeFactory = require('../factories/MoleculeFactory')


const FindStrongestLewisBaseMolecule = (molecules, logger) =>{

    try {


        Typecheck(
            {name:"molecules", value:molecules, type:"array"},
            {name:"logger", value:logger, type:"object"},
        )

        // Filter molecules that are strings
        molecules = molecules.filter((m)=>{
            return typeof m !== 'string'
        })

        if (molecules.length === 0) {
            return undefined
        }

        // Lewis base molecule is the molecule that will donate the electron pair.
        // Filter reagents that are weak lewis bases
        const molecules_no_conjugate_bases = molecules.filter((m)=>{
             return false === m[0].isWeakLewisBase
         })
 
         if (0 === molecules_no_conjugate_bases.length) {
             return
         }
 
        /* Amine is an organic compound that contains a nitrogen atom with a lone pair of electrons bonded to one or more alkyl or aryl groups. 
        Amines are derivatives of ammonia (NH3) in which one or more hydrogen atoms have been replaced by organic substituents.
        Amines are nearly always bases */
        // 
        const amine_molecule = _.find(molecules_no_conjugate_bases, (m)=>{
            return m[0].functionalGroups.amine.length > 0
        })

        if (undefined !== amine_molecule) {
            return amine_molecule
        }

        // Sort molecules by pKa
        const molecules_sorted_by_pKa = molecules_no_conjugate_bases.sort((m1,m2)=>{
            return m2[0].pKa - m1[0].pKa
        })

        // Clarity
        if (molecules_sorted_by_pKa.length === 0) {
            return 
        } else {
            const strongest_lewis_base_molecule = molecules_sorted_by_pKa[0]
            return [
                MoleculeFactory(
                    strongest_lewis_base_molecule[0].atoms,
                    strongest_lewis_base_molecule[0].conjugateBase,
                    strongest_lewis_base_molecule[0].conjugateAcid,
                    logger
                ),
                strongest_lewis_base_molecule[1]
            ]
        }


    } catch(e) {
        logger.log('error', 'FindStrongestLewisBaseMolecule() ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}


module.exports = FindStrongestLewisBaseMolecule