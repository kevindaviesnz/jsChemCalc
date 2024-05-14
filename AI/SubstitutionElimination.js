const ExtractLeavingGroups = require('../actions/ExtractLeavingGroups')

const SubstitutionElimination = (container) => {

    /*
    Requirements or both SN* and E*
    1. Leaving group attached to partially charged carbocation.
    2. Solvent
    3. (Partially charged) carbocation
    4. Reagent
    5. Nucleophile
     */

    const nucleophile_atom = FindLewisBaseAtom(container.reagent)



    const substrate = container.getSubstrate()[0]
    const solvent = container.solvent
    const atoms = substrate.atoms

    // Get partially charged carbocation attached to a leaving group.
    const partial_charged_carbocation = FindSN1CarbonAtom(substrate)

    try {
        if (undefined === partial_charged_carbocation) {
            throw new Error('Not doing substitution/elimination as no partial carbocation attached to a leaving group found.')
        }
    } catch(e) {
        console.log(e)
        return false
    }

    // We already know the partial charged carbocation has a leaving group so no need to check.
    const leaving_group = ExtractLeavingGroups(partial_charged_carbocation, logger)[0]

    // We can have either an SN* or E* reaction

    /*
    Requirements for SN*
    1. Nucleophile reagent



     */

    /*
    Requirements for SN2
    1. Substrate must not have more 2 R bonds (steric hindrance)
    2. A strong nucleophile.
    3. Polar aprotic solvent.

    */

    /*
    Requirements for SN1
    1. A stable carbocation intermediate.
    2. Polar protic solvent.
    */

    // Try SN2
    try {
        if (substrate.bonds(atoms).length < 3 && nucleophile_atom.nucleophilicity > 3 && solvent.isAProtic()) {
            return 'SN2'
        } else {
           throw new Error('Not doing SN2 as either too many R bonds around carbocation, weak nucleophile or solvent is not polar aprotic')
        }
    } catch(e) {
        console.log(e)
        // Try SN1
        try {
            if (partical_carbocation.carbocationStability() > 3 && solvent.isPolarProtic()) {
                return 'SN1'
            } else {
                throw new Error('Not doing SN1 as as intermediate carbocation is too unstable or solvent is not polar protic')
            }
        } catch(e) {
            console.log(e)


        }

    }




}


module.exports = SubstitutionElimination
