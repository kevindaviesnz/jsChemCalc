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
const AtomsFactory = require('../factories/AtomsFactory');

const NucleophillicAttackOnSubstrate = (
    container,
    substrate_electron_pair_acceptor_atom, 
    reagent_electron_pair_donor_atom, 
    reagent_electron_pair_donor_molecule, 
    logger
) => {

    
    try {
        Typecheck(
            {name: "electron pair acceptor atom", value: substrate_electron_pair_acceptor_atom, type: "object"},
            {name: "electron donor pair atom", value: reagent_electron_pair_donor_atom, type: "object"},
            {name: "container", value: container, type: "object"},
            {name: "electron donor pair molecule", value: reagent_electron_pair_donor_molecule, type: "array"},
            {name: "logger", value: logger, type: "object"}
        )

        // Check atoms
       // const substrate_atoms = container.getSubstrate()[0].atoms

        if (_.isEqual(reagent_electron_pair_donor_molecule[0].atoms, container.getSubstrate()[0].atoms)) {
            throw new Error('Donor and acceptor molecules are the same')
        }

        if (substrate_electron_pair_acceptor_atom.atomId === reagent_electron_pair_donor_atom.atomId) {
            throw new Error('Base and target atoms are the same.')
        }

        const substrate_atom_count = container.getSubstrate()[0].atoms.length
        reagent_electron_pair_donor_molecule[0].atoms.map((atom)=>{
            atom.index = atom.index + substrate_atom_count
            return atom
        })

        const ionic_bonds = substrate_electron_pair_acceptor_atom.ionicBonds(container.getSubstrate()[0].atoms)
        if (
            ionic_bonds.length == 1
            && substrate_electron_pair_acceptor_atom.bonds(container.getSubstrate()[0].atoms).length === 1
        ) {

            // Here the reagent changes
            const reagent_electron_pair_donor_molecule_copy = _.cloneDeep(reagent_electron_pair_donor_molecule[0])
            // Remove the acceptor atom (atom with ionic bond) from it's molecule and add to the donor molecule
            substrate_electron_pair_acceptor_atom.breakIonicBond(ionic_bonds[0].atom, container.getSubstrate()[0], logger)
            container.getSubstrate()[0] = RemoveAtom(container.getSubstrate()[0], substrate_electron_pair_acceptor_atom, logger)
            reagent_electron_pair_donor_molecule[0].atoms = AddAtom(reagent_electron_pair_donor_molecule[0], substrate_electron_pair_acceptor_atom, logger)
            if (false === reagent_electron_pair_donor_atom.bondAtomToAtom(substrate_electron_pair_acceptor_atom, false, container.getSubstrate()[0].atoms, logger) ){
                throw new Error('Nucleophilic attack on iconic acid atom failed')
            }
            if (
                reagent_electron_pair_donor_atom.isBondedTo(substrate_electron_pair_acceptor_atom) === false
            ) {
                throw new Error('NucleophilicAttack() Failed to bond donor atom to ionic acid acceptor atom')
            }


            // Add the changed reagent
          //  console.log('REAGENTS7')
          //  console.log(container.reagents)

            container.addReagent(_.cloneDeep(reagent_electron_pair_donor_molecule[0]), 1, logger)

//            throw new Error('Testing')


            //console.log('REAGENTS8')
            //console.log(container.reagents)

            // Make sure the reagent that is already in the container is not changed.
            reagent_electron_pair_donor_molecule = reagent_electron_pair_donor_molecule_copy


        } else {

            // Important: We return the substrate as the combined molecule but the reagent should stay the same
            const reagent_electron_pair_donor_molecule_copy = _.cloneDeep(reagent_electron_pair_donor_molecule)
            const reagent_electron_pair_donor_atom_copy = _.cloneDeep(reagent_electron_pair_donor_atom)

            // Attack on carbon atom
            if (substrate_electron_pair_acceptor_atom.atomicSymbol === 'C' && substrate_electron_pair_acceptor_atom.bondCount(container.getSubstrate()[0].atoms) === 4) {
                substrate_electron_pair_acceptor_atom.removeBondFromCarbon(container.getSubstrate(), logger)
            }

/*
            if (false === substrate_electron_pair_acceptor_atom.bondAtomToAtom(reagent_electron_pair_donor_atom_copy, false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('Nucleophilic attack failed')
            }
            */
            if (false === reagent_electron_pair_donor_atom_copy.bondAtomToAtom(substrate_electron_pair_acceptor_atom, false, container.getSubstrate()[0].atoms,logger)) {
                throw new Error('Nucleophilic attack failed')
            }


            if (
                substrate_electron_pair_acceptor_atom.isBondedTo(reagent_electron_pair_donor_atom_copy) === false
                || reagent_electron_pair_donor_atom_copy.isBondedTo(substrate_electron_pair_acceptor_atom) === false                   
            ) {
                throw new Error('NucleophilicAttackOnSubstrate() Failed to bond acceptor atom to donor atom')
            }

            // @todo We shouldn't need to do this
            container.getSubstrate()[0].atoms = container.getSubstrate()[0].atoms.map((atom)=>{
                if (atom.atomId === substrate_electron_pair_acceptor_atom.atomId) {
                    return substrate_electron_pair_acceptor_atom
                }
                return atom
            })



            reagent_electron_pair_donor_molecule_copy[0].atoms = reagent_electron_pair_donor_molecule_copy[0].atoms.map((atom)=>{
                if (atom.atomId === reagent_electron_pair_donor_atom_copy.atomId) {
                    return reagent_electron_pair_donor_atom_copy
                }
                return atom
            })
            

            container.getSubstrate()[0] = AddAtomsToMolecule(container.getSubstrate()[0], reagent_electron_pair_donor_molecule_copy[0].atoms, logger)
        }

    } catch(e) {
        logger.log('error', 'NucleophillicAttackOnSubstrate() ' + e)
        console.log(e.stack)
        process.exit()
    }

}


module.exports = NucleophillicAttackOnSubstrate