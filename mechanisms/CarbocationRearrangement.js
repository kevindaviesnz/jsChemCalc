// @see https://www.masterorganicchemistry.com/2012/08/22/rearrangement-reactions-2-alkyl-shifts/
// See https://www.masterorganicchemistry.com/2012/08/15/rearrangement-reactions-1-hydride-shifts/

/*

FIND carbocation - carbon bond
IF carbocation - carbon bond NOT FOUND
    RETURN false
END IF

SET carbocation type AS 1 OR 2 OR 3 (primary, secondary, tertiary)

CLONE molecule atoms AS hydride shift atoms
CLONE molecule atoms AS akyl shift atoms

IF carbon on carbocation - carbon bond HAS hydrogen
    SHIFT hydrogen to carbocation
    SET hydride shift carbocation type AS 1 OR 2 OR 3 (primary, secondary, tertiary)
END IF

IF carbon on carbocation - carbon bond HAS akyl group
    SHIFT akyl group to carbocation
    SET akyl group shift carbocation type AS 1 OR 2 OR 3 (primary, secondary, tertiary)
END IF

IF NEITHER hydride shift OR akyl group shift
    RETURN false
ENDIF

IF hydride shift carbocation type > akyl group shift carbocation type
   SET molecule atoms TO hydride shift atoms
ELSE
   SET molecule atoms TO akyl shift atoms
END IF
 */

const Constants = require('../Constants')
const Typecheck = require("../Typecheck")
const _ = require('lodash');
const FindCarbocationCarbonPair = require('../actions/FindCarbocationCarbonPair')

const CarbocationRearrangement = (molecule) => {


    const getHydrideShiftType = (carbon, carbocation, hydride_shift_atoms) =>{

        carbocation.isCarbocation(molecule.atoms, logger).should.be.True()
        carbon.isCarbocation(molecule.atoms, logger).should.be.False()

        let hydride_shift_type = 0
        if (carbon.hydrogens(hydride_shift_atoms).length > 0) {
            // Move the hydrogen on the carbon to the carbocation
            const carbocation_bonds_before_shift = carbocation.bonds(hydride_shift_atoms, true).length
            const carbon_bonds_before_shift = carbon.bonds(hydride_shift_atoms, true).length
            // (molecule, source_atom, carbocation, atoms, allow_hydrogens, logger
            molecule = carbon.hydrogens(hydride_shift_atoms)[0].atomShift(molecule, carbon, carbocation, hydride_shift_atoms, true, logger)
            // The carbon is now our carbocation as we have shifted the hydrogen on the carbon to the carbocation atom.
            carbocation.bonds(hydride_shift_atoms, true).length.should.be.greaterThan(carbocation_bonds_before_shift)
            carbocation.isCarbocation(hydride_shift_atoms).should.be.False()
            carbon.bonds(hydride_shift_atoms, true).length.should.be.lessThan(carbon_bonds_before_shift)
            carbon.isCarbocation(hydride_shift_atoms, logger).should.be.True()
            hydride_shift_type = carbon.bonds(hydride_shift_atoms).length
        }
        return hydride_shift_type
    }

    const getAkylShiftType = (carbon, carbocation, akyl_shift_atoms) =>{

        // Carbon is the atom attached to the carbocation
        carbocation.isCarbocation(akyl_shift_atoms).should.be.True()
        carbon.isCarbocation(akyl_shift_atoms, logger).should.be.False()
        carbocation.isSingleBondedTo(carbon).should.be.True()

        let akyl_shift_type = 0

        if (carbon.bonds(akyl_shift_atoms).length > 0) {

            // Get terminal carbon bonded to the carbon that is bonded to the carbocatoin
            const akyl_shift_carbon_bond = _.find(carbon.bonds(akyl_shift_atoms), (bond)=>{
                return bond.atom.atomicSymbol === 'C' && bond.atom.isTerminalAtom(akyl_shift_atoms) && bond.atom.isSingleBondedTo(carbon)
            })

            if (undefined !== akyl_shift_carbon_bond && akyl_shift_carbon_bond !== -1) {
                const akyl_shift_carbon = akyl_shift_carbon_bond.atom
                // Verify terminal carbon is bonded to the carbon that is bonded to the carbocation
                akyl_shift_carbon.isSingleBondedTo(carbon).should.be.True()
                // For testing
                const carbocation_bonds_before_shift = carbocation.bonds(akyl_shift_atoms, true).length
                const carbon_bonds_before_shift = carbon.bonds(akyl_shift_atoms, true).length
                // akyl_shift_carbon is the atom to be shifted
                // Source atom is the atom that akyl_shift_carbon is bonded to.
                // Target atom is where we will be shifting the atom to.
                try {
                    // molecule, source_atom, carbocation, atoms, allow_hydrogens, logger
                    molecule = carbon.atomShift(molecule, akyl_shift_carbon, carbocation, akyl_shift_atoms, false, logger)
                    carbocation.bonds(akyl_shift_atoms, true).length.should.be.greaterThan(carbocation_bonds_before_shift)
                    carbocation.isCarbocation(akyl_shift_atoms, logger).should.be.False()
                    carbon.bonds(akyl_shift_atoms, true).length.should.be.lessThan(carbon_bonds_before_shift)
                    carbon.isCarbocation(akyl_shift_atoms, logger).should.be.True()
                    akyl_shift_type = carbon.bonds(akyl_shift_atoms).length
                    alkyl_shift_type.should.not.be.equal(0)
                } catch(err) {
                    console.log(err.message())
                    console.log("WARNING: Could not shift akyl carbon")
                }
            } else {
                throw new Error('Failed to find akyl shift carbon')
            }

        }

        return akyl_shift_type

    }

    Typecheck(
        {name: "molecule", value: molecule, type: "object"},
    )

    const atoms = molecule.atoms

    const carbocation_carbon_pair = FindCarbocationCarbonPair(molecule, logger)

    if (carbocation_carbon_pair === false) {
        throw new Error('Carbocation carbon pair not found')
        return false
    }

    const carbon = carbocation_carbon_pair[0]
    const carbocation = carbocation_carbon_pair[1]
    carbocation.isCarbocation(molecule).should.be.True()
    carbon.isCarbocation(molecule.atoms, logger).should.be.False()
    carbocation.isCarbocation(molecule.atoms, logger).should.be.True()
    carbon.isCarbocation(molecule.atoms, logger).should.be.False()

    const carbocation_type = carbocation.bonds(atoms).length

    const hydride_shift_atoms = _.cloneDeep(molecule.atoms)
    const akyl_shift_atoms = _.cloneDeep(molecule.atoms)

    let hydride_shift_type = getHydrideShiftType(_.cloneDeep(carbon),_.cloneDeep(carbocation), hydride_shift_atoms)
    let akyl_shift_type = getAkylShiftType(_.cloneDeep(carbon),_.cloneDeep(carbocation), _.cloneDeep(akyl_shift_atoms))

    carbocation_type.should.be.a.Number()
    hydride_shift_type.should.be.a.Number()
    akyl_shift_type.should.be.a.Number()

    if (carbocation_type > akyl_shift_type && carbocation_type > hydride_shift_type) {
        return false
    }

    if (hydride_shift_type >= akyl_shift_type) {
        molecule.atoms = hydride_shift_atoms
    } else {
        molecule.atoms = akyl_shift_atoms
    }


    return molecule


}

module.exports = CarbocationRearrangement