/*


@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877

A Lowery base is a molecule or atom that donates an electron pair.
Params in: molecule


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

 */

const Typecheck = require('../Typecheck')
const Constants = require("../Constants")
const { loggers } = require('winston')
const FindLewisBaseAtom = require('./LewisBaseAtom')
const FormatAs = require('../factories/FormatAs')
const FindMostBaseLewisAtom = require('../reflection/FindMostBaseLewisAtom')
const _ = require('lodash');


const FindMoleculeWithMostBaseLewisAtom = (molecules) =>{

    Typecheck(
        {name:"molecules", value:molecules, type:"array"},
    )

    // Find molecules where there is an atom with a negative charge
    // and sort by size and basity.
    // Note: Sorts less base -> most base
            const molecules_with_a_base_atom = molecules.sort((m1,m2)=>{
                // Sort by size
                if (m1.atoms.length < m2.atoms.length) {
                    return -1
                }
                if (m1.atoms.length > m2.atoms.length) {
                    return -1
                }
            }).filter((molecule)=>{
                return FindLewisBaseAtom(molecule) !== false
            }).sort ((b1, b2) =>  {
                const b1_base_atom = FindLewisBaseAtom(b1)
                const b2_base_atom = FindLewisBaseAtom(b2)
                return FindMostBaseLewisAtom(b1_base_atom, b2_base_atom, b1, b2)
            })

            try {
                if (molecules_with_a_base_atom.length === 0) {
                    throw new Error('FindMoleculesWithMostBaseAtom() No molecules with base atom found')
                }
            } catch(e) {
                consolel.log(e)
                loggers.log('debug', e)
                return false
            }

            return molecules.pop()

}


module.exports = FindMoleculeWithMostBaseLewisAtom