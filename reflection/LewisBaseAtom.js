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

GET atoms that can donate an electron pair.
Then sort by positive charge, then electronegativity, then size, ...

returns undefined if atom not found

 */

const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const FindMostBaseLewisAtom = require('./FindMostBaseLewisAtom')
const FindAlkeneCarbonAtoms = require('../actions/FindAlkeneCarbonAtoms')
const _ = require('lodash');
const uniqid = require('uniqid');
const FormatAs = require('../factories/FormatAs')

/*

To find the atom of a molecule more apt to be protonated:

Look at the pKa values of the conjugate acids of the groups, remembering that the weaker acid has the stronger conjugate base. The
stronger base is the one more apt to be protonated.
 eg:
 OCCCN
 Because the NH3 group is the weaker acid, the NH2 group is the stronger base, so it is the group more apt to be protonated.

*/


const env = require('../env')

const LewisBaseAtom = (molecule) =>{



        // @todo - work out why mecury with two bonds can donate a pair of electrons even if it has two bonds (mercury has two electrons
        // in it's outer shell).
        // @see https://chem.libretexts.org/Courses/Purdue/Purdue%3A_Chem_26605%3A_Organic_Chemistry_II_(Lipton)/Chapter_11.__Addition_to_pi_Systems/11.1%3A_Electrophilic_Addition/11.1.2_Electrophilic_Addition_to_Alkenes/11.1.2.3%3A_Oxymercuration
        // Look for mecury atom
        const mercury_atom = _.find(molecule.atoms, (atom)=>{
            return 'Hg' === atom.atomicSymbol
        })

        if (undefined !== mercury_atom) {
            const outer_shell_mercury_bonds = mercury_atom.bonds(molecule.atoms)
            if (outer_shell_mercury_bonds.length ==2) { // outer shell electrons are being used
                // Add two more electron to mercury (these are electrons from it's 5th shell)
                const atom_id= mercury_atom.atomId
                // 20 Feb 2023 Replaced 111 and 222 with 
                mercury_atom.electronPairs.push(['Hg.'+atom_id+'.'+ uniqid().substr(uniqid().length-3,3)]) // 111
                mercury_atom.electronPairs.push(['Hg.'+atom_id+'.'+ uniqid().substr(uniqid().length-3,3)]) // 222
                return mercury_atom
            }
        }

        // Note:
        // Water cannot be a lewis base unless it has a positive charge 
        // @see https://socratic.org/questions/how-can-water-be-a-lewis-base
        // Required for pinacol
        // Note: For Ritter we must be able to use water as a base.
        // @see https://en.wikipedia.org/wiki/Ritter_reaction
        if ('[O+]' ===FormatAs(molecule).SMILES()) {
            return
        }
    
        // Get atoms that can donate a lone pair and filter out carbon atoms bonded to carbocations and atoms with a positive charge,
        // and oxygen atoms with a hydrogen.
        let base_atoms = molecule.atoms.filter((atom)=>{
            if('H' === atom.atomicSymbol) {
                return false
            }
            // Check that atom is not bonded to a carbocation or atom with a positive charge,
            if ('C'===atom.atomicSymbol) {
                const carbocation_or_positive_atom_bonded_to_atom = _.find(atom.bonds(molecule.atoms, false), (b)=>{
                    return b.atom.isCarbocation(molecule.atoms) || 1=== b.atom.charge(molecule.atoms)
                })
                return undefined !== carbocation_or_positive_atom_bonded_to_atom
            }
            if ('Cl' === atom.atomicSymbol && 1 === atom.bondCount()) {
                return false
            }
            if ('O' === atom.atomicSymbol && 1 === atom.charge( molecule.atoms)){
                return false
            }
            const free_electrons = atom.freeElectrons()
            return atom.atomicSymbol !== 'H' && (atom.atomicSymbol==='N' || atom.freeElectrons().length > 1)
        })

        // Where there is a C=C bond the base atom will be the most saturated carbon atom
        const alkene_carbon_atoms = FindAlkeneCarbonAtoms(molecule)
        if (false !== alkene_carbon_atoms) {
            return alkene_carbon_atoms.most_saturated_carbon
        }
    
        if (base_atoms.length === 0) {
            return undefined
        }
    
        // Get atoms with a negative charge
        const negative_atoms = base_atoms.filter((atom)=>{
            return atom.charge( molecule.atoms) === -1
        })
    
    
        if (negative_atoms.length > 0) {
            base_atoms = negative_atoms
        } else {
            const partial_negative_atoms = base_atoms.filter((atom)=>{
                return atom.charge( molecule.atoms) === '&-'
            })
            if (partial_negative_atoms.length > 0){
                base_atoms = partial_negative_atoms
            }
        }
    
        // @see https://gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/
        // @todo
        /*
    Where protonation will create a leaving group resulting in a carbocation when the leaving the protonation
    will occur on the atom that results in the most stable carbocation.
     */
   // console.log(negative_atoms)
   // throw new Error('testgin')

    
        // Filter atoms that do not have free electrons
        const base_atoms_with_free_electrons = base_atoms.filter((atom)=>{
            const free_electrons = atom.freeElectrons().filter((electron_pair)=>{
                return electron_pair.length === 1
            })
            return free_electrons.length > 1
        })
    
        const base_atoms_sorted = base_atoms_with_free_electrons.sort((atom1, atom2)=>{
            return FindMostBaseLewisAtom(atom1, atom2, molecule, molecule)
        })
    

        if (0 === base_atoms_sorted.length) {
            return undefined
        }

    
        const base_atom = base_atoms_sorted.pop()

    
        const base_atom_free_electrons = base_atom.freeElectrons().filter((electron_pair)=>{
            return electron_pair.length === 1
        })
    
            if (base_atom_free_electrons.length < 2) {
                throw new Error('Base atom does not have enough free electrons to push an electron pair.')
            }


        return base_atom




}


module.exports = LewisBaseAtom