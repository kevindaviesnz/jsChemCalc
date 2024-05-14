/*

A Bronsted Lowery acid is a molecule or atom that donates a proton (H+).

Params in: Acid molecule

See findLewisAcidAtom.js

HA -> H+ + -A conjugate base

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
increases. Bigger atoms can spread the electronegativity better and therefore form a more stable conjugate base (are more basic)

Note: Carbon atoms can not normally donate a proton.
@see https://chem.libretexts.org/Courses/Westminster_College/CHE_261_-_Organic_Chemistry_I/02%3A_Acid-Base_Chemistry_and_Charges_on_Organic_Molecules/2.07%3A_Carbon_Acids#:~:text=So%20far%2C%20we%20have%20limited,an%20integral%20role%20in%20biochemistry.
*/

/*

FIND atom in molecule that has a proton.

 */
const Typecheck = require('../Typecheck')
const Constants = require("../Constants")

const FindBronstedLoweryAcidAtom = (molecule, logger) =>{

    try {

        Typecheck(
            {name:"molecule", value:molecule, type:"object"},
            {name:"logger", value:logger, type:"object"}
        )

     //   logger.log('info', 'FindBronstedLoweryAcidAtom() molecule: ' + molecule.canonicalSmiles)

        // Get atoms that have at least one hydrogen and are not carbon
        // Get atoms that have at least one hydrogen and are not carbon
        // Note: Carbon atoms can not normally donate a proton.
        // @see https://chem.libretexts.org/Courses/Westminster_College/CHE_261_-_Organic_Chemistry_I/02%3A_Acid-Base_Chemistry_and_Charges_on_Organic_Molecules/2.07%3A_Carbon_Acids#:~:text=So%20far%2C%20we%20have%20limited,an%20integral%20role%20in%20biochemistry.
        const acid_atoms = molecule.atoms.filter((atom)=>{
            // @todo Sometimes carbon can donate a proton - see link above
            return atom.hydrogens(molecule.atoms).length > 0 && atom.atomicSymbol !== "C"
        })

        if (acid_atoms.length === 0) {
          //  logger.log('info', 'FindBronstedLoweryAcidAtom() no acid atoms found')
            return false
        }


        // @see https://gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/
        const acid_atoms_sorted = acid_atoms.sort((atom1, atom2)=>{

            // @todo
            // If atoms are in the same group (vertical) we compare size, otherwise we compare negativity.
            // The greater the charge on the atom holding the proton the greater the acidity
            // @update swapped -1,1
            if (atom1[Constants().atom_charge_index] < atom2[Constants().atom_charge_index]) return 1;
            if (atom2[Constants().atom_charge_index] > atom2[Constants().atom_charge_index]) return -1;

            // The more electronegative an atom is the more it is able to hold onto electrons and more acidic.
            if (atom1[Constants().atom_electronegativity_index] < atom2[Constants().atom_electronegativity_index]) return -1;
            if (atom2[Constants().atom_electronegativity_index] > atom2[Constants().atom_electronegativity_index]) return 1;

            // The bigger an atom is the more it is able to hold onto a proton and therefore the less acidic.
            if (atom1[Constants().atom_size_index] < atom2[Constants().atom_size_index]) return 1;
            if (atom2[Constants().atom_size_index] > atom2[Constants().atom_size_index]) return -1;

            return 0

            // @todo resonance
            // @todo induction
            // @todo oribital

        })


        const acid_atom = acid_atoms_sorted.pop()

     //   logger.log('info', 'FindBronstedLoweryAcidAtom() acid atom ' + acid_atom.atomicSymbol + ' ' + acid_atom.atomId + ' '
         //    + acid_atom.charge( molecule.atoms, logger))
       // 
        /*
        console.log('Acid atom')
        console.log(molecule.atoms.map((atom)=> {
            console.log(atom)
        }))


        console.log(acid_atom)

        */

        return acid_atom
            
    } catch(e) {
        console.log(e.stack)
        logger.log('error', 'FindBronstedLoweryAcidAtom() '+e)
        process.exit()
    }
   

}

module.exports = FindBronstedLoweryAcidAtom