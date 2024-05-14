/*


@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877

A Lowery base is a molecule or atom that donates an electron pair.
Params in: molecule


Acid Strength

The less stable the conjugate base the stronger the acid.
The more stable the conjugate base the weaker the acid.
The more positive the more acidic.h
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

GET atoms that can accept an electron pair.
Then sort by positive charge, then electronegativity, then size, ...

returns undefined if atom not found

 */

const Typecheck = require('../Typecheck')
const Constants = require("../Constants")
const _ = require('lodash');
const FindAlkeneCarbonAtoms = require('../actions/FindAlkeneCarbonAtoms');
const FormatAs = require('../factories/FormatAs');

const LewisAcidAtom = (molecule, logger) =>{



        // Check for carbocation
        /*
        Important:A carbocation that is also a carbonyl carbon is generally less reactive than a non-carbonyl carbocation. The
        presence of  the carbonyl group (a carbon-oxygen double bond) and the adjacent oxygen atom stabilizes the positive
        charge on the carbocation through resonance effects, making it less electrophilic and less likely to bond with a
        nucleophile like a nitrogen atom or negatively charged oxygen atom.
        In contrast, a non-carbonyl carbocation, such as a simple primary or secondary carbocation, lacks these stabilizing effects and is more electrophilic and reactive. It readily accepts electron pairs from nucleophiles. So, the reactivity of a carbocation can vary depending on its specific structural features and the chemical context in which it is found.
        */
        const carbocation =molecule.atoms.filter((atom)=>{
            return false === atom.isCarbonylCarbon(molecule.atoms) && atom.isCarbocation(molecule.atoms, logger)
        })[0]

        if (undefined !== carbocation) {
            return carbocation
        }

        // Where there is a C=C bond the base atom will be the most saturated carbon atom
        // @todo : Not if part of benzene ring
        const alkene_carbon_atoms = FindAlkeneCarbonAtoms(molecule, logger)
            if (false !== alkene_carbon_atoms) {
            return alkene_carbon_atoms.least_saturated_carbon
        }

        // Note:
        // Water cannot be a lewis acid unless it has a positive charge
        // @see https://socratic.org/questions/how-can-water-be-a-lewis-base
        if ('[O-]' ===  FormatAs(molecule).SMILES(logger) || 'O' === FormatAs(molecule).SMILES(logger)){
            return
        }


        // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Supplemental_Modules_(Organic_Chemistry)/Amines/Synthesis_of_Amines/Gabriel_Synthesis (bonding Br (reagent) to K+ (substrate))
        // Look for positive non-carbon bonded with one bond and bonded to a non carbon
        // eg [N+][K] (K is acid atom)
        const acid_atom_bonded_to_non_carbon = molecule.atoms.atomsNoHydrogens().filter((atom)=>{
            if (atom.atomicSymbol === 'C') {
                return false
            }
            const bonds = atom.bonds(molecule.atoms).filter((b)=>{
                return b.atom.atomicSymbol !== 'H'
            })

            // Prototypes.charge( atoms, logger)
            // C=O bond
            /*
            if (bonds.length === 1 && bonds[0].atom.atomicSymbol === 'O' && bonds[0].bond_type === '=' && atom.charge( molecule.atoms, logger)===1) {
            logger.log('debug', '[LewisAcidAtom] Skipping atom as it is double bonded')
            return false
            }
            */
            return bonds.length === 1 && bonds[0].atom.atomicSymbol !== 'C' && atom.charge( molecule.atoms, logger)===1
        })[0]


        if (undefined !== acid_atom_bonded_to_non_carbon) {
            logger.log('debug', ('[LewisAcidAtom] Found acid atom bonded to non carbon').bgYellow)
            return acid_atom_bonded_to_non_carbon
        }

        let acid_carbon = null

        // Check for carbon atom with partial positive charge
        acid_carbon = molecule.atoms.filter((atom)=>{
            return atom.atomicSymbol === 'C'
            && atom[Constants().atom_charge_index] === '&+'
        })[0]

        if (undefined !== acid_carbon) {
        return acid_carbon
        }

        // Look for carbon atom double bonded to oxygen
        let acid_carbons = molecule.atoms.filter((atom)=>{
        if (atom.atomicSymbol !== 'C') {
            return false
        }
        // Note: Oxygen atom cannot have a positive charge.
        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement steps 4,5
        const oxygen_bonds = atom.bonds(molecule.atoms).filter((b)=>{
            // @todo bondType should be bond_type
            return b.atom.atomicSymbol === 'O' && b.bondType === '=' // && 0 === b.atom.charge( molecule.atoms, logger)
        })
        return oxygen_bonds.length > 0
        })

        acid_carbon = acid_carbons[0]

        if (undefined !== acid_carbon) {
        return acid_carbon
        }

        // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Supplemental_Modules_(Organic_Chemistry)/Amines/Synthesis_of_Amines/Gabriel_Synthesis
        // Look for non carbocation carbon atom bonded to oxygen
        acid_carbons = molecule.atoms.filter((atom)=>{
            if (atom.atomicSymbol !== 'C' || atom.isCarbocation(molecule.atoms)) {
                return false
            }
            const oxygen_bonds = atom.bonds(molecule.atoms).filter((b)=>{
                return b.atom.atomicSymbol === 'O' && b.bond_type === ''
            })
            return oxygen_bonds.length > 0
        })

        acid_carbon = acid_carbons[0]

        if (undefined !== acid_carbon) {
            return acid_carbon
        }

        // Check for carbon with a triple bond (ref. Ritter reaction https://en.wikipedia.org/wiki/Ritter_reaction)
        acid_carbon = _.find(molecule.atoms, (atom) => {
            return atom.atomicSymbol === "C" && atom.tripleBonds(molecule.atoms).length === 1
        })

        if (undefined !== acid_carbon) {
            return acid_carbon
        }

        // Get atoms that can accept a lone pair
        let acid_atoms = molecule.atoms.filter((atom)=>{
                    return ('C' !== atom.atomicSymbol && 'H' !== atom.atomicSymbol && atom.freeSlots() > 1)
                    || atom.electrons().length === 1 // ionic
        })

       // Get atoms with a positive charge
        const positive_atoms = acid_atoms.filter((atom)=>{
            return atom.charge( molecule.atoms) === 1
        })

        if (positive_atoms.length > 0) {
            acid_atoms = positive_atoms
        } else {
            const partial_positive_atoms = acid_atoms.filter((atom)=>{
                return atom.charge( molecule.atoms) === '&+'
            })
            if (partial_positive_atoms.length > 0){
                acid_atoms = partial_positive_atoms
            }
        }

        try {
            if (acid_atoms.length === 0){
                throw new Error('Acid atom not found Molecule:' + FormatAs(molecule).SMILES())
            }
        } catch(e) {
            return
        }

        // @see https://gomakethings.com/sorting-an-array-by-multiple-criteria-with-vanilla-javascript/
        const acid_atoms_sorted = acid_atoms.sort((atom1, atom2)=>{

            // Chlorine is more acidic than oxygen
            if (atom1[Constants().atom_charge_index]==="Cl") {
                if(atom2[Constants().atom_charge_index]==="O") {
                    return -1
                }
            }

            if (atom1[Constants().atom_charge_index] > atom2[Constants().atom_charge_index]) return -1;
            if (atom2[Constants().atom_charge_index] < atom2[Constants().atom_charge_index]) return 1;

            if (atom1[Constants().atom_electronegativity_index] > atom2[Constants().atom_electronegativity_index]) return -1;
            if (atom2[Constants().atom_electronegativity_index] < atom2[Constants().atom_electronegativity_index]) return 1;

            if (atom1[Constants().atom_size_index] > atom2[Constants().atom_size_index]) return -1;
            if (atom2[Constants().atom_size_index] < atom2[Constants().atom_size_index]) return 1;

            // @todo resonance
            // @todo induction
            // @todo oribital

        })

    const acid_atom = acid_atoms_sorted[0]

    return acid_atom





 

}

module.exports = LewisAcidAtom