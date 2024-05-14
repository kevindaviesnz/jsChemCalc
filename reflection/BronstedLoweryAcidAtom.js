/*
@see https://www.masterorganicchemistry.com/2017/09/01/reductive-amination/
@see https://cdn.masterorganicchemistry.com/wp-content/uploads/2017/08/3-mech19.png?_ga=2.237710665.832783806.1638748877-827591198.1638748877

A Lowery base is a molecule or atom that donates an electron pair.
Params in: molecule

Acid Strength:
The less stable the conjugate base, the stronger the acid.
The more stable the conjugate base, the weaker the acid.
The more positive the more acidic.
The more negative the more basic.
The more charge the more unstable.

When atoms are in the same period (row in the periodic table), we look at electronegativity. Atoms
increase in negativity as you go along the right. Electronegative atoms want electrons (are more acidic as the
conjugate base formed is more stable).

When atoms are in the same group (column in the periodic table), we look at size. As you go down the periodic table, the size
increases. Bigger atoms can spread the electronegativity better and therefore form a more stable conjugate base (are more acidic).
*/

/*
GET atoms that can donate an electron pair.
Then sort by positive charge, then electronegativity, then size, ...
*/

const Typecheck = require('../Typecheck');
const _ = require('lodash');
const FormatAs = require('../factories/FormatAs');

/**
* Get the atom most likely to accept an electron pair.
*
* @param molecule The molecule to look for the atom in.
* @param logger
*
* @return {object} Atom or undefined
*/
const BronstedLoweryAcidAtom = (acidMolecule, baseMolecule) => {

    // Get atoms that can donate a proton.
    // Only get atom that has at least one hydrogen bond and don't include oxygen atoms double bonded to a carbon, carbon atoms, and nitrogen atoms with a negative charge.
    const acid_atoms = acidMolecule.atoms.filter((a) => {
      if (a.atomicSymbol !== 'C' && a.atomicSymbol !== 'H' && a.hydrogens(acidMolecule.atoms).length > 0) {
        if (a.atomicSymbol === 'N' && a.charge(acidMolecule.atoms) === -1) {
          return false
        }
        if (a.atomicSymbol === 'O' && a.charge(acidMolecule.atoms) < 1) {
          const double_bonds = a.doubleBonds(acidMolecule.atoms, true)
          return undefined === _.find(a.doubleBonds(acidMolecule.atoms, true), (db)=>{
            return db.atom.atomicSymbol = 'C'
          })
        }
        
        return true
      }
      return false
    });

    if (acid_atoms.length === 0) {
      return undefined
    }

    if (acid_atoms.length === 1) {
      return acid_atoms[0]
    }

    // Check for atoms with a positive charge as these are the most acidic.
    // If atoms with postive charge are found then return the first one.
    const acid_atoms_with_positive_charge = acid_atoms.filter((a) => {
      return a.atomicSymbol !== 'C' && a.charge(acidMolecule.atoms) === 1;
    });

    if (acid_atoms_with_positive_charge.length > 0) {
      return acid_atoms_with_positive_charge[0];
    }

    // Sort atoms by size
    const atoms_by_size = acid_atoms.filter((a) => {
      return ['Cl', 'Br', 'I'].includes(a.atomicSymbol);
    }).sort((a, b) => {
      if (a.atomicSymbol === 'I' && b.atomicSymbol === 'Br') {
        return 1;
      }
      if (a.atomicSymbol === 'Br' && b.atomicSymbol === 'Cl') {
        return 1;
      }
      if (a.atomicSymbol === 'I' && b.atomicSymbol === 'Cl') {
        return 1;
      }
    });

    if (atoms_by_size.length > 0) {
      return atoms_by_size[0];
    }

    // Sort atoms by electronegativity
    const atoms_by_electronegativity = acid_atoms.filter((a) => {
      return ['F', 'O', 'N'].includes(a.atomicSymbol);
    }).sort((a, b) => {
      if (a.atomicSymbol === 'F' && b.atomicSymbol === 'O') {
        return 1;
      }
      if (a.atomicSymbol === 'O' && b.atomicSymbol === 'N') {
        return 1;
      }
      if (a.atomicSymbol === 'F' && b.atomicSymbol === 'N') {
        return 1;
      }
    });

    if (atoms_by_electronegativity.length > 0) {
      return atoms_by_electronegativity[0];
    }

    // Determine the functional group that is the weakest acid
    const functional_groups = moleculefunctionalGroups;
    let bronsted_lowery_acid_atom_id = null;

    // Find the atom most likely to be protonated based on the functional groups
    if (functional_groups.protonatedAlcohol.length !== 0) {
      const atoms = functional_groups.protonatedAlcohol;
      const oxygen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'O';
      });
      bronsted_lowery_acid_atom_id = atoms[oxygen_atom_index].atomId;
    } else if (functional_groups.protonatedCarboxylicAcid.length !== 0) {
      const atoms = functional_groups.protonatedCarboxylicAcid;
      const oxygen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'O' && atom.doubleBonds(molecule) === 1;
      });
      bronsted_lowery_acid_atom_id = atoms[oxygen_atom_index].atomId;
    } else if (FormatAs(molecule[0]).SMILES() === '[O+]') {
      const oxygen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'O';
      });
      bronsted_lowery_acid_atom_id = atoms.getAtomById(oxygen_atom_index).atomId;
    } else if (functional_groups.carboxylicAcid.length !== 0) {
      const atoms = functional_groups.carboxylicAcid;
      const oxygen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'O' && atom.doubleBonds(molecule) === 1;
      });
      bronsted_lowery_acid_atom_id = atoms[oxygen_atom_index].atomId;
    } else if (functional_groups.protonatedAmine.length !== 0) {
      const atoms = functional_groups.protonatedAmine;
      const nitrogen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'N';
      });
      bronsted_lowery_acid_atom_id = atoms[nitrogen_atom_index].atomId;
    } else if (functional_groups.alcohol.length !== 0) {
      const atoms = functional_groups.alcohol;
      const oxygen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'O';
      });
      bronsted_lowery_acid_atom_id = atoms[oxygen_atom_index].atomId;
    } else if (FormatAs(molecule[0]).SMILES() === 'O') {
      const atoms = acidMolecule.atoms
      const oxygen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'O';
      });
      bronsted_lowery_base_atom_id = atoms[oxygen_atom_index].atomId;
    } else if (functional_groups.amine.length !== 0) {
      const atoms = functional_groups.amine;
      const nitrogen_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'N';
      });
      bronsted_lowery_acid_atom_id = atoms[nitrogen_atom_index].atomId;
    } else if (functional_groups.alkane.length !== 0) {
      const atoms = functional_groups.alkane;
      const carbocation = _.find(atoms, (atom) => {
        return atom.isCarbocation(acidMolecule.atoms);
      });
      // 15 Aug 2023
      // See E1 reaction
      if (undefined !== carbocation) {
        // Get carbon bonds where the carbon atom has at least one hydrogen
        const carbon_atom_bond = _.find(carbocation.bonds(acidMolecule.atoms, false), (bond)=>{
          return bond.atom.hydrogens(acidMolecule.atoms)
        })
        if (undefined !== carbon_atom_bond) {
          bronsted_lowery_acid_atom_id = carbon_atom_bond.atom.atomId
        }
      }

    } else if (functional_groups.protonatedNitrile.length !== 0) {
      const atoms = functional_groups.protonatedNitrile;
      const carbon_atom_index = _.findIndex(atoms, (atom) => {
        return atom.atomicSymbol === 'C';
      });
      bronsted_lowery_acid_atom_id = atoms[carbon_atom_index].atomId;
    } else {

          // Look for carbocation
      const carbocation = _.find(acidMolecule.atoms, (a) => {
        return a.isCarbocation(acidMolecule.atoms);
      });
      if (carbocation !== undefined) {
      // Look for carbon with at least one hydrogen where the carbon is bonded to a carbocation
      const carbon_bond = _.find(carbocation.singleBonds(acidMolecule.atoms), (b) => {
        return b.atom.atomicSymbol === 'C' && b.atom.hydrogens(acidMolecule.atoms).length > 0;
      });
      if (carbon_bond !== undefined) {
        const carbon_atom_index = _.findIndex(acidMolecule.atoms, (atom) => {
          return carbon_bond.atom.atomId === atom.atomId;
        });
        bronsted_lowery_acid_atom_id = acidMolecule.atoms[carbon_atom_index].atomId;
      }
      }
    }

    if (bronsted_lowery_acid_atom_id === null) {
      return undefined;
    }

//    return acidMolecule.atoms.getAtomByAtomId(bronsted_lowery_acid_atom_id);
      const bronsted_lowery_acid_atom =_.find(acidMolecule.atoms, (atom)=>{
        return atom.atomId === bronsted_lowery_acid_atom_id
      })

      return bronsted_lowery_acid_atom

};

module.exports = BronstedLoweryAcidAtom;
