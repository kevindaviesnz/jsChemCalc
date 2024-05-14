
/*
Get the conjugate base of an acid acidMolecule
*/
const BronstedLoweryAcidAtom = require("../reflection/BronstedLoweryAcidAtom")
const _ = require('lodash');
const MoleculeFactory = require("../factories/MoleculeFactory")

const ConjugateBase = (acidMolecule, logger) => {

    try {

        if (typeof acidMolecule !== 'string') {
          const atom_to_be_deprotonated = BronstedLoweryAcidAtom(acidMolecule, null, logger); // acidMolecule, baseMolecule, logger
          if (undefined === atom_to_be_deprotonated) {
            return false
          }
          // Remove a proton from the substrate acidMolecule
          let proton = atom_to_be_deprotonated.hydrogens(acidMolecule.atoms)[0];
          if (undefined === proton) {
              return false             
          }
          acidMolecule.atoms = proton.breakBond(atom_to_be_deprotonated, [acidMolecule,1], logger);
           _.remove(acidMolecule.atoms, (a) => a.atomId === proton.atomId);

          acidMolecule = MoleculeFactory(
               acidMolecule.atoms,
               false,
               true,
               logger
          )

        } else if('CA:' === acidMolecule) {
          acidMolecule = 'B:'
        } else if('A:' === acidMolecule) {
          acidMolecule = 'CB:'
        }

        return acidMolecule


    } catch(e) {

        logger.log('error', ('[ConjugateBase] '+e.stack).red)
        console.log(e.stack)
        process.exit()
    }

};

module.exports = ConjugateBase;




