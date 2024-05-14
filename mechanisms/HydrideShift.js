// @see https://www.masterorganicchemistry.com/2012/08/22/rearrangement-reactions-2-alkyl-shifts/
// See https://www.masterorganicchemistry.com/2012/08/15/rearrangement-reactions-1-hydride-shifts/



const Constants = require('../Constants')
const Typecheck = require("../Typecheck")
const _ = require('lodash');
const FormatAs = require('../factories/FormatAs');
const FindCarbocationCarbonPair = require('../actions/FindCarbocationCarbonPair');
const { C } = require('../factories/PeriodicTable');
const MoleculeFactory = require('../factories/MoleculeFactory');

const env = require('../env')

const HydrideShift = (container, logger) => {

    try {

        if (env.profiler_on) {
            console.time('HydrideShift()')
        }

        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"},
        )

        if (Array.isArray(container)) {
                throw new Error('Container should be an object, not an array.')
        }

        //container.getSubstrate()[0].atoms.checkBonds('HydrideShift', logger)

        container.getSubstrate()[0].conjugateAcid = false
        container.getSubstrate()[0].conjugateBase = false

        const starting_substrate = _.cloneDeep(container.getSubstrate()[0])
        const atoms = container.getSubstrate()[0].atoms

        const carbocation_carbon_pair = FindCarbocationCarbonPair(container.getSubstrate()[0],logger)

        if (carbocation_carbon_pair === false) {
            logger.log('debug', ('[HydrideShift] No carbocation carbon pair found so not proceeding with hydride shift.').bgRed)

                return false
        }

        const carbon = carbocation_carbon_pair[0]

        const carbon_bonds = carbon.bonds(atoms, false)

        // Check that carbon has at least one hydrogen
        if (carbon.hydrogens(atoms).length === 0) {
            logger.log('debug', ('[HydrideShift] Carbon atom on carbocation must have at least one hydrogen atom'))

            return false
        }

        // Check that the carbon bond is not bonded to a non carbon that has a positive charge. Otherwise we will form a carbocation bonded
        // to an atom with a positive charge.
        const non_carbon_positive_atom = _.find(carbon_bonds, (bond)=>{
            return 'C' !== bond.atom.atomicSymbol && 1 === bond.atom.charge(container.getSubstrate()[0].atoms, logger)
        })

        if (undefined !== non_carbon_positive_atom) {
            logger.log('debug', ('[AkylShift] Carbon atom on carbocation is bonded to a non carbon that has a positive charge').bgRed)

            return false
        }

        const carbocation = carbocation_carbon_pair[1]

        if (false === carbocation.isCarbocation(container.getSubstrate()[0].atoms, logger)) {
            throw new Error("Carbocation should be a carbocation")
        }

        if (carbon.isCarbocation(container.getSubstrate()[0].atoms, logger)) {
            throw new Error("Carbon should not be a carbocation")
        }

        if (carbon.isTerminalAtom(atoms)) {
            logger.log('debug', ('[HydrideShift] Carbon atom on carbon - carbocation pair is a terminal atom so not proceeding with hydride shift.').bgRed)

            return false
        }

        // Get hydrogen bonded to the carbon that is bonded to the carbocation
        const hydrogen_atom_to_shift = carbon.hydrogens(atoms)[0]

        //const carbocation_bonds_before_shift = carbocation.bonds(atoms, true).length
        //const carbon_bonds_before_shift = carbon.bonds(atoms, true).length

         // molecule, source_atom, carbocation, atoms, allow_hydrogens, logger
        container.getSubstrate()[0] = hydrogen_atom_to_shift.atomShift(container.getSubstrate()[0], carbon, carbocation, atoms, true, logger)

        container.getSubstrate()[0].atoms.checkBonds('HydrideShift', logger)


    } catch(e) {

        logger.log('error', 'HydrideShift() '+e)
        console.log(e.stack)
        process.exit()

    }




}

module.exports = HydrideShift