/*

SN1 / E1 / E2reactions use protic solvents. Protic solvents are those that contain O-H or N-H bonds such as water and alcohols.

SN2 reactions use aprotic solvents. Aprotic solvents have no N-H or O-H bonds such as dimethyl sufoxide, CH2CL2, and ethers (R-O-R).

In an E2 reaction the reagent nucleophile deprotonates a carbon that is adjacent to another carbon that has a leaving group.
A double bond is formed between the deprotonated carbon and the adjacent carbon and at the same time the
leaving group leaves.

Params in: container, solvent molecule (nucleophile), nucleophile atom, substrate molecule, substrate carbon, adjacent carbon, leaving group atom.
Params out: container

// @see https://kpu.pressbooks.pub/organicchemistry/chapter/8-1-e2-reactions/

Example:

substrate: 2-Bromo-2-methylpropane
reagent: hydroxide
solvent: diethyl ether
 */


/*
GET leaving group atom
GET carbon on leaving group AS alpha carbon
GET carbon on alpha carbon AS beta carbon
DEPROTONATE beta carbon
MAKE BOND between beta carbon and alpha carbon
BREAK BOND between alpha carbon leaving group atom

 */

const MoleculeFactory = require('../factories/MoleculeFactory')
const AtomFactory = require('../factories/AtomFactory')
const LewisAcidAtom = require('../reflection/LewisAcidAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const MakeCarbocation = require('../actions/MakeCarbocation')
const AtomsFactory = require('../factories/AtomsFactory')
const ExtractOHLeavingGroups = require('../actions/ExtractOHLeavingGroups')
const FindCarbocation = require('../actions/FindCarbocation')
const AddAtom = require('../actions/AddAtom')
const { ConnectionCheckOutFailedEvent } = require('mongodb')

const env = require('../env')
const BondAtomToAtomInSameMolecule = require('../mechanisms/BondAtomToAtomInSameMolecule')
const Reduce = require('../mechanisms/Reduce')
const BreakBondInSameMolecule = require('../mechanisms/BreakBondInSameMolecule')
const { P, H } = require('../factories/PeriodicTable')
const Protonate = require('../mechanisms/Protonate');
const FindCarbocationCarbonPair = require('../actions/FindCarbocationCarbonPair')

const RemoveLeavingGroup = require('../actions/RemoveLeavingGroup')
const Stabilise = require('../actions/Stabilise')
const Deprotonate = require('../mechanisms/Deprotonate')

const E2 = (container, logger) => {

    try {

        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "atoms", value: container.getSubstrate()[0].atoms, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )

        // Look for a reagent that is a negatively charged halide
        const saved_container = _.cloneDeep(container)

        // Remove leaving group - this should result in a carbocation
        products = RemoveLeavingGroup(container.getSubstrate(),logger)
        if (products === false) {
            return false
        } else {
            const carbon_carbocation_pair = FindCarbocationCarbonPair(container.getSubstrate()[0], logger)
            if (false === carbon_carbocation_pair) {
                container = saved_container
                return false
            }

            // Deprotonate the carbon on the carbon-carbocation pair
            Deprotonate(container, logger)
            // Form C=C bond
            return Stabilise(container.getSubstrate(), logger)

        }


    } catch(e) {
        if (env.errors) {
            logger.log(env.error_log, ('[E1] '+e.stack).bgRed)
        }
        console.log(e.stack)
        process.exit()
    }

}

module.exports =  E2