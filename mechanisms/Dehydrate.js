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
const FindBronstedLoweryBaseAtom = require('../reflection/BronstedLoweryBaseAtom')
const LewisBaseAtom = require('../reflection/LewisBaseAtom')
const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const FormatAs = require('../factories/FormatAs')
const AtomsFactory = require('../factories/AtomsFactory')
const ExtractOHLeavingGroups = require("../actions/ExtractOHLeavingGroups")

const colors = require('colors');
const ENV = require('../env')

colors.enable()

const Dehydrate = (container, logger) => {


    try {

        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"}
        )
    
    
        let carbon_bond =  undefined

        // Find oxygen atom with two hydrogen bonds and bonded to a carbon
        const oxygen_atom = _.find(container.getSubstrate()[0].atoms, (atom)=> {
            if(atom.atomicSymbol !== 'O') {
                return false
            }
            const hydrogens = atom.hydrogens(container.getSubstrate()[0].atoms)
            if (hydrogens.length !==2) {
                return false
            }
            carbon_bond = _.find(atom.bonds(container.getSubstrate()[0].atoms, logger), (bond)=>{
                return bond.atom.atomicSymbol === 'C'
            })
            if (undefined === carbon_bond || false === carbon_bond) {
                return false
            }
            // We need to check if the carbon bonded to the oxygen isn't bonded to another atom with
            // a positive charge. Otherwise we will be creating a carbocation bonded to an atom
            // with a positive charge.
            const carbon_bonds_to_positive_atoms = carbon_bond.atom.bonds(container.getSubstrate()[0].atoms, logger).filter((b)=>{
                return b.atom.charge(container.getSubstrate()[0].atoms,logger) === 1
            })
            if (carbon_bonds_to_positive_atoms.length > 1) {
                return false
            }
            return true
        })

        if (undefined === oxygen_atom) {
            return false
        }

        if (undefined === carbon_bond || false === carbon_bond) {
            return false
        }
    
        // We remove the [O] group from this carbon.
        const carbon_atom = carbon_bond.atom

       // const substrate = _.cloneDeep(container.getSubstrate()[0])
       // const carbon_atom_copy = _.cloneDeep(carbon_atom)
    
        // Break O-C bond by "collapsing" electron pair onto oxygen atom.
        const shared_electron_pairs = carbon_atom.sharedElectronPairs(oxygen_atom)
        // Remove electrons from carbon atom
        carbon_atom.electronPairs = carbon_atom[Constants().electron_index].filter((p)=>{
            return !_.isEqual(p, shared_electron_pairs[0])
        })
        const oxygen_shared_electron_pair = shared_electron_pairs[0].reverse()
        // Remove electrons from oxygen atom
        oxygen_atom.electronPairs = oxygen_atom[Constants().electron_index].filter((p)=>{
            return !_.isEqual(p, oxygen_shared_electron_pair)
        })
        // Readd electron pair as shared electrons
        oxygen_atom.electronPairs.push([oxygen_shared_electron_pair[0]])
        oxygen_atom.electronPairs.push([oxygen_shared_electron_pair[1]])

        // Remove oxygen atom and it's hydrogens from the substrate
        const oxygen_hydrogens = oxygen_atom.hydrogens(container.getSubstrate()[0].atoms)
        container.getSubstrate()[0].atoms = container.getSubstrate()[0].atoms.filter((a)=>{
            return a.atomId !== oxygen_atom.atomId && a.atomId !== oxygen_hydrogens[0].atomId && a.atomId !== oxygen_hydrogens[1].atomId
        })


        container.getSubstrate()[0].conjugateAcid = false
        container.getSubstrate()[0].conjugateBase = false


        // Carbon atom should now be a carbocation
        const is_carbocation = carbon_atom.isCarbocation(container.getSubstrate()[0].atoms, logger)
        if (false === is_carbocation) {
            const test = carbon_atom.isCarbocation(container.getSubstrate()[0].atoms, logger)
            if (ENV.errors) {
                logger.log(ENV.error_log, "[Dehydrate] ERROR. Carbon atom should be a carbocation after removing OH2 group.")
            }
            return false
        }

    
        // All done
      //  container.getSubstrate()[0].atoms.checkBonds('Dehydrate', logger)
        
        return true


    } catch(e) {
        logger.log('error', ('[Dehydrate] ' + e).red)
        console.log(e.stack)
        process.exit()
    }




}

module.exports =  Dehydrate