
const BronstedLoweryBaseAtom = require("../reflection/BronstedLoweryBaseAtom")
const AtomFactory = require("../factories/AtomFactory")
const Constants = require("../Constants")
const MoleculeFactory = require("../factories/MoleculeFactory")
const uniqid = require('uniqid');
/*
Get the conjugate acid of a base molecule
*/
const ConjugateAcid = (baseMolecule, acidMolecule) => {

        // FIND proton acceptor atom
        if ('A:' === baseMolecule || 'CA:' === baseMolecule) {
          return false
        }

        if ('B:' !== baseMolecule && 'CB:' !== baseMolecule) {
           const atom_to_be_protonated = BronstedLoweryBaseAtom(baseMolecule, acidMolecule); // This should not change the reactant

           if (undefined === atom_to_be_protonated) {
              return baseMolecule
           }

           proton = AtomFactory('H', 1, 0, 0, '', uniqid().substr(uniqid().length - 3, 3));
           proton[Constants.electron_index] = [];
           // Bond proton to the atom to be protonated'

           atom_to_be_protonated.makeDativeBond(proton, true, baseMolecule.atoms)
           baseMolecule.atoms.push(proton)

           baseMolecule = MoleculeFactory(
             baseMolecule.atoms,
             false,
             true
           )

        } else if('CB:' === baseMolecule) {
          baseMolecule = 'A:'
        } else if('B:' === baseMolecule) {
          baseMolecule = 'CA:'
        }

        return baseMolecule


};

module.exports = ConjugateAcid;



