const Constants = require("../Constants")
const Typecheck = require('../Typecheck')
const render = require('./render')
const _ = require('lodash');
const should = require('should')
const MoleculeFactory = require('../factories/MoleculeFactory');
const FindBreakBondToCarbonAtom = require('../reflection/FindBreakBondToCarbonAtom')
const ExtractAtomGroup = require('../actions/ExtractAtomGroup');
const { B } = require("../factories/PeriodicTable");

const MakeCarbocation = (base_atom, target_carbon, molecule, side_product, logger) =>{

    try {

        Typecheck(
            {name: "target_carbon", value: target_carbon, type: "array"},
            {name: "molecule", value: molecule, type: "object"},
            {name: "side product", value: side_product, type: "array"},
            {name: "logger", value: logger, type: "object"},
        )

        if (target_carbon.atomicSymbol !== 'C') {
            throw new Error('Target atom should be a carbon.')
        }

        if (target_carbon.isCarbocation(molecule.atoms, logger)) {
            throw new Error('Target atom should not already be a carbocation.')
        }

        // This is the non-carbon atom we remove from the target carbon to change the target carbon to a carbocation.
        const break_bond_to_carbon_atom = FindBreakBondToCarbonAtom(target_carbon, molecule, logger)

        // Can't remove an atom from the carbon atom
        if (break_bond_to_carbon_atom === false) {
            logger.log('debug', '[MakeCarbocation] Cannot find an atom to remove from the carbon')
            return false
         }

         if (null !== base_atom && base_atom.atomId === break_bond_to_carbon_atom.atomId){
            logger.log('debug','[MakeCarbocation] Base and break bond to carbon atoms are the same')
            return false
         }

         // C=O, N=O
         // @see https://en.wikipedia.org/wiki/Pinacol_rearrangement
         // @see https://www.organic-chemistry.org/namedreactions/ritter-reaction.shtm step after protonation / deprotonation.
         // ('O' === break_bond_to_carbon_atom.atomicSymbol || 'N' === break_bond_to_carbon_atom.atomicSymbol
         if (
            ('O' === break_bond_to_carbon_atom.atomicSymbol ) &&
            1 === break_bond_to_carbon_atom.doubleBonds(molecule.atoms).length
         ) {
            logger.log('debug', ('[MakeCarbocation] Not making carbocation as break bond to carbon atom is an oxygen or nitrogen with a double bond to the carbon atom.').bgRed)
            return false
         }

         logger.log('debug', '[MakeCarbocation] Determined we need to remove atom ' 
         + break_bond_to_carbon_atom.atomicSymbol +  ' '
         + break_bond_to_carbon_atom.atomId  +  ' '
         + break_bond_to_carbon_atom.charge( molecule.atoms, logger) +  ' '
         + ' to create a carbocation.')
             

        if (false === break_bond_to_carbon_atom.isSingleBondedTo(target_carbon)) {
            
            // 'break_bond_to_carbon_atom' is the atom that will keep the electrons.
            molecule.atoms = break_bond_to_carbon_atom.breakSingleBond(target_carbon, molecule, logger)

            // @todo breakSingleBond() should have removed electrons from the target carbon
            target_carbon.electronPairs = _.remove(target_carbon.electronPairs, (electron_pair)=>{
                return electron_pair.length === 2
            })

            molecule.conjugateAcid = false
        molecule.conjugateBase = false


        } else {

           // console.log('2BREAK bond to carbon atom = ' + break_bond_to_carbon_atom.atomicSymbol)



                // Break bond between target atom and the "break bond to carbon atom" by "collapsing" electron pair
                // onto the "break bond to carbon atom"
                // After breaking the bond the target atom should have an additional charge and
                // the "break bond to carbon atom" should have one less charge.
                // If this is successful it will break the target atom - break_bond_to_carbon_atom and create an additional molecule
                const extracted_atoms = ExtractAtomGroup(
                        molecule,
                        molecule.atoms,
                        target_carbon,
                        break_bond_to_carbon_atom,
                        logger
                ) 
                
    
                if (false !== extracted_atoms) {

                   // console.log('MakeCarbocation() atoms')
                    molecule.atoms.map((a)=>{
                        if (a.atomicSymbol !== 'H'){
                          //  console.log(a)
                        }
                        return a
                    })
                  //  console.log('MakeCarbocation() extracted atoms')
                    extracted_atoms.map((a)=>{
                        if (a.atomicSymbol !== 'H'){
                          //  console.log(a)
                        }
                        return a
                    })
    

                    side_product = MoleculeFactory(
                        extracted_atoms,
                        false,
                        false,
                        logger
                    )

                    const side_product_atom_ids = side_product.atoms.map((atom)=>{
                        return atom.atomId
                    })
                    
                    let molecule_atom_ids = molecule.atoms.map((atom)=>{
                        return atom.atomId
                    })

                    molecule.atoms = molecule.atoms.filter((atom)=>{
                        return side_product_atom_ids.indexOf(atom.atomId) === -1
                    })

                    molecule_atom_ids = molecule.atoms.map((atom)=>{
                        return atom.atomId
                    })

                    molecule.conjugateAcid = false
        molecule.conjugateBase = false

                } else {


                    if ('parent' === break_bond_to_carbon_atom.ringbondType() || 'child' === break_bond_to_carbon_atom.ringbondNumber()) {
                        molecule.atoms = molecule.atoms.map((a)=>{
                             if (a.atomId !== break_bond_to_carbon_atom.atomId && a.ringbondNumber() === break_bond_to_carbon_atom.ringbondNumber()) {
                                 a.removeRingBond()
                             }
                             return a
                        }) 
                        break_bond_to_carbon_atom.removeRingBond()
                     }

                     molecule.conjugateAcid = false
                     molecule.conjugateBase = false

                }

        }

        // Hack
        // @see Prototypes.atomShift()
        _.remove(target_carbon.electronPairs, (electron_pair)=>{
            return electron_pair.length === 1
        }) 

        // Target atom should now be a carbocation
        if (false === target_carbon.isCarbocation(molecule.atoms, logger)) {
            throw new Error('Target atom should now be a carbocation.')
        }

        return {
            'molecule':molecule,
            'target_carbon':target_carbon,
            'side_product':side_product
        }


    } catch(e) {
        logger.log('error', 'MakeCarbocation() '+e.stack)
        console.log('target carbon')
        console.log(target_carbon)
        console.log(e.stack)
        process.exit()
    }

}

module.exports = MakeCarbocation