// @see https://en.wikiversity.org/wiki/Reactivity_and_Mechanism

const Typecheck = require('../Typecheck')
const Constants = require('../Constants')
const FormatAs = require('../factories/FormatAs')
const _ = require('lodash');
//const { loggers } = require('winston')
const AddAtomsToMolecule = require('../actions/AddAtomsToMolecule')
const RemoveAtom = require('../actions/RemoveAtom')
const AddAtom = require('../actions/AddAtom');
const MoleculeFactory = require('../factories/MoleculeFactory');


/*
    container,
    substrate_electron_pair_acceptor_atom, 
    reagent_electron_pair_donor_atom, 
    reagent_electron_pair_donor_molecule, 
    logger
) => {
*/

const NucleophillicAttackOnReagent = (
    container,
    reagent_electron_pair_acceptor_atom, 
    substrate_electron_pair_donor_atom, 
    reagent_electron_pair_acceptor_molecule, 
    logger
) => {


    try {

        Typecheck(
            {name: "electron pair acceptor atom", value: reagent_electron_pair_acceptor_atom, type: "array"},
            {name: "electron donor pair atom", value: substrate_electron_pair_donor_atom, type: "array"},
            {name: "electron pair acceptor molecule", value: reagent_electron_pair_acceptor_molecule, type: "object"},
            {name: "electron donor pair molecule", value: container.getSubstrate()[0], type: "object"},
            {name: "logger", value: logger, type: "object"}
        )
    
        if (_.isEqual(container.getSubstrate()[0], reagent_electron_pair_acceptor_molecule)) {
            throw new Error('Donor and acceptor molecules are the same')
        }

        if (reagent_electron_pair_acceptor_atom.atomId === substrate_electron_pair_donor_atom.atomId) {
            throw new Error('Base and target atoms are the same.')
        }
        
        const ionic_bonds = reagent_electron_pair_acceptor_atom.ionicBonds(reagent_electron_pair_acceptor_molecule.atoms)
        /*
        logger.log('info', 'Ionic bonds')
        console.log(ionic_bonds)
        console.log(reagent_electron_pair_acceptor_molecule.atoms[0])
        console.log(reagent_electron_pair_acceptor_molecule.atoms[1])
*/
        if (
            ionic_bonds.length == 1
            && reagent_electron_pair_acceptor_atom.bonds(reagent_electron_pair_acceptor_molecule.atoms).length === 1
        ) {
            // Remove the acceptor atom (atom with ionic bond) from it's molecule and add to the donor molecule
            reagent_electron_pair_acceptor_atom.breakIonicBond(ionic_bonds[0].atom, reagent_electron_pair_acceptor_molecule, logger)
            reagent_electron_pair_acceptor_molecule = RemoveAtom(reagent_electron_pair_acceptor_molecule, reagent_electron_pair_acceptor_atom, logger)
            container.getSubstrate()[0].atoms = AddAtom(container.getSubstrate()[0], reagent_electron_pair_acceptor_atom, logger)

            // target_molecule, base_atom, allow_hydrogen_as_base_atom, atoms, logger
            if (false === substrate_electron_pair_donor_atom.bondAtomToAtom(
                    reagent_electron_pair_acceptor_atom, 
                    false,
                    reagent_electron_pair_acceptor_molecule.atoms,
                    logger
                ) 
            ){
                throw new Error('Nucleophilic attack on iconic acid atom failed')
            }

            if (
                substrate_electron_pair_donor_atom.isBondedTo(reagent_electron_pair_acceptor_atom) === false
             ) {
                throw new Error('NucleophilicAttack() Failed to bond donor atom to ionic acid acceptor atom')
            }


            container.getSubstrate()[0].conjugateAcid = false
            container.getSubstrate()[0].conjugateBase = false



            /*
            container.getSubstrate()[0].atoms.map((a)=>{
                if (a.atomicSymbol !== 'H') {
                   // console.log(a)
                }
                return a
            })
            */
//            throw new Error('Testing')
            return container.getSubstrate()[0]
         //   return reagent_electron_pair_acceptor_molecule


        } else {


            // Important: We return the substrate as the combined molecule but the reagent should stay the same
            const reagent_electron_pair_acceptor_molecule_copy = _.cloneDeep(reagent_electron_pair_acceptor_molecule)
            const reagent_electron_pair_acceptor_atom_copy = _.cloneDeep(reagent_electron_pair_acceptor_atom)

            // Attack on reagent carbon atom so we need to turn the carbon atom into a carbocation
            if (reagent_electron_pair_acceptor_atom_copy.atomicSymbol === 'C' && reagent_electron_pair_acceptor_atom_copy.bondCount(reagent_electron_pair_acceptor_molecule_copy.atoms) === 4) {
                reagent_electron_pair_acceptor_atom_copy.removeBondFromCarbon(reagent_electron_pair_acceptor_molecule_copy, logger)
            }

            // Bond reagent acceptor atom to substrate donor atom.
            // This does not add the reagent acceptor atom to the substrate molecule.
            // Prototypes.bondAtomToAtom(target_molecule, base_atom, allow_hydrogen_as_base_atom, atoms, logger)
            /*
            if (false === reagent_electron_pair_acceptor_atom_copy.bondAtomToAtom(
                    substrate_electron_pair_donor_atom, 
                    false, 
                    reagent_electron_pair_acceptor_molecule_copy.atoms,
                    logger
                )
            ) {
                throw new Error('Nucleophilic attack failed')
            }
            */

            if (false === substrate_electron_pair_donor_atom.bondAtomToAtom(
                reagent_electron_pair_acceptor_atom_copy,
                false, 
                reagent_electron_pair_acceptor_molecule_copy.atoms,
                logger
            )
            ) {
                throw new Error('Nucleophilic attack failed')
            }

            // Bond reagent acceptor atom to substrate donor atom
            if (
               reagent_electron_pair_acceptor_atom_copy.isBondedTo(substrate_electron_pair_donor_atom) === false
                || substrate_electron_pair_donor_atom.isBondedTo(reagent_electron_pair_acceptor_atom_copy) === false                   
            ) {
                throw new Error('NucleophilicAttackOnSubstrate() Failed to bond acceptor atom to donor atom')
            }

            // Replace the atom in the reagent acceptor molecule matching the reagent acceptor atom copy
            reagent_electron_pair_acceptor_molecule_copy.atoms = reagent_electron_pair_acceptor_molecule_copy.atoms.map((atom)=>{
                if (atom.atomId === reagent_electron_pair_acceptor_atom_copy.atomId) {
                    return reagent_electron_pair_acceptor_atom_copy
                }
                return atom
            })

         //   console.log(reagent_electron_pair_acceptor_molecule.atoms[0])
         //   process.exit()

            // Add reagent atoms to the substrate molecule
            container.getSubstrate()[0] = AddAtomsToMolecule(container.getSubstrate()[0], reagent_electron_pair_acceptor_molecule_copy.atoms, logger)

            container.addReagent(reagent_electron_pair_acceptor_molecule_copy, 1, logger)

        }
    

        return container.getSubstrate()[0]


    } catch(e) {
        logger.log('error', 'NucleophillicAttackOnReagent() '+e)
        console.log(e.stack)
        process.exit()
    }



}


module.exports = NucleophillicAttackOnReagent