const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const _ = require('lodash');
const AtomFactory = require('../factories/AtomFactory')
const { loggers } = require("winston");
const isReducingAgent = require('../actions/IsReducingAgent');
const MoleculeFactory = require("../factories/MoleculeFactory");
const ReducingAgents = require("../reflection/ReducingAgents");
const ENV = require("../env");
const uniqid = require('uniqid');
const ExtractAtomGroup = require('../actions/ExtractAtomGroup')
const RemoveAtoms = require('../actions/RemoveAtoms')

const Reduce = (container, logger) => {

   // console.log('Running REduce')
   //logger.log('debug', '[Reduce] Running reduce')

    try {

        Typecheck(
            {name: "molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"},
        )

        // Oxymercuration
        // Look for mercury atom bonded to an oxygen atom
        // Look for NaBH4 reagent
        const oxymercuration_reagent = _.find(container.reagents, (reagent)=>{
            return reagent === 'NaBH4'
        })
        if (undefined !== oxymercuration_reagent) {
            const mercury_atom = _.find(container.getSubstrate()[0].atoms, (atom)=>{
                if ('Hg' !== atom.atomicSymbol) {
                    return false
                }
                const bonds = atom.bonds(container.getSubstrate()[0].atoms, logger)
                if (bonds.length === 0) {
                    return false
                }
                const oxygen_bond = _.find(bonds, (bond)=>{
                    return 'O' === bond.atom.atomicSymbol
                })
                return undefined !== oxygen_bond
            })
    
            if (mercury_atom) {
                // Look for carbon atom that is bonded to the mercury atom but is also bonded to a carbon atom that is bonded to a hydroxyl group
                const mercury_atom_bonds = mercury_atom.bonds(container.getSubstrate()[0].atoms,logger).filter((bond)=>{
                    return 'C' === bond.atom.atomicSymbol 
                })
                const carbon_atom_to_reduce_bond = _.find(mercury_atom_bonds, (mercury_atom_bond)=>{
                    // Hg-C
                    // Look for carbon atom bonded to the possible atom to reduce but is also bonded to a hydroxyl group
                    const atom_to_reduce_carbon_bonds = mercury_atom_bond.atom.bonds(container.getSubstrate()[0].atoms, logger).filter((bond)=>{
                        return 'C' === bond.atom.atomicSymbol
                    })
                    
                    const carboxyl_bond = _.find(atom_to_reduce_carbon_bonds, (carboxyl_bond)=> { //2
                        const hydroxyl_carbon = _.find(carboxyl_bond.atom.bonds(container.getSubstrate()[0].atoms, logger), (bond)=>{ // carboxyl_bond.atom.bonds() has bond to hydroxyl oxygen 
                            if ('O' !== bond.atom.atomicSymbol) {
                                return false
                            }
                            return bond.atom.hydrogens(container.getSubstrate()[0].atoms).length === 1
                        })
                        return undefined !== hydroxyl_carbon
                    })
                    return undefined !== carboxyl_bond
                })
                if (undefined !== carbon_atom_to_reduce_bond) {
                    const carbon_atom_to_reduce = carbon_atom_to_reduce_bond.atom
                    // Break the Hg-C bond, creating a mercury leaving group
                    const reagent_atoms = ExtractAtomGroup(
                        container.getSubstrate()[0],
                        container.getSubstrate()[0].atoms,
                        carbon_atom_to_reduce, // parent 
                        mercury_atom, 
                        logger
                    )
                    const reagent = MoleculeFactory (
                        reagent_atoms,
                        false,
                        false,
                        logger
                    )
                    container.getSubstrate()[0].atoms = RemoveAtoms(
                        container.getSubstrate()[0],
                        reagent.atoms,
                        logger
                    )
                    container.getSubstrate()[0].conjugateAcid = false
                    container.getSubstrate()[0].conjugateBase = false
                    // Add electrons to the atom to reduce so we have enough electrons to add a proton
                    carbon_atom_to_reduce[Constants().electron_index].push(['C.' + uniqid().substr(uniqid().length-3,3) + '.888'])
                    carbon_atom_to_reduce[Constants().electron_index].push(['C.' + uniqid().substr(uniqid().length-3,3) + '.777'])
                    // Add a hydrogen to the carbon atom to reduce.
                    const proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)
                    proton[Constants().electron_index] = []
                    container.getSubstrate()[0].atoms = carbon_atom_to_reduce.bondAtomToAtom(proton, true, container.getSubstrate()[0].atoms, logger)
                    container.getSubstrate()[0].atoms.push(proton)
                    container.addReagent(reagent,1, logger)
                    return true
                }
            }
    
    
        }

        // Reductive amination
        // Look for reducing agent
        const reducing_agent = _.find(container.reagents, (r)=>{
            return r == 'NaBH3CN'
        })

        if (undefined === reducing_agent) {
            logger.log('debug', '[Reduce] No reducing agent found'.bgRed)
            return false
        } 

        // Look for a N=C or O=C bond
        const atom_to_reduce = _.find(container.getSubstrate()[0].atoms, (atom) => {

            return atom.doubleBonds(container.getSubstrate()[0].atoms).length === 1 
            && (
                (atom.atomicSymbol === "N")
                || atom.atomicSymbol === 'O'
            )

        })

        if (undefined === atom_to_reduce) {
            logger.log('debug', ('[Reduce] No atom to reduce found').bgRed)
            return false
        }

        //if (null !== atom_to_reduce && undefined !== atom_to_reduce) {
            if (ENV.debug) {
                logger.log('debug', ('[Reduce] Got atom to reduce ' + atom_to_reduce.atomicSymbol).yellow)
            }

            // Remove a double bond between atom to reduce and carbon
            const target_bond = _.find(atom_to_reduce.doubleBonds(container.getSubstrate()[0].atoms), (bond) => {
                return bond.atom.atomicSymbol === 'C'
            })

            if (undefined === target_bond) {
                logger.log('debug', ('[Reduce] No target bond found').bgRed)
                return false
            }

            if (ENV.debug) {
                logger.log('debug', ('[Reduce] Got target bond ' + target_bond.atom.atomicSymbol).yellow)
            }
            

                container.getSubstrate()[0].atoms = atom_to_reduce.breakBond(target_bond.atom, container.getSubstrate()[0], logger)

                // Add another electron to target atom so we have enough electrons to add a proton
                target_bond.atom[Constants().electron_index].push([target_bond.atom.atomicSymbol + '.' + uniqid().substr(uniqid().length-3,3) + '.999'])

                // Add proton to target atom
                const proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3),logger)
                proton[Constants().electron_index] = []
                container.getSubstrate()[0].atoms = target_bond.atom.bondAtomToAtom(proton, true, container.getSubstrate()[0].atoms, logger)
                container.getSubstrate()[0].atoms.push(proton)

                // Give atom to reduce a neutral charge
                if (-1 === atom_to_reduce.charge(container.getSubstrate()[0].atoms, logger)){
                    const proton_to_add_to_atom_to_reduce = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3),logger)
                    proton_to_add_to_atom_to_reduce[Constants().electron_index] = []
                    container.getSubstrate()[0].atoms = proton_to_add_to_atom_to_reduce.bondAtomToAtom(container.getSubstrate()[0], atom_to_reduce, true, container.getSubstrate()[0].atoms, logger)
                    container.getSubstrate()[0].atoms.push(proton_to_add_to_atom_to_reduce)
                }
                

                container.getSubstrate()[0].conjugateAcid = false
                container.getSubstrate()[0].conjugateBase = false


              // container.getSubstrate()[0].atoms.checkBonds('Reduce', logger)
              //  return container
              return true

            


        



    } catch(e) {
        logger.log('error', 'Reduce() '+e)
        console.log(e.stack)
        process.exit()

    }

    return false


}


module.exports = Reduce