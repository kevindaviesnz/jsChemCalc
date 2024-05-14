const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const { loggers } = require("winston");
const isOxidisationAgent = require('../actions/IsOxidisationAgent')
const MoleculeFactory = require("../factories/MoleculeFactory");
const MakeCarbocation = require("../actions/MakeCarbocation")
const RemoveAtom = require("../actions/RemoveAtom")

const env = require('../env');
const { C } = require("../factories/PeriodicTable");

const Oxidise = (container, logger) => {

   
   // logger.log('debug', '[Oxidise] Running oxidisation')

    try {

        if(env.debug) {
            logger.log(env.debug_log, '[Oxidise] Running oxidisation')
        }

        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"},
        )

        container.getSubstrate()[0].atoms.checkBonds('Oxidise', logger)

        const starting_substrate = _.cloneDeep(container.getSubstrate()[0])

        // Look for oxidisation agent
        let oxidisation_agent = false

        container.reagents.map((reagent)=>{
            try {
                if ("OA:" === reagent || (typeof reagent !=="string" && isOxidisationAgent(reagent,logger))){
                    oxidisation_agent = _.cloneDeep(reagent)
                }
            } catch(e) {
               // logger.log('error', 'Reduce() '+e)
               // console.log(e.stack)
               // console.log('Reagent:')
               // console.log(reagent)
               // process.exit()
            }
            return reagent
        })
        
        if (oxidisation_agent === false) {
            if (env.debug) {
                logger.log(env.debug_log, '[Oxidise] No oxidisation agent found'.bgRed)
            }
            return false
        } 

        // For now just use oxidisation of a terminal alkene
        // Look for C=C bond where one of the carbons is a terminal atom.
        // We will oxidise the non-terminal carbon.
        let target_bond = null
        const atom_to_oxidise = _.find(container.getSubstrate()[0].atoms, (atom) => {
            if ('C' !== atom.atomicSymbol) {
                return false
            }
            if (atom.hydrogens(container.getSubstrate()[0].atoms).length === 0) {
                return false
            }
            const double_bonds = atom.doubleBonds(container.getSubstrate()[0].atoms)
            if (double_bonds.length === 0) {
                return false
            }
            target_bond = _.find(atom.doubleBonds(container.getSubstrate()[0].atoms), (bond) => {
                return bond.atom.atomicSymbol === 'C' && bond.atom.isTerminalAtom(container.getSubstrate()[0].atoms)
            })
            return undefined !== target_bond
        })

        if (undefined === atom_to_oxidise) {
            if (env.debug) {
                logger.log(env.debug_log, ('[Oxidise]] No atom to reduce found').bgRed)
            }
            return false
        }


        if (env.debug) {
            logger.log(env.debug_log, ('[Oxidise] Got atom to oxidise ' + atom_to_oxidise.atomicSymbol).yellow)
            logger.log(env.debug_log, ('[Oxidise] Got target bond ' + target_bond.atom.atomicSymbol).yellow)
        }
            
        // Remove a double bond between atom to oxidise and terminal carbon
        // We are only dealing with one shared electron pair
        const shared_electron_pair = atom_to_oxidise.sharedElectronPairs(target_bond.atom)[0]
        _.remove(atom_to_oxidise.electronPairs, (ep)=>{
            return _.isEqual(shared_electron_pair, ep)
        })
        shared_electron_pair.reverse()
        _.remove(target_bond.atom.electronPairs, (ep)=>{
            return _.isEqual(shared_electron_pair, ep) 
        })
       // target_bond.atom.electronPairs.push([shared_electron_pair[0]])
        //target_bond.atom.electronPairs.push([shared_electron_pair[1]])

        // Add proton to target_bond_atom
        // const AtomFactory = (atomicSymbol, charge, index, ringbond, ringbond_type, logger) => {
        const proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)
        proton[Constants().electron_index] = [] 
        target_bond.atom.electronPairs.push([shared_electron_pair[0], shared_electron_pair[1]])
        proton.electronPairs.push([shared_electron_pair[1], shared_electron_pair[0]])
        container.getSubstrate()[0].atoms.push(proton)

        // Add oxygen double bond to atom to oxidise
        // atomicSymbol, charge, index, ringbond, ringbond_type, logger
        const oxygen = AtomFactory('O', 0, 0, 0, '',uniqid().substr(uniqid().length-3,3),logger)
        // bondAtomToAtom(target_molecule, base_atom, allow_hydrogen_as_base_atom, atoms, logger)
        // At this point atom_to_oxidise should be a carbocation
        const free_oxygen_electrons = oxygen.freeElectrons()
        atom_to_oxidise.electronPairs.push([free_oxygen_electrons[0][0], free_oxygen_electrons[1][0]])
        
        // Remove hydrogen from atom_to_oxidise
        const hydrogen = atom_to_oxidise.hydrogens(container.getSubstrate()[0].atoms)[0]
        const hydrogen_shared_electron_pair = hydrogen.sharedElectronPairs(atom_to_oxidise)[0]
        hydrogen_shared_electron_pair.reverse()
        _.remove(atom_to_oxidise.electronPairs, (ep)=>{
            return _.isEqual(hydrogen_shared_electron_pair, ep) 
        })
        _.remove(container.getSubstrate()[0].atoms, (atom)=>{
            return hydrogen.atomId === atom.atomId
        })

        // Add another bond between O and atom_to_oxidise
        atom_to_oxidise.electronPairs.push([free_oxygen_electrons[2][0], free_oxygen_electrons[3][0]])

        // Remove free electrons from oxygen
        _.remove(oxygen.electronPairs, (ep)=>{
            return ep.length === 1
        })

        // Re-add oxygen free electrons as bonds
        oxygen.electronPairs.push([free_oxygen_electrons[1][0], free_oxygen_electrons[0][0]])
        oxygen.electronPairs.push([free_oxygen_electrons[3][0], free_oxygen_electrons[2][0]])

        container.getSubstrate()[0].atoms.push(oxygen)

         container.getSubstrate()[0].conjugateAcid = false
                  container.getSubstrate()[0].conjugateBase = false
         
         return true



    } catch(e) {
        logger.log('error', 'Oxidise() '+e)
        console.log(e.stack)
        process.exit()

    }

    return false


}


module.exports = Oxidise