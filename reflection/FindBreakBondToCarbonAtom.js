const Typecheck = require('../Typecheck')
const Constants = require("../Constants")

/*
When a carbon with four bonds is being attacked we need to determine what atom
to remove from the atom to allow the attack to take place.
This function should not be called if we are doing a SN1/SN2 reaction the leaving
group should have already been removed.
 */
// Note: This will need revising.
const FindBreakBondToCarbonAtom = (carbon_atom, molecule, logger) =>{

    try {
        Typecheck(
            {name:"carbon_atom", value:carbon_atom, type:"array"},
            {name:"molecule", value:molecule, type:"object"},
            {name:"logger", value:logger, type:"object"}
        )

        const carbon_atom_bonds = carbon_atom.bonds(molecule.atoms)
        // Find atom to bonded to carbon and that has a positive charge
        let break_bond = carbon_atom_bonds.filter((bond)=>{
            return bond.atom.atomicSymbol !== "H" && bond.atom.charge( molecule.atoms, logger)=== 1
        })[0]

        if (undefined === break_bond) {
            // @see https://chem.libretexts.org/Bookshelves/Organic_Chemistry/Supplemental_Modules_(Organic_Chemistry)/Amines/Synthesis_of_Amines/Gabriel_Synthesis Basic hydrolysis
            // @todo change to use electronegativity
            // Try looking for nitrogen atom
            break_bond = carbon_atom_bonds.filter((bond)=>{
                return bond.atom.atomicSymbol === 'N'
            })[0]
        }


        /*
        // C(=O)
        // Find atom to bonded to carbon and that has a partial negative charge
        const break_bond = carbon_atom.bonds(molecule.atoms).filter((bond)=>{
            return bond.atom.atomicSymbol!== "H" && bond.atom[Constants().atom_charge_index]=== "&-"
        })[0]
    */
        return break_bond === undefined? false: break_bond.atom

    } catch(e) {
        console.log(e.stack)
        logger.log('error', 'FindBreakBondToCarbonAtom() '+e)
        process.exit()
    }

}

module.exports = FindBreakBondToCarbonAtom