
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const FindCarbocationCarbonPair = require('./FindCarbocationCarbonPair')

const FormatAs = require('../factories/FormatAs')

const ShiftAkylGroup = function (molecule) {

        const starting_substrate = _.cloneDeep(molecule)

        const atoms = molecule.atoms

        const carbocation_carbon_pair = FindCarbocationCarbonPair(molecule)

        if (carbocation_carbon_pair === false) {
            return false
        }

        const carbon = carbocation_carbon_pair[0]



        const carbon_bonds = carbon.bonds(atoms, false)

        // If the non carbocation carbon has only bonds to carbon then do not do an akyl shift.
        // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement step 4
        if (carbon_bonds.filter((bond)=>{
            'C' === bond.atom.atomicSymbol
        }).length ===3) {
            return false
        }

        // Check that carbon has more than two non hydrogen bonds. Otherwise we will end up creating a terminal carbocation.
        if (carbon_bonds.length < 3) {
            return false
        }

        // Check that the carbon bond is not bonded to a non carbon that has a positive charge. Otherwise we will form a carbocation bonded
        // to an atom with a positive charge.
        const non_carbon_positive_atom = _.find(carbon_bonds, (bond)=>{
            return 'C' !== bond.atom.atomicSymbol && 1 === bond.atom.charge(molecule.atoms)
        })

        if (undefined !== non_carbon_positive_atom) {
            return false
        }

        const carbocation = carbocation_carbon_pair[1]

        if (false === carbocation.isCarbocation(molecule.atoms)) {
            throw new Error("Carbocation should be a carbocation")
        }

        if (carbon.isCarbocation(molecule.atoms)) {
            throw new Error("Carbon should not be a carbocation")
        }

        if (carbon.isTerminalAtom(atoms)) {
            return false
        }

        if (carbon.bonds(atoms).length === 0) {
            return false
        }

        // Get terminal carbon bonded to the carbon that is bonded to the carbocation
        const akyl_shift_carbon_bond = _.find(carbon.bonds(atoms), (bond) => {
            return bond.atom.atomicSymbol === 'C' && bond.atom.isTerminalAtom(atoms) && bond.atom.isSingleBondedTo(carbon)
        })

        if (akyl_shift_carbon_bond === -1 || undefined === akyl_shift_carbon_bond) {
            return false
        }

        // Terminal carbon found
        const akyl_shift_carbon = akyl_shift_carbon_bond.atom

        // Verify terminal carbon is bonded to the carbon that is bonded to the carbocation
        if (false ===akyl_shift_carbon.isSingleBondedTo(carbon)) {
            throw new Error("Akyl shift carbon should have a single bond to carbon atom")
        }

        const carbocation_bonds_before_shift = carbocation.bonds(atoms, true).length
        const carbon_bonds_before_shift = carbon.bonds(atoms, true).length

        molecule = akyl_shift_carbon.atomShift(molecule, carbon, carbocation, atoms, false)

        molecule.conjugateAcid = false
        molecule.conjugateBase = false

        if (carbocation.bonds(atoms, true).length <= carbocation_bonds_before_shift) {
            throw new Error("Carbocation after atom shift should have more bonds")
        }

        if (carbocation.isCarbocation(molecule.atoms)) {
            throw new Error("Carbocation should not be a carbocation after atom shift")
        }

        if (carbon.bonds(atoms, true).length >= carbon_bonds_before_shift) {
            throw new Error("Carbon after atom shift should have less bonds")
        }

        if (false === carbon.isCarbocation(molecule.atoms)) {
            throw new Error("Carbon should be a carbocation after atom shift")
        }

       // molecule.atoms.checkBonds('AkylShift')

        return molecule





}

module.exports = ShiftAkylGroup