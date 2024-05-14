/*

Params in: container
Return: container

Example

Water may be protonated by sulfuric acid:
H2SO4 + H2O ⇌ H3O+ + HSO-4

 */

/*

CALL findProtonInContainer using container RETURN proton
CALL findElectronPairDonorAtom using container RETURN donor atom
GET electron pair from donor atom
CALL pushElectronPair using proton, donor atom, electron pair, container RETURN container

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
/*
Where protonation will create a leaving group resulting in a carbocation when the leaving cd the protonation
will occur on the atom that results in the most stable carbocation
 */

const Hydrate = (container, logger) => {

    try {

        // @todo For alkenes hydration occurs on the double bond.

        // Not correct:  CC([O-])(C(C)(C)[O+])C [hydration] ---> CC(O)(C(C)(C)C)[O+]
        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"}
        )

        
        container.getSubstrate()[0].atoms.checkBonds('Hydrate', logger)

        if (false === container.lookUpReagent(
            MoleculeFactory(
                AtomsFactory('O', logger),
                false,
                false,
                logger    
            ),
            logger
        )) {
            if (env.debug) {
                logger.log(env.debug_log, ('[Hydrate] No water reagent found.').bgRed)
            }
            return false
        }

        const starting_substrate = _.cloneDeep(container.getSubstrate()[0])

        // Do not hydrate when there is already a water group or oxygen with a double bond
        const oxygen_with_two_hydrogens_or_double_bond = _.find((container.getSubstrate()[0].atoms), (atom)=>{
            if('O' === atom.atomicSymbol && (2 === atom.hydrogens(container.getSubstrate()[0].atoms, logger).length 
                || 1 === atom.doubleBonds(container.getSubstrate()[0].atoms,logger).length)) {
                return true
            } 
            return false
        })

        if (undefined !== oxygen_with_two_hydrogens_or_double_bond) {
            if (env.debug) {
                logger.log(env.debug_log, ('[Hydrate] Oxygen with two hydrogens or double bond found').bgRed)
            }
            return false
        }

        // Note: After adding the water molecule a hydrogen is removed from the oxygen.
        // For simpicity we use [O-]
        // @see https://en.wikipedia.org/wiki/Ritter_reaction
        const water = MoleculeFactory(
            AtomsFactory('O',logger),
            false,
            false,
            logger
        )

        // Find the oxygen atom
        const oxygen_atom = _.find(water.atoms, (atom)=>{
            return atom.atomicSymbol === 'O'
        })

        // Get the atom to be "hydrated
        // For this we use the Lewis definition of an acid as being something that accepts a pair of electrons,
        // in this case from the water atom.
        const atom_to_be_hydrated = LewisAcidAtom(container.getSubstrate()[0], logger)

        if (undefined === atom_to_be_hydrated) {
            return false
        }

        if (atom_to_be_hydrated.atomicSymbol !== 'C' ||  atom_to_be_hydrated.bondCount(container.getSubstrate()[0].atoms) === 4444) {
            if (env.debug) {
                logger.log(env.debug_log, ('[Hydrate] Atom to be hydrated is not a carbon.').bgRed)
            }
            return false
        }

        if(atom_to_be_hydrated.bonds(container.getSubstrate()[0].atoms, false).filter((bond)=>{
            return bond.bond_type === '=' && bond.atom.atomicSymbol === 'O'
        }).length === 1) {
            if (env.debug) {
                logger.log(env.debug_log, ('[Hydrate] Atom to be hydrated has a double bond to oxygen.').bgRed)
            }
            return false
        }


        // If needed make room for the oxygen atom
        let side_product = []

        if (false === atom_to_be_hydrated.isCarbocation(container.getSubstrate()[0].atoms, logger)) {
            if (env.debug) {
                logger.log(env.debug_log, ('[Hydrate] Could not hydrate as could not find a carbocation').bgRed)
            }
            return false
        }
        /*
        // This causes errors
        if (false === atom_to_be_hydrated.isCarbocation(container.getSubstrate()[0].atoms, logger)) {
            const products = MakeCarbocation(null, atom_to_be_hydrated, container.getSubstrate()[0], side_product, logger)
            if (false === products) {
                logger.log('env.error_log, ('[Hydrate] Could not create a carbocation so not proceeding with hydration.').bgRed)
                return false
            }
            container.getSubstrate()[0] = products.molecule
        }
        */

        container.getSubstrate()[0].atoms = AddAtom(container.getSubstrate()[0], oxygen_atom, logger) // return a molecule

        // Here we push an electron pair from the oxygen atom to the target atom (atom to be hydrated).
       // container.getSubstrate()[0] = atom_to_be_hydrated.bondAtomToAtom(oxygen_atom, true, container.getSubstrate()[0].atoms, logger)
       container.getSubstrate()[0].atoms = oxygen_atom.bondAtomToAtom(atom_to_be_hydrated, true, container.getSubstrate()[0].atoms, logger)

        if (atom_to_be_hydrated.isSingleBondedTo(oxygen_atom) === false) {
            throw new Error('Failed to bond atom to oxygen atom.')
        }

        // If we have a side product then add it to reagents
        if (side_product.length > 0) {
            container.reagents[container.reagents.length-1].push(side_product)

        }

        // Add water atoms to substrate
        // @todo change so that atoms is a constant
        // ie const atoms = _.clone(container.getSubstrate()[0].atoms
        // testing
      //  container.getSubstrate()[0].atoms.push(oxygen_atom)

        oxygen_atom.hydrogens(water.atoms).map((hydrogen)=>{
           container.getSubstrate()[0].atoms.push(hydrogen)
        })
        
        // Generate new canonical smiles etc
        container.getSubstrate()[0].atoms.checkBonds('Hydrate', logger)

        return true

    } catch(e) {
        logger.log('error', ('[Hydrate] '+e).bgRed)
        console.log(e.stack)
        process.exit()
    }

}

module.exports =  Hydrate