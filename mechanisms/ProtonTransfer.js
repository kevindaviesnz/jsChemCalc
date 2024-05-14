/*


@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877
@see https://www.masterorganicchemistry.com/2010/05/19/proton-transfers-can-be-tricky/

Transfer a proton from one atom to another in the same molecule

*/

const BronstedLoweryAcidAtom = require('../reflection/BronstedLoweryAcidAtom')
const BronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const Constants = require('../Constants')
const Typecheck = require("../Typecheck")

const AtomFactory = require('../factories/AtomFactory')
const _ = require('lodash');

const ProtonTransfer = (container, logger) => {

    try {


        Typecheck(
            {name: "container", value: container, type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        // This is the atom that will be obtaining the proton.
        const base_atom = BronstedLoweryBaseAtom(container.getSubstrate()[0], logger)

        // Check that we have gotten the base atom.
        if (undefined === base_atom || false === base_atom) {
            return false
        }

        logger.log('info', 'ProtonTransfer() base atom '+base_atom.atomicSymbol + ' ' + base_atom.atomId)

        // This is the atom that we will get the proton from.
        const target_atom = BronstedLoweryAcidAtom(container.getSubstrate()[0], logger)

        if (undefined === target_atom || false === target_atom) {
            return false
        }


        logger.log('info', 'ProtonTransfer() target atom '+target_atom.atomicSymbol + ' ' + target_atom.atomId(logger))

        if (_.isEqual(target_atom, base_atom)) {
            throw new Error("Base and target atoms are the same " + FormatAs(container.getSubstrate()[0]).SMILES(logger))
        }

        if (_.isEqual(target_atom.atomicSymbol, base_atom.atomicSymbol)) {
            throw new Error("ProtonTransfer() Base and target atoms can't have the same atomic symbol" + FormatAs(container.getSubstrate()[0]).SMILES(logger))
        }

        try {
            if (['O','N'].indexOf(base_atom.atomicSymbol) === -1
                && ['O','N'].indexOf(target_atom.atomicSymbol) === -1) {
                throw new Error('(ProtonTransfer) Target atom and base atom must be nitrogen or oxygen')
            }
        } catch(e) {
            return false
        }

        
        // See Ritter vs Reductive ammination
        // If base atom is nitrogen then target atom must be oxygen.
        // If base atom is oxygen then target atom must be nitrogen.
        // @see https://en.wikipedia.org/wiki/Ritter_reaction
        // @see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png
        if (base_atom.atomicSymbol === 'N' && target_atom.atomicSymbol !== 'O') {
            throw new Error('(ProtonTransfer) Target atom must be oxygen when the base atom is nitrogen')
        }
        if (base_atom.atomicSymbol === 'O' && target_atom.atomicSymbol !== 'N') {
            throw new Error('(ProtonTransfer) Target atom must be nitrogen when the base atom is oxygen')
        }
        // Cannot do proton transfer where nitrogen or the oxygen has a double bond
        if (base_atom.doubleBonds(container.getSubstrate()[0].atoms).length === 1
        || base_atom.tripleBonds(container.getSubstrate()[0].atoms).length === 1
            || target_atom.tripleBonds(container.getSubstrate()[0].atoms).length === 1
            || target_atom.tripleBonds(container.getSubstrate()[0].atoms).length === 1) {
            throw new Error('ProtonTransfer() -> oxygen or nitrogen has a double or triple bond')
        }
        if (target_atom.atomicSymbol === 'N' && target_atom.charge(container.getSubstrate()[0].atoms, logger) !== 1) {
            throw new Error('ProtonTransfer() -> nitrogen must have a positive charge when it is the target atom')
        }


        // Remove proton from acid atom
        // Base atom is attacking a proton on the target atom.
        let proton = target_atom.hydrogens(container.getSubstrate()[0].atoms)[0]
        proton.atomicSymbol.should.be.equal('H')
        container.getSubstrate()[0].atoms = proton.breakSingleBond(target_atom, container.getSubstrate()[0], logger)

        container.getSubstrate()[0].conjugateAcid = false
        container.getSubstrate()[0].conjugateBase = false

        // Check that we have removed the proton from the target atom.
        if (_.findIndex(target_atom.hydrogens(container.getSubstrate()[0].atoms), (hydrogen)=>{
            return _.isEqual(hydrogen, proton)
        }) !== -1) {
            throw new Error('ProtonTransfer() Failed to remove proton from target atom')
        }

        _.remove(container.getSubstrate()[0].atoms, (atom)=>{
            return _.isEqual(atom, proton)
        })
// AtomFactory = (atomicSymbol, charge, index, ringbond, ringbond_type, logger)
        const new_proton =  AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3),logger)
        new_proton[Constants().electron_index] = []

        // Add proton to base atom
        // target_molecule, base_atom, allow_hydrogen_as_base_atom, atoms, logger
        container.getSubstrate()[0].atoms = proton.bondAtomToAtom(false, container.getSubstrate()[0].atoms, logger)
        return true

    } catch(e) {
        logger.log('error', 'ProtonTransfer() '+e)
        console.log(e.stack)
        process.exit()
    }



}

module.exports = ProtonTransfer