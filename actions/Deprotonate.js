
const _ = require('lodash')
const Constants = require('../Constants')
const Typecheck = require('../Typecheck')
const RemoveAtom = require('../actions/RemoveAtom')
const AddAtom = require('../actions/AddAtom')
const MoleculeFactory = require('../factories/MoleculeFactory')
const AtomFactory = require('../factories/AtomFactory')

// acid_atom, acid_atom_molecule, base_atom, base_atom_molecule
// target_atom, target_atom_molecule, base_atom, base_atom_molecule
const env = require('../env')

const Deprotonate = (base_atom_molecule, base_atom, target_atom_molecule, target_atom, logger) => {

    try {

        Typecheck(
            {name: "logger", value: logger, type: "object"}
        )
        

        if (typeof target_atom !== 'string') {

            if (target_atom.hydrogens(target_atom_molecule.atoms).length === 0) {
                if (env.debug) {
                    logger.log(env.debug_log, "[Deprotonate] Target atom has no hydrogens")
                }
                return false
            }

            // Remove proton from target atom
            let proton = target_atom.hydrogens(target_atom_molecule.atoms)[0]
            target_atom_molecule.atoms = proton.breakBond(target_atom, target_atom_molecule, logger)        
            target_atom_molecule = RemoveAtom(target_atom_molecule, proton, logger)


            
        }

        // Bond proton to base atom
        // We also need to add the proton the the base atoms
        // target_molecule, base_atom, allow_hydrogen_as_base_atom, atoms, logger
        const uniqid = require('uniqid');
        const new_proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length-3,3), logger)

        if (-1 === ['B:', 'CB:'].indexOf(base_atom_molecule)) {
           // base_atom_molecule = new_proton.bondAtomToAtom(base_atom, true, base_atom_molecule.atoms, logger)
           base_atom_molecule.atoms = base_atom.bondAtomToAtom(new_proton, true, base_atom_molecule.atoms, logger)
            base_atom_molecule.atoms = AddAtom(base_atom_molecule, new_proton, logger)
            /*base_atom_molecule = MoleculeFactory (
                base_atom_molecule.atoms,
                false,
                false,
                logger
            )*/
        }

        return {
            'base_molecule':base_atom_molecule,
            'target_molecule':target_atom_molecule
        }

    } catch(e) {
        logger.log('error', ('[Deprotonate] '+e.stack).red)
        console.log(e.stack)
        process.exit()
    }


}


module.exports = Deprotonate