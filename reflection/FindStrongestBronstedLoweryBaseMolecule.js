/*


@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877

A Lowery base is a molecule or atom that donates an electron pair.

Acid Strength

The less stable the conjugate base the stronger the acid.
The more stable the conjugate base the weaker the acid.
The more positive the more acidic.
The more negative the more basic.
The more charge the more unstable.


When atoms are in the same period (row in the periodic table) we look at electronegativity. Atoms
increase in negativity as you along the right. Atoms that are electronegative want electrons (are more acidic as the
conjugate base formed is more stable).

When atoms are in the same group (column in the periodic table) we look at size. As you go down the period table the size
increases. Bigger atoms can spread the electronegativity better and therefore form a more stable conjugate base (are more
acidic).

*/

/*

GET atoms that can donate an electron pair.
Then sort by positive charge, then electronegativity, then size, ...

returns NULL if atom not found

 */

const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const BronstedLoweryBaseAtom = require('./BronstedLoweryBaseAtom')
const _ = require('lodash')

/*

To find the atom of a molecule more apt to be protonated:

Look at the pKa values of the conjugate acids of the groups, remembering that the weaker acid has the stronger conjugate base. The
stronger base is the one more apt to be protonated.
 eg:
 OCCCN
 Because the NH3 group is the weaker acid, the NH2 group is the stronger base, so it is the group more apt to be protonated.

*/


const FindStrongestBronstedLoweryBaseMolecule = (molecules, logger) =>{

    try {


        Typecheck(
            {name:"molecules", value:molecules, type:"array"},
            {name:"logger", value:logger, type:"object"},
        )

        logger.log('debug', ('[FindStongestBronstedLoweryBaseMolecule] ').bgYellow)

        // Look for 'B:'
        const generic_acid_molecule = _.find(molecules, (molecule)=>{
            return 'B:' === molecule[0] || 'CB:' === molecule[0]
        })    

        if (undefined !== generic_acid_molecule) {
            return generic_acid_molecule
        }

        // Filter reagents that are conjugate bases to avoid reverse reactions
        const molecules_no_conjugate_bases = molecules.filter((m)=>{
             // 28/09
             //return typeof m === 'string' || false === m.conjugateBase 
             return true
         })
 
         if (0 === molecules_no_conjugate_bases.length) {
             return
         }
 
        // Amines are nearly always bases
        const amine_molecule = _.find(molecules_no_conjugate_bases, (m)=>{
            return m.amine !== []
        })

        if (undefined !== amine_molecule) {
            return amine_molecule
        }

        // Note: Conjugate bases are weak bases
        let base_molecules = molecules_no_conjugate_bases.filter((molecule)=>{
            // @todo
            if ('[O-]' ===FormatAs(molecule).SMILES(logger)) {
                return true
            }
            // 28/09
            if ('[O+]' ===FormatAs(molecule).SMILES(logger)) {
               return false
            }
            // 28/09
            if ('O' ===FormatAs(molecule).SMILES(logger)) {
                return true
            }
            return 'RA:' !== molecule && 'CA:' !== molecule && 'CB:' !== molecule && null !== BronstedLoweryBaseAtom(molecule, logger) 
            && false === molecule.conjugateBase
        })    


        // Sort molecules by pKa
        const molecules_sorted_by_pKa = base_molecules.sort((m1,m2)=>{
            return m2.pKa - m1.pKa
           // return m1.pKa - m2.pKa
        })

        return molecules_sorted_by_pKa

        /*
        if (0 === base_molecules.length) {
            // Use conjugate base molecule only if we have no choice
              base_molecules = molecules.filter((molecule)=>{
                  return 'CB:' === molecule || (false !== FindBronstedLoweryBaseAtom(molecule, logger) && true === molecule.conjugateBase)
              })    
      
              return base_molecules.length === 1? base_molecules[0]:false
        }
*/
        if (0 === base_molecules.length) {
            logger.log('debug', ('[FindStrongestBronstedLoweryBaseMolecule] Could not find a base molecule to use.').bgRed)
            return null
        }

        // @todo
        const molecules_sorted_by_basity = base_molecules.sort((m1, m2)=>{



            return -1

        })

        const strongest_bronsted_lowery_base = molecules_sorted_by_basity.pop()

        return strongest_bronsted_lowery_base


    } catch(e) {
        logger.log('error', 'FindStrongestBronstedLoweryBaseMolecule() ' + e.stack)
        console.log(e.stack)
        process.exit()
    }


}


module.exports = FindStrongestBronstedLoweryBaseMolecule